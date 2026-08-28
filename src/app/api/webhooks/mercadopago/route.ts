import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getMercadoPagoPayment, getMercadoPagoMerchantOrder } from '@/lib/mercadopago';

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    // Mercado Pago can send payment ID via query or body
    let paymentId =
      searchParams.get('data.id') ||
      searchParams.get('id') ||
      searchParams.get('payment_id');

    const topic = searchParams.get('topic') || searchParams.get('type');

    let bodyData: any = {};
    try {
      bodyData = await req.json();
    } catch {
      // Body may be empty in some IPN callbacks
    }

    if (!paymentId && bodyData) {
      paymentId = bodyData.data?.id || bodyData.id || bodyData.resource;
    }

    const currentTopic = topic || bodyData.type || bodyData.action;

    console.log('[Mercado Pago Webhook] Notification received:', {
      paymentId,
      topic: currentTopic,
    });

    if (!paymentId) {
      return NextResponse.json({ received: true });
    }

    // Clean ID
    const cleanId = String(paymentId).replace(/\D/g, '');
    let payment: any = null;

    if (currentTopic === 'merchant_order' || String(paymentId).includes('merchant_orders')) {
      const order = await getMercadoPagoMerchantOrder(cleanId);
      if (order && order.payments && order.payments.length > 0) {
        const approved = order.payments.find((p: any) => p.status === 'approved') || order.payments[0];
        if (approved) {
          payment = await getMercadoPagoPayment(approved.id);
        }
      }
    } else {
      payment = await getMercadoPagoPayment(cleanId);
    }

    if (!payment) {
      console.warn(`[Mercado Pago Webhook] Could not fetch payment ${cleanId}`);
      return NextResponse.json({ received: true });
    }

    console.log(`[Mercado Pago Webhook] Payment ${cleanId} status: ${payment.status}`);

    // If payment is approved, activate or renew the subscription
    if (payment.status === 'approved' || payment.status === 'accredited') {
      const externalRef = payment.external_reference; // format: "businessId:planSlug:billingCycle:paymentMethod:timestamp"
      let businessId = '';
      let planSlug = 'STARTER';
      let cycle = 'MONTHLY';
      let method = 'CREDIT_CARD';

      if (externalRef) {
        const parts = String(externalRef).split(':');
        businessId = parts[0] || '';
        planSlug = parts[1] || 'STARTER';
        cycle = parts[2] || 'MONTHLY';
        method = parts[3] || 'CREDIT_CARD';
      }

      if (!businessId && payment.payer?.email) {
        const userWithEmail = await db.user.findFirst({
          where: { email: payment.payer.email.toLowerCase().trim() },
        });
        if (userWithEmail?.businessId) {
          businessId = userWithEmail.businessId;
        }
      }

      if (!businessId) {
        console.warn(`[Mercado Pago Webhook] Could not identify businessId for payment ${cleanId}`);
        return NextResponse.json({ received: true });
      }

      const planUpper = planSlug.toUpperCase();
      const cycleUpper = cycle.toUpperCase();
      const methodUpper = method.toUpperCase();

      // Calculate period duration based on cycle starting from payment date
      let daysToAdd = 30;
      if (cycleUpper === 'QUARTERLY') daysToAdd = 90;
      else if (cycleUpper === 'ANNUAL') daysToAdd = 365;

      const paymentDate = payment.date_approved ? new Date(payment.date_approved) : new Date();
      const periodEnd = new Date(paymentDate.getTime() + daysToAdd * 24 * 60 * 60 * 1000);

      await db.subscription.upsert({
        where: { businessId },
        update: {
          plan: planUpper,
          status: 'ACTIVE',
          billingCycle: cycleUpper,
          paymentMethod: methodUpper,
          currentPeriodEnd: periodEnd,
          trialEndsAt: null,
          cancelAtPeriodEnd: false,
          mercadoPagoPaymentId: String(payment.id),
          updatedAt: new Date(),
        },
        create: {
          businessId,
          plan: planUpper,
          status: 'ACTIVE',
          billingCycle: cycleUpper,
          paymentMethod: methodUpper,
          currentPeriodEnd: periodEnd,
          trialEndsAt: null,
          cancelAtPeriodEnd: false,
          mercadoPagoPaymentId: String(payment.id),
        },
      });

      console.log(
        `[Mercado Pago Webhook] Subscription ACTIVATED for business ${businessId} - Plan ${planUpper} (${cycleUpper}) valid until ${periodEnd.toISOString()}`
      );
    }

    return NextResponse.json({ received: true, status: payment.status });
  } catch (error) {
    console.error('[Mercado Pago Webhook] Processing error:', error);
    return NextResponse.json({ received: true, error: 'Internal processing error' }, { status: 200 });
  }
}

export async function GET(req: NextRequest) {
  return NextResponse.json({ status: 'Mercado Pago Webhook Endpoint Active' });
}
