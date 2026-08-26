import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/auth';
import { createMercadoPagoPreference } from '@/lib/mercadopago';

export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session || !session.businessId || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    const { planSlug } = await req.json();
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
    });

    if (!business) {
      return NextResponse.json({ error: 'Estabelecimento não encontrado' }, { status: 404 });
    }

    const preference = await createMercadoPagoPreference({
      businessId: business.id,
      businessName: business.name,
      userEmail: session.email,
      userName: session.name,
      planSlug: plan.slug,
      planName: plan.name,
      price: plan.priceMonthly,
    });

    return NextResponse.json({
      checkoutUrl: preference.initPoint,
      preferenceId: preference.id,
      isSimulated: preference.isSimulated,
      planName: plan.name,
      price: plan.priceMonthly,
    });
  } catch (error: any) {
    console.error('Create checkout error:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao gerar checkout do Mercado Pago' },
      { status: 500 }
    );
  }
}
