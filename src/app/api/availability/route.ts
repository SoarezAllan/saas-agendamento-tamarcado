import { NextRequest, NextResponse } from 'next/server';
import { calculateAvailableSlots } from '@/lib/slots';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get('businessId');
    const serviceId = searchParams.get('serviceId');
    const date = searchParams.get('date'); // YYYY-MM-DD
    const professionalId = searchParams.get('professionalId');

    if (!businessId || !serviceId || !date) {
      return NextResponse.json(
        { error: 'Parâmetros obrigatórios ausentes (businessId, serviceId, date)' },
        { status: 400 }
      );
    }

    const result = await calculateAvailableSlots({
      businessId,
      serviceId,
      dateStr: date,
      professionalId: professionalId && professionalId !== 'any' ? professionalId : null,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Availability slot calculation error:', error);
    return NextResponse.json(
      { error: 'Erro ao calcular horários disponíveis' },
      { status: 500 }
    );
  }
}

