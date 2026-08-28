import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/auth';
import {
  getMercadoPagoPayment,
  getMercadoPagoMerchantOrder,
  searchMercadoPagoPayments,
  BillingCycle,
  PaymentMethodType,
} from '@/lib/mercadopago';

export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session || !session.businessId || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    const body = await req.json();
    const {
      paymentId,
      collectionId,
      collectionStatus,
      merchantOrderId,
      preferenceId,
      externalReference,
      planSlug: bodyPlanSlug,
      billingCycle: bodyBillingCycle,
      paymentMethod: bodyPaymentMethod,
    } = body;

    // Fetch current subscription from DB
    const existingSubscription = await db.subscription.findUnique({
      where: { businessId: session.businessId },
    });

    const targetPaymentId = paymentId || collectionId || existingSubscription?.mercadoPagoPaymentId;
    let paymentData: any = null;

    // 1. Try to fetch directly by payment ID if provided or from existing subscription
    if (targetPaymentId) {
      const cleanId = String(targetPaymentId).replace(/\D/g, '');
      if (cleanId) {
        paymentData = await getMercadoPagoPayment(cleanId);
      }
    }

    // 2. If not found, try merchant order
    if (!paymentData && merchantOrderId) {
      const cleanOrderId = String(merchantOrderId).replace(/\D/g, '');
      if (cleanOrderId) {
        const order = await getMercadoPagoMerchantOrder(cleanOrderId);
        if (order && order.payments && order.payments.length > 0) {
          // Find approved payment
          const approved = order.payments.find((p: any) => p.status === 'approved') || order.payments[0];
          if (approved) {
            paymentData = await getMercadoPagoPayment(approved.id);
          }
        }
      }
    }

    // 3. If still not found, search recent payments matching this business or user email
    if (!paymentData) {
      const recentPayments = await searchMercadoPagoPayments({ limit: 15 });
      if (recentPayments.length > 0) {
        // Look for approved payment matching businessId prefix or payer email
        const matchedPayment = recentPayments.find(
          (p: any) =>
            (p.external_reference && String(p.external_reference).startsWith(`${session.businessId}:`)) ||
            (p.payer?.email && String(p.payer.email).toLowerCase() === session.email.toLowerCase())
        );

        if (matchedPayment) {
          paymentData = matchedPayment;
        }
      }
    }

    let planSlug = bodyPlanSlug || existingSubscription?.plan || 'STARTER';
    let billingCycle: BillingCycle = (bodyBillingCycle as BillingCycle) || (existingSubscription?.billingCycle as BillingCycle) || 'MONTHLY';
    let paymentMethod: PaymentMethodType = (bodyPaymentMethod as PaymentMethodType) || (existingSubscription?.paymentMethod as PaymentMethodType) || 'CREDIT_CARD';
    let isApproved = false;
    let paymentDate = new Date();
    let mpPaymentId = targetPaymentId ? String(targetPaymentId) : undefined;

    if (paymentData) {
      isApproved = paymentData.status === 'approved' || paymentData.status === 'accredited';
      mpPaymentId = String(paymentData.id);

      if (paymentData.date_approved) {
        paymentDate = new Date(paymentData.date_approved);
      } else if (paymentData.date_created) {
        paymentDate = new Date(paymentData.date_created);
      }

      // Parse external_reference: "businessId:planSlug:billingCycle:paymentMethod:timestamp"
      if (paymentData.external_reference) {
        const parts = String(paymentData.external_reference).split(':');
        if (parts.length >= 2) {
          if (parts[1]) planSlug = parts[1];
          if (parts[2]) billingCycle = parts[2].toUpperCase() as BillingCycle;
          if (parts[3]) paymentMethod = parts[3].toUpperCase() as PaymentMethodType;
        }
      }

      if (paymentData.payment_type_id === 'bank_transfer' || paymentData.payment_method_id === 'pix') {
        paymentMethod = 'PIX';
      } else if (paymentData.payment_type_id === 'credit_card') {
        paymentMethod = 'CREDIT_CARD';
      }
    } else if (collectionStatus === 'approved') {
      isApproved = true;
    } else if (!targetPaymentId && existingSubscription?.status === 'ACTIVE' && existingSubscription.currentPeriodEnd) {
      // If no specific payment was requested to be checked and user is already active
      const remaining = Math.max(0, Math.ceil((new Date(existingSubscription.currentPeriodEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
      return NextResponse.json({
        success: true,
        status: 'approved',
        message: `Assinatura confirmada e ativa! Plano ${existingSubscription.plan} válido até ${new Date(existingSubscription.currentPeriodEnd).toLocaleDateString('pt-BR')} (${remaining} dias restantes).`,
        subscription: existingSubscription,
        currentPeriodEnd: existingSubscription.currentPeriodEnd,
        daysRemaining: remaining,
      });
    }

    if (!isApproved) {
      return NextResponse.json({
        success: false,
        status: paymentData?.status || collectionStatus || 'pending',
        message: 'O pagamento ainda está sendo processado ou não foi aprovado pelo Mercado Pago.',
        paymentData,
      });
    }

    // Look up Plan in DB to get full info
    const plan = await db.plan.findUnique({
      where: { slug: planSlug.toLowerCase() },
    });

    const planUpper = (plan?.slug || planSlug).toUpperCase();
    const cycleUpper = (billingCycle || 'MONTHLY').toUpperCase();
    const methodUpper = (paymentMethod || 'CREDIT_CARD').toUpperCase();

    // Calculate expiration date based on the plan cycle starting from paymentDate
    let daysToAdd = 30;
    if (cycleUpper === 'QUARTERLY') {
      daysToAdd = 90;
    } else if (cycleUpper === 'ANNUAL') {
      daysToAdd = 365;
    }

    const currentPeriodStart = paymentDate;
    const currentPeriodEnd = new Date(paymentDate.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
    const now = new Date();
    const daysRemaining = Math.max(0, Math.ceil((currentPeriodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

    // Upsert subscription as ACTIVE in database
    const subscription = await db.subscription.upsert({
      where: { businessId: session.businessId },
      update: {
        plan: planUpper,
        status: 'ACTIVE',
        billingCycle: cycleUpper,
        paymentMethod: methodUpper,
        currentPeriodEnd,
        trialEndsAt: null,
        cancelAtPeriodEnd: false,
        ...(mpPaymentId ? { mercadoPagoPaymentId: mpPaymentId } : {}),
        updatedAt: new Date(),
      },
      create: {
        businessId: session.businessId,
        plan: planUpper,
        status: 'ACTIVE',
        billingCycle: cycleUpper,
        paymentMethod: methodUpper,
        currentPeriodEnd,
        trialEndsAt: null,
        cancelAtPeriodEnd: false,
        ...(mpPaymentId ? { mercadoPagoPaymentId: mpPaymentId } : {}),
      },
    });

    // Also link planId to business
    if (plan?.id) {
      await db.business.update({
        where: { id: session.businessId },
        data: { planId: plan.id },
      });
    }

    return NextResponse.json({
      success: true,
      message: `Assinatura ativada com sucesso! Plano ${plan?.name || planUpper} válido até ${currentPeriodEnd.toLocaleDateString('pt-BR')}.`,
      subscription: {
        ...subscription,
        planName: plan?.name || planUpper,
        currentPeriodStart,
        currentPeriodEnd,
        daysRemaining,
      },
      plan: plan || { name: planUpper, slug: planSlug },
      billingCycle: cycleUpper,
      paymentMethod: methodUpper,
      paymentId: mpPaymentId,
      currentPeriodStart,
      currentPeriodEnd,
      daysRemaining,
    });
  } catch (error: any) {
    console.error('Confirm payment error:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao confirmar pagamento no Mercado Pago' },
      { status: 500 }
    );
  }
}

