import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getMercadoPagoPayment } from '@/lib/mercadopago';

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    // Mercado Pago can send payment ID via query or body
    let paymentId =
      searchParams.get('data.id') ||
      searchParams.get('id') ||
      searchParams.get('payment_id');

    let bodyData: any = {};
    try {
      bodyData = await req.json();
    } catch {
      // Body may be empty in some IPN callbacks
    }

    if (!paymentId && bodyData) {
      paymentId = bodyData.data?.id || bodyData.id || bodyData.resource;
    }

    console.log('[Mercado Pago Webhook] Received notification:', {
      paymentId,
      topic: searchParams.get('topic') || bodyData.type || bodyData.action,
    });

    if (!paymentId) {
      return NextResponse.json({ received: true });
    }

    // Clean payment ID if it includes URL prefix
    const cleanId = String(paymentId).replace(/\D/g, '');

    // Fetch actual payment status directly from Mercado Pago API
    const payment = await getMercadoPagoPayment(cleanId);

    if (!payment) {
      console.warn(`[Mercado Pago Webhook] Could not fetch payment ${cleanId}`);
      return NextResponse.json({ received: true });
    }

    console.log(`[Mercado Pago Webhook] Payment ${cleanId} status: ${payment.status}`);

    // If payment is approved, activate or renew the subscription
    if (payment.status === 'approved') {
      const externalRef = payment.external_reference; // format: "businessId:planSlug:timestamp"
      if (!externalRef) {
        console.warn(`[Mercado Pago Webhook] No external_reference found for payment ${cleanId}`);
        return NextResponse.json({ received: true });
      }

      const [businessId, planSlug] = externalRef.split(':');

      if (!businessId || !planSlug) {
        console.warn(`[Mercado Pago Webhook] Malformed external_reference: ${externalRef}`);
        return NextResponse.json({ received: true });
      }

      const planUpper = planSlug.toUpperCase();
      const periodEnd = new Date();
      periodEnd.setDate(periodEnd.getDate() + 30); // 30 days renewal

      await db.subscription.upsert({
        where: { businessId },
        update: {
          plan: planUpper,
          status: 'ACTIVE',
          currentPeriodEnd: periodEnd,
          stripeSubscriptionId: `mp_${cleanId}`,
        },
        create: {
          businessId,
          plan: planUpper,
          status: 'ACTIVE',
          currentPeriodEnd: periodEnd,
          stripeSubscriptionId: `mp_${cleanId}`,
        },
      });

      console.log(`[Mercado Pago Webhook] Subscription ACTIVATED for business ${businessId} - Plan ${planUpper}`);
    }

    return NextResponse.json({ received: true, status: payment.status });
  } catch (error) {
    console.error('[Mercado Pago Webhook] Processing error:', error);
    // Always return 200/202 to avoid MP hammering with retries on non-critical failures
    return NextResponse.json({ received: true, error: 'Internal processing error' }, { status: 200 });
  }
}

export async function GET(req: NextRequest) {
  // Healthcheck for webhook endpoint
  return NextResponse.json({ status: 'Mercado Pago Webhook Endpoint Active' });
}
