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

    const { token } = await req.json();
    const result = await testMercadoPagoConnection(token);

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { connected: false, error: error.message || 'Erro ao testar conexão' },
      { status: 500 }
    );
  }
}
