import nodemailer from 'nodemailer';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import db from './db';
import { formatCurrency } from './utils';

export type AppointmentEventType = 'CREATED' | 'RESCHEDULED' | 'CANCELLED' | 'STATUS_CHANGED';

export interface BookingNotificationData {
  businessName: string;
  businessPhone?: string;
  businessAddress?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  serviceName: string;
  servicePrice: number;
  professionalName: string;
  dateFormatted: string;
  timeFormatted: string;
  manageUrl: string;
  notes?: string;
}

// ---------------------------------------------------------------------------
// 1. URL Helpers (Google Calendar & WhatsApp Direct Links)
// ---------------------------------------------------------------------------

export function generateGoogleCalendarUrl(data: {
  title: string;
  description: string;
  location?: string;
  startIso: string;
  endIso: string;
}): string {
  const formatUtc = (isoStr: string) => {
    return new Date(isoStr).toISOString().replace(/-|:|\.\d\d\d/g, '');
  };

  const dates = `${formatUtc(data.startIso)}/${formatUtc(data.endIso)}`;
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: data.title,
    details: data.description,
    location: data.location || '',
    dates: dates,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function generateWhatsAppBookingUrl(data: BookingNotificationData): string {
  const priceDisplay = data.servicePrice > 0 ? `(${formatCurrency(data.servicePrice)})` : '(A combinar)';
  const message = `👋 Olá *${data.customerName}*!\n\nSeu agendamento em *${data.businessName}* foi registrado com sucesso!\n\n📅 *Data:* ${data.dateFormatted}\n⏰ *Horário:* ${data.timeFormatted}\n✂️ *Serviço:* ${data.serviceName} ${priceDisplay}\n👤 *Profissional:* ${data.professionalName}\n📍 *Endereço:* ${data.businessAddress || 'A combinar'}\n\n👉 *Gerenciar / Cancelar Agendamento:* ${data.manageUrl}\n\nTe esperamos lá! ✨`;

  const cleanPhone = data.customerPhone.replace(/\D/g, '');
  const phoneWithCountry = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;

  return `https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(message)}`;
}

// ---------------------------------------------------------------------------
// 2. Email Transporter (SMTP / Resend / Fallback)
// ---------------------------------------------------------------------------

function getMailTransporter() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && user && pass) {
    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
  }

  return null;
}

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}): Promise<boolean> {
  try {
    const transporter = getMailTransporter();
    const fromAddress = process.env.SMTP_FROM || '"TáMarcado Agendamentos" <notificacoes@tamarcado.com.br>';

    if (transporter) {
      await transporter.sendMail({
        from: fromAddress,
        to,
        subject,
        html,
      });
      console.log(`[Email Service] E-mail sent successfully to ${to} (Subject: ${subject})`);
      return true;
    } else {
      console.log(`[Email Service - Simulated] To: ${to} | Subject: ${subject}`);
      return true;
    }
  } catch (error) {
    console.error(`[Email Service Error] Failed to send email to ${to}:`, error);
    return false;
  }
}

// ---------------------------------------------------------------------------
// 3. WhatsApp Message Dispatcher (Webhook / Gateway)
// ---------------------------------------------------------------------------

export async function sendWhatsAppMessage({
  phone,
  message,
}: {
  phone: string;
  message: string;
}): Promise<boolean> {
  const cleanPhone = phone.replace(/\D/g, '');
  if (!cleanPhone) return false;

  const phoneWithCountry = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
  const apiUrl = process.env.WHATSAPP_API_URL;
  const apiToken = process.env.WHATSAPP_API_TOKEN;

  if (apiUrl) {
    try {
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(apiToken ? { Authorization: `Bearer ${apiToken}` } : {}),
        },
        body: JSON.stringify({
          phone: phoneWithCountry,
          number: phoneWithCountry,
          message: message,
          text: message,
        }),
      });

      if (!res.ok) {
        console.warn(`[WhatsApp API Warning] Response status ${res.status} for ${phoneWithCountry}`);
      } else {
        console.log(`[WhatsApp API] Notification sent to ${phoneWithCountry}`);
      }
      return true;
    } catch (err) {
      console.error(`[WhatsApp API Error] Could not reach gateway for ${phoneWithCountry}:`, err);
      return false;
    }
  } else {
    console.log(`[WhatsApp Service - Simulated] To: ${phoneWithCountry}\nMessage: ${message}`);
    return true;
  }
}

