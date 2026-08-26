import { formatCurrency } from './utils';

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
  const message = `👋 Olá *${data.customerName}*!\n\nSeu agendamento em *${data.businessName}* foi registrado com sucesso!\n\n📅 *Data:* ${data.dateFormatted}\n⏰ *Horário:* ${data.timeFormatted}\n✂️ *Serviço:* ${data.serviceName} (${formatCurrency(data.servicePrice)})\n👤 *Profissional:* ${data.professionalName}\n📍 *Endereço:* ${data.businessAddress || 'A combinar'}\n\n👉 *Gerenciar / Cancelar Agendamento:* ${data.manageUrl}\n\nTe esperamos lá! ✨`;

  const cleanPhone = data.customerPhone.replace(/\D/g, '');
  const phoneWithCountry = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;

  return `https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(message)}`;
}

export function generateCustomerConfirmationEmail(data: BookingNotificationData): {
  subject: string;
  html: string;
} {
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
          <p style="margin: 6px 0; color: #374151;"><strong>💰 Valor:</strong> ${formatCurrency(data.servicePrice)}</p>
          ${data.businessAddress ? `<p style="margin: 6px 0; color: #374151;"><strong>📍 Endereço:</strong> ${data.businessAddress}</p>` : ''}
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${data.manageUrl}" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            Visualizar ou Remarcar Agendamento
          </a>
        </div>

        <p style="color: #9ca3af; font-size: 12px; text-align: center; border-top: 1px solid #e5e7eb; padding-top: 16px; margin-top: 24px;">
          Enviado automaticamente por ${data.businessName} via plataforma de agendamento online.
        </p>
      </div>
    `,
  };
}

export async function sendSimulatedNotification(type: 'email' | 'whatsapp', data: any) {
  // In production, this can connect directly to Resend/SendGrid or Twilio/Z-API
  console.log(`[Notification Engine] [${type.toUpperCase()}] Event dispatched:`, data);
  return { success: true };
}

