import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { sendEmail } from '@/lib/notifications';

const SUPPORT_DESTINATION_EMAIL = 'tamarcado.agendamento@gmail.com';

// Strict email regex
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export async function POST(req: NextRequest) {
  try {
    const clientIp = getClientIp(req);

    // 1. Strict Rate Limiting: Max 4 support requests per 15 minutes per IP
    const rateLimit = checkRateLimit(`support_form_${clientIp}`, 4, 15 * 60 * 1000);
    if (!rateLimit.success) {
      return NextResponse.json(
        {
          error: 'Muitas mensagens enviadas recentemente. Por favor, aguarde alguns minutos antes de tentar novamente.',
        },
        { status: 429 }
      );
    }

    const body = await req.json();
    const {
      name,
      email,
      phone,
      subject,
      message,
      honeypot, // Hidden anti-bot trap field
      renderTimestamp, // Anti-speed bot check
    } = body;

    // 2. Anti-Bot Honeypot: If hidden field is filled, silently discard
    if (honeypot && String(honeypot).trim().length > 0) {
      console.warn(`[Anti-Bot Trap Triggered] Support submission blocked from IP ${clientIp}`);
      return NextResponse.json({ success: true, message: 'Mensagem enviada com sucesso!' });
    }

    // 3. Anti-Bot Submission Speed Check (Bots fill in < 1.2 seconds)
    if (renderTimestamp) {
      const formFillDuration = Date.now() - Number(renderTimestamp);
      if (formFillDuration < 1200) {
        console.warn(`[Anti-Bot Speed Triggered] Submission under 1.2s from IP ${clientIp}`);
        return NextResponse.json({ success: true, message: 'Mensagem enviada com sucesso!' });
      }
    }

    // 4. Input Sanitization & Validation
    if (!name || typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 100) {
      return NextResponse.json({ error: 'Por favor, informe seu nome completo.' }, { status: 400 });
    }

    if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim()) || email.trim().length > 150) {
      return NextResponse.json({ error: 'Por favor, informe um endereço de e-mail válido.' }, { status: 400 });
    }

    if (!phone || typeof phone !== 'string' || phone.replace(/\D/g, '').length < 8) {
      return NextResponse.json({ error: 'Por favor, informe um número de telefone/WhatsApp válido.' }, { status: 400 });
    }

    if (!message || typeof message !== 'string' || message.trim().length < 10 || message.trim().length > 3000) {
      return NextResponse.json(
        { error: 'A mensagem deve conter entre 10 e 3000 caracteres.' },
        { status: 400 }
      );
    }

    const cleanName = name.trim().replace(/[<>]/g, '');
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.trim().replace(/[<>]/g, '');
    const cleanSubject = subject ? subject.trim().replace(/[<>]/g, '').slice(0, 150) : 'Dúvida / Suporte Geral';
    const cleanMessage = message.trim().replace(/[<>]/g, '');

    const phoneDigits = cleanPhone.replace(/\D/g, '');
    const whatsAppLink = `https://wa.me/${phoneDigits.startsWith('55') ? phoneDigits : `55${phoneDigits}`}`;

    // 5. Build Protected HTML Email
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 16px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid #f3f4f6;">
          <span style="background-color: #2563eb; color: #ffffff; padding: 4px 12px; border-radius: 12px; font-size: 11px; font-weight: bold; text-transform: uppercase;">
            Nova Mensagem de Suporte
          </span>
          <h2 style="color: #111827; margin: 12px 0 4px 0; font-size: 20px;">Contato do Site - TáMarcado</h2>
          <p style="color: #6b7280; font-size: 13px; margin: 0;">Recebido via formulário de suporte da Landing Page</p>
        </div>

        <div style="background-color: #f9fafb; border: 1px solid #f3f4f6; border-radius: 12px; padding: 18px; margin: 20px 0; font-size: 14px; color: #374151;">
          <p style="margin: 6px 0;"><strong>👤 Nome:</strong> ${cleanName}</p>
          <p style="margin: 6px 0;"><strong>✉️ E-mail:</strong> <a href="mailto:${cleanEmail}" style="color: #2563eb; text-decoration: none; font-weight: bold;">${cleanEmail}</a></p>
          <p style="margin: 6px 0;"><strong>📱 WhatsApp/Telefone:</strong> <a href="${whatsAppLink}" style="color: #059669; text-decoration: none; font-weight: bold;">${cleanPhone} (Abrir no WhatsApp)</a></p>
          <p style="margin: 6px 0;"><strong>📌 Assunto:</strong> ${cleanSubject}</p>
          <p style="margin: 6px 0;"><strong>🌐 IP de Origem:</strong> ${clientIp}</p>
        </div>

        <div style="background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 18px; margin: 20px 0;">
          <h4 style="margin: 0 0 10px 0; color: #111827; font-size: 14px; text-transform: uppercase; font-weight: bold;">Conteúdo da Mensagem:</h4>
          <p style="margin: 0; color: #374151; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${cleanMessage}</p>
        </div>

        <div style="text-align: center; margin: 28px 0 10px 0;">
          <a href="mailto:${cleanEmail}?subject=Re: ${encodeURIComponent(cleanSubject)} - Suporte TáMarcado" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 13px; display: inline-block; margin-right: 8px;">
            Responder por E-mail
          </a>
          <a href="${whatsAppLink}" style="background-color: #059669; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 13px; display: inline-block;">
            Chamar no WhatsApp
          </a>
        </div>

        <p style="color: #9ca3af; font-size: 11px; text-align: center; margin-top: 24px; border-top: 1px solid #f3f4f6; padding-top: 14px;">
          Formulário protegido por Rate Limiting & HoneyPot Anti-Spam • TáMarcado
        </p>
      </div>
    `;

    // 6. Dispatch Email to destination
    const emailSent = await sendEmail({
      to: SUPPORT_DESTINATION_EMAIL,
      subject: `[Suporte TáMarcado] ${cleanSubject} - ${cleanName}`,
      html: emailHtml,
    });

    return NextResponse.json({
      success: true,
      message: 'Sua mensagem foi enviada com sucesso! Nossa equipe entrará em contato em breve.',
      emailDelivered: emailSent,
    });
  } catch (error) {
    console.error('Support form error:', error);
    return NextResponse.json(
      { error: 'Ocorreu um erro ao enviar sua mensagem. Por favor, tente novamente ou use o WhatsApp direto.' },
      { status: 500 }
    );
  }
}

