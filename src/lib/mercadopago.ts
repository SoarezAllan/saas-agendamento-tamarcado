/**
 * Mercado Pago Integration Utility for TáMarcado SaaS Subscriptions
 */

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

export async function createMercadoPagoPreference(
  options: CreatePreferenceOptions
): Promise<PreferenceResult> {
  const token = process.env.MERCADO_PAGO_ACCESS_TOKEN;
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
  const token = process.env.MERCADO_PAGO_ACCESS_TOKEN;
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
