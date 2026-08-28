/**
 * Mercado Pago Integration Engine for TáMarcado SaaS Subscriptions
 * Full support for Credit Card (with 7 days free trial auto-charge) and Pix (with 7 days trial window)
 */

import { getSystemSetting } from '@/lib/settings';

const MERCADO_PAGO_API_URL = 'https://api.mercadopago.com';

export type BillingCycle = 'MONTHLY' | 'QUARTERLY' | 'ANNUAL';
export type PaymentMethodType = 'CREDIT_CARD' | 'PIX';

export interface CreateCheckoutOptions {
  businessId: string;
  businessName: string;
  userEmail: string;
  userName: string;
  planSlug: string;
  planName: string;
  price: number;
  billingCycle: BillingCycle;
  paymentMethod: PaymentMethodType;
  payerCpf?: string;
  cardToken?: string;
}

export interface CheckoutResult {
  id: string;
  initPoint?: string;
  sandboxInitPoint?: string;
  isSimulated: boolean;
  paymentMethod: PaymentMethodType;
  billingCycle: BillingCycle;
  price: number;
  trialDays: number;
  trialEndsAt: string;
  firstChargeDate: string;
  pixQrCodeBase64?: string;
  pixQrCodeText?: string;
  pixExpiration?: string;
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
      message: 'Modo Demonstração (Nenhum Access Token configurado no Super Admin).',
    };
  }

  try {
    const response = await fetch(`${MERCADO_PAGO_API_URL}/users/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
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

export async function createMercadoPagoCheckout(
  options: CreateCheckoutOptions
): Promise<CheckoutResult> {
  const token = await getMercadoPagoToken();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  const trialDays = 7;
  const now = new Date();
  const trialEndsDate = new Date(now.getTime() + trialDays * 24 * 60 * 60 * 1000);
  const trialEndsAtIso = trialEndsDate.toISOString();

  // External reference: "businessId:planSlug:billingCycle:paymentMethod:timestamp"
  const externalReference = `${options.businessId}:${options.planSlug.toLowerCase()}:${options.billingCycle}:${options.paymentMethod}:${Date.now()}`;

  const cycleLabels: Record<BillingCycle, string> = {
    MONTHLY: 'Mensal',
    QUARTERLY: 'Trimestral',
    ANNUAL: 'Anual',
  };

  const cycleLabel = cycleLabels[options.billingCycle] || 'Mensal';

  // -------------------------------------------------------------------------
  // 1. SIMULATOR / FALLBACK (When no Mercado Pago Token is configured)
  // -------------------------------------------------------------------------
  if (!token || token.trim() === '' || token === 'SEU_MERCADO_PAGO_ACCESS_TOKEN_AQUI') {
    if (options.paymentMethod === 'PIX') {
      const simulatedPixKey = `00020126580014br.gov.bcb.pix0136${options.businessId}520400005303986540${options.price.toFixed(2)}5802BR5913TAMARCADO SAAS6009SAO PAULO62070503***6304`;
      return {
        id: `sim_pix_${Date.now()}`,
        isSimulated: true,
        paymentMethod: 'PIX',
        billingCycle: options.billingCycle,
        price: options.price,
        trialDays,
        trialEndsAt: trialEndsAtIso,
        firstChargeDate: trialEndsAtIso,
        pixQrCodeText: simulatedPixKey,
        pixQrCodeBase64: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="%23ffffff"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="14" fill="%232563eb">QR Code Pix Simulado</text></svg>',
        pixExpiration: trialEndsAtIso,
      };
    } else {
      const simulatedInitPoint = `${appUrl}/dashboard/billing?status=success&simulated=true&plan=${encodeURIComponent(
        options.planSlug.toUpperCase()
      )}&cycle=${options.billingCycle}&method=CREDIT_CARD`;

      return {
        id: `sim_card_${Date.now()}`,
        initPoint: simulatedInitPoint,
        isSimulated: true,
        paymentMethod: 'CREDIT_CARD',
        billingCycle: options.billingCycle,
        price: options.price,
        trialDays,
        trialEndsAt: trialEndsAtIso,
        firstChargeDate: trialEndsAtIso,
      };
    }
  }

  // -------------------------------------------------------------------------
  // 2. REAL MERCADO PAGO API
  // -------------------------------------------------------------------------

  // A) DIRECT PIX GENERATION (Instant QR Code & Copia e Cola)
  if (options.paymentMethod === 'PIX') {
    try {
      const pixPayload = {
        transaction_amount: Number(options.price),
        description: `TáMarcado - Plano ${options.planName} (${cycleLabel}) - 7 Dias de Teste Grátis`,
        payment_method_id: 'pix',
        external_reference: externalReference,
        notification_url: `${appUrl}/api/webhooks/mercadopago`,
        payer: {
          email: options.userEmail,
          first_name: options.userName.split(' ')[0] || options.userName,
          last_name: options.userName.split(' ').slice(1).join(' ') || 'Cliente',
          ...(options.payerCpf ? { identification: { type: 'CPF', number: options.payerCpf.replace(/\D/g, '') } } : {}),
        },
        date_of_expiration: trialEndsDate.toISOString(),
      };

      const res = await fetch(`${MERCADO_PAGO_API_URL}/v1/payments`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-Idempotency-Key': `pix_${options.businessId}_${Date.now()}`,
        },
        body: JSON.stringify(pixPayload),
      });

      if (res.ok) {
        const pixData = await res.json();
        const txData = pixData.point_of_interaction?.transaction_data;

        return {
          id: String(pixData.id),
          isSimulated: false,
          paymentMethod: 'PIX',
          billingCycle: options.billingCycle,
          price: options.price,
          trialDays,
          trialEndsAt: trialEndsAtIso,
          firstChargeDate: trialEndsAtIso,
          pixQrCodeBase64: txData?.qr_code_base64 ? `data:image/png;base64,${txData.qr_code_base64}` : undefined,
          pixQrCodeText: txData?.qr_code || undefined,
          pixExpiration: pixData.date_of_expiration || trialEndsAtIso,
        };
      } else {
        const errText = await res.text();
        console.warn('[Mercado Pago Pix Direct Error, falling back to Preference]:', errText);
      }
    } catch (pixErr) {
      console.error('[Mercado Pago Pix Exception]:', pixErr);
    }
  }

  // B) PREFERENCE CHECKOUT (Credit Card with 7 days free trial info & transparent gateway)
  const preferencePayload = {
    items: [
      {
        id: `${options.planSlug}_${options.billingCycle.toLowerCase()}`,
        title: `Assinatura TáMarcado - Plano ${options.planName} (${cycleLabel})`,
        description: `7 dias de teste grátis. Primeira cobrança de R$ ${options.price.toFixed(2)} em ${trialEndsDate.toLocaleDateString('pt-BR')} caso não haja cancelamento.`,
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
      success: `${appUrl}/dashboard/billing/sucesso?status=success&cycle=${options.billingCycle}&method=${options.paymentMethod}`,
      pending: `${appUrl}/dashboard/billing?status=pending&cycle=${options.billingCycle}&method=${options.paymentMethod}`,
      failure: `${appUrl}/dashboard/billing?status=failure`,
    },
    auto_return: 'approved',
    external_reference: externalReference,
    notification_url: `${appUrl}/api/webhooks/mercadopago`,
    statement_descriptor: 'TAMARCADO SAAS',
    payment_methods: {
      excluded_payment_types: options.paymentMethod === 'CREDIT_CARD' ? [{ id: 'ticket' }] : [],
      installments: 1,
    },
  };

  const response = await fetch(`${MERCADO_PAGO_API_URL}/checkout/preferences`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(preferencePayload),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error('[Mercado Pago] Preference creation failed:', errorBody);
    throw new Error(`Erro ao gerar checkout do Mercado Pago: ${response.statusText}`);
  }

  const data = await response.json();

  return {
    id: data.id,
    initPoint: data.init_point,
    sandboxInitPoint: data.sandbox_init_point,
    isSimulated: false,
    paymentMethod: options.paymentMethod,
    billingCycle: options.billingCycle,
    price: options.price,
    trialDays,
    trialEndsAt: trialEndsAtIso,
    firstChargeDate: trialEndsAtIso,
  };
}

export async function getMercadoPagoPayment(paymentId: string | number) {
  const token = await getMercadoPagoToken();
  if (!token) return null;

  try {
    const response = await fetch(`${MERCADO_PAGO_API_URL}/v1/payments/${paymentId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      console.error(`[Mercado Pago] Failed to fetch payment ${paymentId}: ${response.status}`);
      return null;
    }

    return response.json();
  } catch (err) {
    console.error(`[Mercado Pago] Error fetching payment ${paymentId}:`, err);
    return null;
  }
}

