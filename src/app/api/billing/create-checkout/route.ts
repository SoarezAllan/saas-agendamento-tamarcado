import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/auth';
import { createMercadoPagoCheckout, BillingCycle, PaymentMethodType } from '@/lib/mercadopago';

export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session || !session.businessId || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    const body = await req.json();
    const {
      planSlug,
      billingCycle = 'MONTHLY',
      paymentMethod = 'CREDIT_CARD',
      payerCpf,
    } = body;

    if (!planSlug) {
      return NextResponse.json({ error: 'Plano é obrigatório' }, { status: 400 });
    }

    // Look up plan
    const plan = await db.plan.findUnique({
      where: { slug: planSlug.toLowerCase() },
    });

    if (!plan) {
      return NextResponse.json({ error: 'Plano não encontrado' }, { status: 404 });
    }

    // Look up business info
    const business = await db.business.findUnique({
      where: { id: session.businessId },
      include: { subscription: true },
    });

    if (!business) {
      return NextResponse.json({ error: 'Estabelecimento não encontrado' }, { status: 404 });
    }

    // Determine price based on cycle
    let price = plan.priceMonthly;
    if (billingCycle === 'QUARTERLY') {
      price = plan.priceQuarterly > 0 ? plan.priceQuarterly : Math.round(plan.priceMonthly * 3 * 0.9 * 100) / 100;
    } else if (billingCycle === 'ANNUAL') {
      price = plan.priceAnnual > 0 ? plan.priceAnnual : Math.round(plan.priceMonthly * 12 * 0.8 * 100) / 100;
    }

    // If this is a demo account, do not generate real money charges or Mercado Pago PIX/cards
    if (business.isDemo || business.slug === 'barbearia-vintage' || session.email === 'admin@barbearia.com') {
      return NextResponse.json({
        success: true,
        isDemo: true,
        message: 'Esta é uma conta de demonstração interativa. O processamento de pagamentos reais fica bloqueado nesta visualização para evitar cobranças acidentais.',
        planName: plan.name,
        price,
        billingCycle,
        paymentMethod,
        trialDays: 7,
      });
    }

    const checkoutResult = await createMercadoPagoCheckout({
      businessId: business.id,
      businessName: business.name,
      userEmail: session.email,
      userName: session.name,
      planSlug: plan.slug,
      planName: plan.name,
      price,
      billingCycle: billingCycle as BillingCycle,
      paymentMethod: paymentMethod as PaymentMethodType,
      payerCpf,
    });

    // Update or create subscription in trialing state with chosen payment method and cycle
    const trialEndsDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await db.subscription.upsert({
      where: { businessId: business.id },
      update: {
        plan: plan.slug.toUpperCase(),
        billingCycle: billingCycle as BillingCycle,
        paymentMethod: paymentMethod as PaymentMethodType,
        trialEndsAt: trialEndsDate,
        ...(checkoutResult.id ? { mercadoPagoPaymentId: checkoutResult.id } : {}),
      },
      create: {
        businessId: business.id,
        plan: plan.slug.toUpperCase(),
        status: 'TRIALING',
        billingCycle: billingCycle as BillingCycle,
        paymentMethod: paymentMethod as PaymentMethodType,
        trialEndsAt: trialEndsDate,
        ...(checkoutResult.id ? { mercadoPagoPaymentId: checkoutResult.id } : {}),
      },
    });

    return NextResponse.json({
      success: true,
      checkoutUrl: checkoutResult.initPoint,
      preferenceId: checkoutResult.id,
      isSimulated: checkoutResult.isSimulated,
      planName: plan.name,
      price,
      billingCycle,
      paymentMethod,
      trialDays: 7,
      trialEndsAt: checkoutResult.trialEndsAt,
      firstChargeDate: checkoutResult.firstChargeDate,
      pixQrCodeBase64: checkoutResult.pixQrCodeBase64,
      pixQrCodeText: checkoutResult.pixQrCodeText,
      pixExpiration: checkoutResult.pixExpiration,
    });
  } catch (error: any) {
    console.error('Create checkout error:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao gerar checkout do Mercado Pago' },
      { status: 500 }
    );
  }
}