// ---------------------------------------------------------------------------
// 4. Central Multi-Stakeholder Notification Engine
// ---------------------------------------------------------------------------

/**
 * Notifies the Business Owner and the Professional on appointment creation, update, or cancellation.
 * Rule: "se tiver apenas o proprietario, só ele recebe" (avoids duplicates if owner is the professional).
 */
export async function dispatchAppointmentNotification(
  eventType: AppointmentEventType,
  appointmentId: string
) {
  try {
    const appointment = await db.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        service: true,
        professional: true,
        business: {
          include: {
            users: {
              where: { role: 'ADMIN' },
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
    });

    if (!appointment || !appointment.business) {
      console.warn(`[Notification Engine] Appointment or business not found for ID: ${appointmentId}`);
      return;
    }

    const { business, service, professional } = appointment;
    const ownerUser = business.users[0];

    const ownerEmail = business.email || ownerUser?.email;
    const ownerPhone = business.phone;
    const ownerName = ownerUser?.name || business.name;

    const profEmail = professional.email;
    const profPhone = professional.phone;
    const profName = professional.name;

    // Check if the business has only the owner or if the professional IS the owner
    const isOwnerOnly =
      !profEmail && !profPhone
        ? true
        : (profEmail && ownerEmail && profEmail.toLowerCase() === ownerEmail.toLowerCase()) ||
          (profPhone && ownerPhone && profPhone.replace(/\D/g, '') === ownerPhone.replace(/\D/g, '')) ||
          profName.trim().toLowerCase() === ownerName.trim().toLowerCase();

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const dateFormatted = format(new Date(appointment.startTime), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    const timeFormatted = `${format(new Date(appointment.startTime), 'HH:mm')} às ${format(new Date(appointment.endTime), 'HH:mm')}`;
    const priceDisplay = appointment.totalPrice > 0 ? formatCurrency(appointment.totalPrice) : 'Sob avaliação';
    const dashboardUrl = `${baseUrl}/dashboard/calendar`;
    const clientPhoneClean = appointment.customerPhone.replace(/\D/g, '');
    const clientWhatsAppLink = `https://wa.me/${clientPhoneClean.startsWith('55') ? clientPhoneClean : `55${clientPhoneClean}`}`;

    // Event title labels
    const eventHeaders = {
      CREATED: {
        badge: 'Novo Agendamento Confirmado',
        title: 'Novo Agendamento Recebido!',
        color: '#2563eb',
      },
      RESCHEDULED: {
        badge: 'Agendamento Reagendado',
        title: 'Horário do Agendamento Foi Alterado!',
        color: '#f59e0b',
      },
      CANCELLED: {
        badge: 'Agendamento Cancelado',
        title: 'Um Agendamento Foi Cancelado',
        color: '#e11d48',
      },
      STATUS_CHANGED: {
        badge: `Status Atualizado (${appointment.status})`,
        title: `Status do Agendamento Atualizado para: ${appointment.status}`,
        color: '#059669',
      },
    };

    const header = eventHeaders[eventType] || eventHeaders.CREATED;

    // ----------------------------------------------------
    // A) NOTIFY OWNER (PROPRIETÁRIO)
    // ----------------------------------------------------
    const ownerWhatsAppMsg = `🔔 *${header.title}*\n🏢 *${business.name}*\n\n👤 *Cliente:* ${appointment.customerName} (${appointment.customerPhone})\n✂️ *Serviço:* ${service.name} (${priceDisplay})\n👨‍💼 *Profissional:* ${profName}\n📅 *Data:* ${dateFormatted}\n⏰ *Horário:* ${timeFormatted}\n📊 *Status:* ${appointment.status}\n${appointment.notes ? `📝 *Observações:* ${appointment.notes}\n` : ''}\n👉 *Ver na Agenda:* ${dashboardUrl}`;

    const ownerEmailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 16px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 20px;">
          <span style="background-color: ${header.color}; color: #ffffff; padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: bold; text-transform: uppercase;">
            ${header.badge}
          </span>
          <h2 style="color: #111827; margin: 16px 0 6px 0; font-size: 22px;">${header.title}</h2>
          <p style="color: #6b7280; font-size: 14px; margin: 0;">${business.name}</p>
        </div>

        <div style="background-color: #f9fafb; border: 1px solid #f3f4f6; border-radius: 12px; padding: 18px; margin: 20px 0; font-size: 14px; color: #374151;">
          <p style="margin: 6px 0;"><strong>👤 Cliente:</strong> ${appointment.customerName}</p>
          <p style="margin: 6px 0;"><strong>📱 Telefone/WhatsApp:</strong> <a href="${clientWhatsAppLink}" style="color: #2563eb; text-decoration: none; font-weight: bold;">${appointment.customerPhone} (Abrir Whats)</a></p>
          <p style="margin: 6px 0;"><strong>✂️ Serviço:</strong> ${service.name}</p>
          <p style="margin: 6px 0;"><strong>👨‍💼 Profissional Responsável:</strong> ${profName}</p>
          <p style="margin: 6px 0;"><strong>📅 Data:</strong> ${dateFormatted}</p>
          <p style="margin: 6px 0;"><strong>⏰ Horário:</strong> ${timeFormatted}</p>
          <p style="margin: 6px 0;"><strong>💰 Valor:</strong> ${priceDisplay}</p>
          <p style="margin: 6px 0;"><strong>📌 Status:</strong> <span style="font-weight: bold;">${appointment.status}</span></p>
          ${appointment.notes ? `<p style="margin: 6px 0;"><strong>📝 Observações:</strong> ${appointment.notes}</p>` : ''}
        </div>

        <div style="text-align: center; margin: 28px 0 10px 0;">
          <a href="${dashboardUrl}" style="background-color: #111827; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 10px; font-weight: bold; font-size: 14px; display: inline-block;">
            Abrir Painel & Agenda
          </a>
        </div>

        <p style="color: #9ca3af; font-size: 11px; text-align: center; margin-top: 24px; border-top: 1px solid #f3f4f6; padding-top: 16px;">
          Notificação automática do sistema TáMarcado para o proprietário de ${business.name}.
        </p>
      </div>
    `;

    if (ownerPhone) {
      await sendWhatsAppMessage({ phone: ownerPhone, message: ownerWhatsAppMsg });
    }
    if (ownerEmail) {
      await sendEmail({
        to: ownerEmail,
        subject: `[${header.badge}] ${appointment.customerName} - ${service.name} (${business.name})`,
        html: ownerEmailHtml,
      });
    }

    // ----------------------------------------------------
    // B) NOTIFY PROFESSIONAL (PROFISSIONAL)
    // Se for o mesmo que o proprietário, NÃO envia duplicado!
    // ----------------------------------------------------
    if (!isOwnerOnly) {
      const profWhatsAppMsg = `👋 Olá *${profName}*!\n\n🔔 *${header.title}*\n🏢 *${business.name}*\n\n👤 *Cliente:* ${appointment.customerName} (${appointment.customerPhone})\n✂️ *Serviço:* ${service.name} (${priceDisplay})\n📅 *Data:* ${dateFormatted}\n⏰ *Horário:* ${timeFormatted}\n📊 *Status:* ${appointment.status}\n${appointment.notes ? `📝 *Observações:* ${appointment.notes}\n` : ''}\n👉 *Ver Sua Agenda:* ${dashboardUrl}`;

      const profEmailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 16px; background-color: #ffffff;">
          <div style="text-align: center; margin-bottom: 20px;">
            <span style="background-color: ${header.color}; color: #ffffff; padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: bold; text-transform: uppercase;">
              Sua Agenda • ${header.badge}
            </span>
            <h2 style="color: #111827; margin: 16px 0 6px 0; font-size: 22px;">Olá, ${profName}!</h2>
            <p style="color: #6b7280; font-size: 14px; margin: 0;">${header.title} em <strong>${business.name}</strong></p>
          </div>

          <div style="background-color: #f9fafb; border: 1px solid #f3f4f6; border-radius: 12px; padding: 18px; margin: 20px 0; font-size: 14px; color: #374151;">
            <p style="margin: 6px 0;"><strong>👤 Cliente:</strong> ${appointment.customerName}</p>
            <p style="margin: 6px 0;"><strong>📱 Telefone:</strong> <a href="${clientWhatsAppLink}" style="color: #2563eb; text-decoration: none; font-weight: bold;">${appointment.customerPhone}</a></p>
            <p style="margin: 6px 0;"><strong>✂️ Serviço:</strong> ${service.name}</p>
            <p style="margin: 6px 0;"><strong>📅 Data:</strong> ${dateFormatted}</p>
            <p style="margin: 6px 0;"><strong>⏰ Horário:</strong> ${timeFormatted}</p>
            <p style="margin: 6px 0;"><strong>💰 Valor:</strong> ${priceDisplay}</p>
            <p style="margin: 6px 0;"><strong>📌 Status:</strong> <span style="font-weight: bold;">${appointment.status}</span></p>
            ${appointment.notes ? `<p style="margin: 6px 0;"><strong>📝 Observações:</strong> ${appointment.notes}</p>` : ''}
          </div>

          <div style="text-align: center; margin: 28px 0 10px 0;">
            <a href="${dashboardUrl}" style="background-color: #2563eb; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 10px; font-weight: bold; font-size: 14px; display: inline-block;">
              Acessar Minha Agenda
            </a>
          </div>

          <p style="color: #9ca3af; font-size: 11px; text-align: center; margin-top: 24px; border-top: 1px solid #f3f4f6; padding-top: 16px;">
            Notificação da sua escala profissional em ${business.name}.
          </p>
        </div>
      `;

      if (profPhone) {
        await sendWhatsAppMessage({ phone: profPhone, message: profWhatsAppMsg });
      }
      if (profEmail) {
        await sendEmail({
          to: profEmail,
          subject: `[Sua Agenda] ${header.badge}: ${appointment.customerName} - ${service.name}`,
          html: profEmailHtml,
        });
      }
    }
  } catch (error) {
    console.error('[Notification Engine Error] Failed to dispatch stakeholder notifications:', error);
  }
}

// ---------------------------------------------------------------------------
// 5. Customer Confirmation Notification Helper
// ---------------------------------------------------------------------------

export function generateCustomerConfirmationEmail(data: BookingNotificationData): {
  subject: string;
  html: string;
} {
  const priceDisplay = data.servicePrice > 0 ? formatCurrency(data.servicePrice) : 'A combinar';

  return {
    subject: `Agendamento Confirmado - ${data.businessName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #ffffff;">
        <h2 style="color: #1f2937; margin-top: 0;">Agendamento Confirmado! 🎉</h2>
        <p style="color: #4b5563; font-size: 16px;">Olá <strong>${data.customerName}</strong>, seu horário em <strong>${data.businessName}</strong> está garantido.</p>
        
        <div style="background-color: #f3f4f6; border-radius: 8px; padding: 16px; margin: 20px 0;">
          <p style="margin: 6px 0; color: #374151;"><strong>✂️ Serviço:</strong> ${data.serviceName}</p>
          <p style="margin: 6px 0; color: #374151;"><strong>👤 Profissional:</strong> ${data.professionalName}</p>
          <p style="margin: 6px 0; color: #374151;"><strong>📅 Data:</strong> ${data.dateFormatted}</p>
          <p style="margin: 6px 0; color: #374151;"><strong>⏰ Horário:</strong> ${data.timeFormatted}</p>
          <p style="margin: 6px 0; color: #374151;"><strong>💰 Valor:</strong> ${priceDisplay}</p>
          ${data.businessAddress ? `<p style="margin: 6px 0; color: #374151;"><strong>📍 Endereço:</strong> ${data.businessAddress}</p>` : ''}
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${data.manageUrl}" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            Visualizar ou Remarcar Agendamento
          </a>
        </div>

        <p style="color: #9ca3af; font-size: 12px; text-align: center; border-top: 1px solid #e5e7eb; padding-top: 16px; margin-top: 24px;">
          Enviado automaticamente por ${data.businessName} via plataforma TáMarcado.
        </p>
      </div>
    `,
  };
}

export async function sendSimulatedNotification(type: 'email' | 'whatsapp', data: any) {
  if (type === 'email' && data.to) {
    return sendEmail({ to: data.to, subject: data.subject, html: data.html });
  }
  if (type === 'whatsapp' && data.phone) {
    return sendWhatsAppMessage({ phone: data.phone, message: data.message });
  }
  return { success: true };
}
