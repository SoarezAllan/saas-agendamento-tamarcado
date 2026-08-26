/**
 * Mercado Pago Integration Utility for TáMarcado SaaS Subscriptions
 */

import { getSystemSetting } from '@/lib/settings';

const MERCADO_PAGO_API_URL = 'https://api.mercadopago.com';

export interface CreatePreferenceOptions {
  businessId: string;
  businessName: string;
  userEmail: string;
  userName: string;
  planSlug: string;
  planName: string;
  price: number;
}

export interface PreferenceResult {
  id: string;
  initPoint: string;
  sandboxInitPoint?: string;
  isSimulated: boolean;
}

export async function getMercadoPagoToken(): Promise<string> {
  const dbToken = await getSystemSetting('MERCADO_PAGO_ACCESS_TOKEN');
  if (dbToken && dbToken.trim()) return dbToken.trim();
  return (process.env.MERCADO_PAGO_ACCESS_TOKEN || '').trim();
}

export async function testMercadoPagoConnection(customToken?: string) {
  const token = customToken || (await getMercadoPagoToken());

  if (!token || token.trim() === '' || token === 'SEU_MERCADO_PAGO_ACCESS_TOKEN_AQUI') {
    return {
      connected: false,
      isSimulated: true,
      message: 'Modo Demonstração (Nenhum Access Token configurado).',
    };
  }

  try {
    const response = await fetch(`${MERCADO_PAGO_API_URL}/users/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const err = await response.text();
      return {
        connected: false,
        error: `Falha na autenticação com o Mercado Pago (Status ${response.status})`,
      };
    }

    const data = await response.json();
    return {
      connected: true,
      user: {
        id: data.id,
        nickname: data.nickname,
        email: data.email,
        siteId: data.site_id,
      },
      message: `Conectado com sucesso à conta Mercado Pago (${data.nickname || data.email || data.id})!`,
    };
  } catch (err: any) {
    return {
      connected: false,
      error: err.message || 'Erro ao conectar à API do Mercado Pago',
    };
  }
}

export async function createMercadoPagoPreference(
  options: CreatePreferenceOptions
): Promise<PreferenceResult> {
  const token = await getMercadoPagoToken();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  // External reference used to correlate webhook back to business and plan
  const externalReference = `${options.businessId}:${options.planSlug.toLowerCase()}:${Date.now()}`;

  // If no token is configured, provide an interactive test simulator
  if (!token || token.trim() === '' || token === 'SEU_MERCADO_PAGO_ACCESS_TOKEN_AQUI') {
    const simulatedInitPoint = `${appUrl}/dashboard/billing?status=success&simulated=true&plan=${encodeURIComponent(
      options.planSlug.toUpperCase()
    )}`;

    return {
      id: `sim_pref_${Date.now()}`,
      initPoint: simulatedInitPoint,
      isSimulated: true,
    };
  }

  const payload = {
    items: [
      {
        id: options.planSlug,
        title: `Assinatura TáMarcado - Plano ${options.planName}`,
        description: `Mensalidade do software de agendamento TáMarcado para ${options.businessName}`,
        quantity: 1,
        unit_price: Number(options.price),
        currency_id: 'BRL',
      },
    ],
    payer: {
      name: options.userName,
      email: options.userEmail,
    },
    back_urls: {
      success: `${appUrl}/dashboard/billing?status=success`,
      pending: `${appUrl}/dashboard/billing?status=pending`,
      failure: `${appUrl}/dashboard/billing?status=failure`,
    },
    auto_return: 'approved',
    external_reference: externalReference,
    notification_url: `${appUrl}/api/webhooks/mercadopago`,
    statement_descriptor: 'TAMARCADO SAAS',
    payment_methods: {
      excluded_payment_types: [],
      installments: 1,
    },
  };

  const response = await fetch(`${MERCADO_PAGO_API_URL}/checkout/preferences`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error('[Mercado Pago] Preference creation failed:', errorBody);
    throw new Error(`Erro ao criar checkout no Mercado Pago: ${response.statusText}`);
  }

  const data = await response.json();

  return {
    id: data.id,
    initPoint: data.init_point,
    sandboxInitPoint: data.sandbox_init_point,
    isSimulated: false,
  };
}

export async function getMercadoPagoPayment(paymentId: string | number) {
  const token = await getMercadoPagoToken();
  if (!token) return null;

  const response = await fetch(`${MERCADO_PAGO_API_URL}/v1/payments/${paymentId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    console.error(`[Mercado Pago] Failed to fetch payment ${paymentId}`);
    return null;
  }

  return response.json();
}
