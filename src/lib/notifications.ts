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

import { getSystemSetting } from './settings';

// ---------------------------------------------------------------------------
// 2. Email Transporter (SMTP / Resend / Fallback)
// ---------------------------------------------------------------------------

export async function getMailTransporter() {
  const host = (await getSystemSetting('SMTP_HOST', process.env.SMTP_HOST || 'smtp.gmail.com')).trim();
  const port = Number(await getSystemSetting('SMTP_PORT', process.env.SMTP_PORT || '465')) || 465;
  const user = (await getSystemSetting('SMTP_USER', process.env.SMTP_USER || 'tamarcado.agendamento@gmail.com')).trim();
  const rawPass = await getSystemSetting('SMTP_PASS', process.env.SMTP_PASS || 'dzzlbkoraagfnowr');
  const pass = rawPass.replace(/\s+/g, ''); // Remove spaces from Google App Password

  if (user && pass) {
    if (!host || host.includes('gmail')) {
      return nodemailer.createTransport({
        service: 'gmail',
        auth: { user, pass },
        tls: {
          rejectUnauthorized: false,
        },
      });
    }

    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
      tls: {
        rejectUnauthorized: false,
      },
    });
  }

  return null;
}

export async function sendEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<boolean> {
  try {
    const transporter = await getMailTransporter();
    const customFrom = await getSystemSetting('SMTP_FROM', process.env.SMTP_FROM || '');
    const user = (await getSystemSetting('SMTP_USER', process.env.SMTP_USER || 'tamarcado.agendamento@gmail.com')).trim();
    const fromAddress = customFrom || `"TáMarcado" <${user}>`;

    // Generate fallback plain text if not provided
    const plainText =
      text ||
      html
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<br\s*[\/]?>/gi, '\n')
        .replace(/<\/p>/gi, '\n\n')
        .replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '$2 ($1)')
        .replace(/<[^>]+>/g, '')
        .replace(/\n{3,}/g, '\n\n')
        .trim();

    if (transporter) {
      const info = await transporter.sendMail({
        from: fromAddress,
        to,
        subject,
        text: plainText,
        html,
        replyTo: user,
        headers: {
          'X-Mailer': 'TaMarcado Notifier',
          'X-Auto-Response-Suppress': 'OOF, AutoReply',
        },
      });
      console.log(`[Email Service] E-mail sent successfully to ${to} (Subject: ${subject}, ID: ${info.messageId})`);
      return true;
    } else {
      console.warn(`[Email Service - Warning] No transporter configured for ${to} | Subject: ${subject}`);
      return false;
    }
  } catch (error: any) {
    console.error(`[Email Service Error] Failed to send email to ${to}:`, error.message);
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

export async function sendPasswordResetEmail({
  to,
  userName,
  resetUrl,
}: {
  to: string;
  userName: string;
  resetUrl: string;
}): Promise<boolean> {
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 28px 24px; border: 1px solid #e4e4e7; border-radius: 20px; background-color: #ffffff;">
      <div style="text-align: center; margin-bottom: 24px; padding-bottom: 20px; border-bottom: 1px solid #f4f4f5;">
        <span style="background-color: #eff6ff; color: #2563eb; padding: 6px 14px; border-radius: 9999px; font-size: 12px; font-weight: bold; letter-spacing: 0.5px; text-transform: uppercase;">
          Segurança da Conta
        </span>
        <h2 style="color: #09090b; margin: 16px 0 6px 0; font-size: 22px; font-weight: 800;">Recuperação de Senha</h2>
        <p style="color: #71717a; font-size: 13px; margin: 0;">Plataforma TáMarcado</p>
      </div>

      <p style="color: #27272a; font-size: 15px; line-height: 1.6; margin: 0 0 16px 0;">
        Olá, <strong>${userName || 'Cliente'}</strong>!
      </p>
      <p style="color: #52525b; font-size: 14px; line-height: 1.6; margin: 0 0 24px 0;">
        Recebemos uma solicitação para redefinir a senha de acesso à sua conta. Clique no botão abaixo para escolher uma nova senha:
      </p>

      <div style="text-align: center; margin: 32px 0;">
        <a href="${resetUrl}" style="background-color: #2563eb; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 14px; display: inline-block; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);">
          Redefinir Minha Senha
        </a>
      </div>

      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin: 24px 0; font-size: 12px; color: #64748b; line-height: 1.5;">
        <p style="margin: 0 0 8px 0;"><strong>⚠️ Informações de Segurança:</strong></p>
        <p style="margin: 0 0 4px 0;">• Este link é exclusivo para sua conta e expira em <strong>60 minutos</strong>.</p>
        <p style="margin: 0 0 4px 0;">• Se você não solicitou esta alteração, ignore este e-mail. Sua senha atual permanecerá segura e inalterada.</p>
      </div>

      <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #f4f4f5; font-size: 11px; color: #a1a1aa; word-break: break-all; line-height: 1.5;">
        <p style="margin: 0 0 4px 0;">Se o botão acima não funcionar, copie e cole o link direto no seu navegador:</p>
        <a href="${resetUrl}" style="color: #2563eb; text-decoration: underline;">${resetUrl}</a>
      </div>

      <p style="color: #a1a1aa; font-size: 11px; text-align: center; margin-top: 24px; margin-bottom: 0;">
        © ${new Date().getFullYear()} TáMarcado - Todos os direitos reservados.
      </p>
    </div>
  `;

  return sendEmail({
    to,
    subject: 'Recuperação de Senha - TáMarcado',
    html,
  });
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
