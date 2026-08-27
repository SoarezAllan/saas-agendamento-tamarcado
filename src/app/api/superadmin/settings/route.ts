import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getAllSystemSettings, setSystemSetting } from '@/lib/settings';
import { testMercadoPagoConnection } from '@/lib/mercadopago';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session || session.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Acesso restrito ao Super Admin' }, { status: 403 });
    }

    const settings = await getAllSystemSettings();
    const mpStatus = await testMercadoPagoConnection(settings.MERCADO_PAGO_ACCESS_TOKEN);

    return NextResponse.json({
      settings,
      mercadoPagoStatus: mpStatus,
    });
  } catch (error: any) {
    console.error('Get settings error:', error);
    return NextResponse.json({ error: 'Erro ao carregar configurações' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session || session.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Acesso restrito ao Super Admin' }, { status: 403 });
    }

    const body = await req.json();

    const allowedKeys = [
      'MERCADO_PAGO_ACCESS_TOKEN',
      'MERCADO_PAGO_PUBLIC_KEY',
      'MERCADO_PAGO_ENVIRONMENT',
      'PLATFORM_NAME',
      'TRIAL_DAYS',
      'SUPPORT_WHATSAPP',
      'SUPPORT_EMAIL',
      'SMTP_HOST',
      'SMTP_PORT',
      'SMTP_USER',
      'SMTP_PASS',
      'SMTP_FROM',
    ];

    for (const key of allowedKeys) {
      if (body[key] !== undefined) {
        await setSystemSetting(key, String(body[key]).trim());
      }
    }

    // Test token if provided
    let mpStatus = null;
    if (body.MERCADO_PAGO_ACCESS_TOKEN !== undefined) {
      mpStatus = await testMercadoPagoConnection(body.MERCADO_PAGO_ACCESS_TOKEN);
    }

    const updatedSettings = await getAllSystemSettings();

    return NextResponse.json({
      message: 'Configurações salvas com sucesso no banco de dados!',
      settings: updatedSettings,
      mercadoPagoStatus: mpStatus,
    });
  } catch (error: any) {
    console.error('Save settings error:', error);
    return NextResponse.json({ error: 'Erro ao salvar configurações' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session || session.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Acesso restrito ao Super Admin' }, { status: 403 });
    }

    const body = await req.json();

    if (body.action === 'TEST_EMAIL') {
      const { sendEmail } = await import('@/lib/notifications');
      const targetEmail = body.to || 'tamarcado.agendamento@gmail.com';
      const success = await sendEmail({
        to: targetEmail,
        subject: 'Teste de Envio de E-mail - TáMarcado 🚀',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 24px; border: 1px solid #e4e4e7; border-radius: 16px; background-color: #ffffff; max-width: 580px; margin: 0 auto;">
            <h2 style="color: #2563eb; margin-top: 0;">E-mail de Teste Recebido com Sucesso! 🎉</h2>
            <p style="color: #374151; font-size: 14px; line-height: 1.6;">
              Parabéns! O servidor SMTP do <strong>TáMarcado</strong> está 100% conectado e funcionando perfeitamente.
            </p>
            <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; padding: 12px; margin: 16px 0; color: #166534; font-size: 13px;">
              ✅ Autenticação com o Gmail concluída. Avisos de agendamentos, recuperações de senha e suporte serão entregues instantaneamente.
            </div>
            <p style="color: #9ca3af; font-size: 11px; margin-top: 20px; border-top: 1px solid #f4f4f5; padding-top: 12px;">
              Enviado a partir do painel Super Admin às ${new Date().toLocaleString('pt-BR')}.
            </p>
          </div>
        `,
      });

      if (success) {
        return NextResponse.json({ success: true, message: `E-mail de teste enviado com sucesso para ${targetEmail}!` });
      } else {
        return NextResponse.json({ success: false, error: 'Falha ao enviar e-mail. Verifique as credenciais SMTP no banco.' }, { status: 500 });
      }
    }

    const { token } = body;
    const result = await testMercadoPagoConnection(token);

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { connected: false, error: error.message || 'Erro ao testar conexão' },
      { status: 500 }
    );
  }
}