export async function getMercadoPagoMerchantOrder(orderId: string | number) {
  const token = await getMercadoPagoToken();
  if (!token) return null;

  try {
    const response = await fetch(`${MERCADO_PAGO_API_URL}/merchant_orders/${orderId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      console.error(`[Mercado Pago] Failed to fetch merchant order ${orderId}: ${response.status}`);
      return null;
    }

    return response.json();
  } catch (err) {
    console.error(`[Mercado Pago] Error fetching merchant order ${orderId}:`, err);
    return null;
  }
}

export async function getMercadoPagoPreference(preferenceId: string) {
  const token = await getMercadoPagoToken();
  if (!token) return null;

  try {
    const response = await fetch(`${MERCADO_PAGO_API_URL}/checkout/preferences/${preferenceId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      console.error(`[Mercado Pago] Failed to fetch preference ${preferenceId}: ${response.status}`);
      return null;
    }

    return response.json();
  } catch (err) {
    console.error(`[Mercado Pago] Error fetching preference ${preferenceId}:`, err);
    return null;
  }
}

export async function searchMercadoPagoPayments(query: { external_reference?: string; limit?: number }) {
  const token = await getMercadoPagoToken();
  if (!token) return [];

  try {
    const params = new URLSearchParams();
    if (query.external_reference) params.set('external_reference', query.external_reference);
    params.set('sort', 'date_created');
    params.set('criteria', 'desc');
    params.set('limit', String(query.limit || 10));

    const response = await fetch(`${MERCADO_PAGO_API_URL}/v1/payments/search?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      console.error(`[Mercado Pago] Failed to search payments: ${response.status}`);
      return [];
    }

    const data = await response.json();
    return data.results || [];
  } catch (err) {
    console.error('[Mercado Pago] Error searching payments:', err);
    return [];
  }
}
