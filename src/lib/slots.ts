import db from './db';

export interface AvailableSlot {
  time: string; // "09:00"
  endTime: string; // "09:30"
  period: 'morning' | 'afternoon' | 'evening';
  availableProfessionalIds: string[];
  suggestedProfessionalId: string;
}

export interface SlotAvailabilityResult {
  date: string;
  isOpen: boolean;
  message?: string;
  slots: AvailableSlot[];
  periods: {
    morning: AvailableSlot[];
    afternoon: AvailableSlot[];
    evening: AvailableSlot[];
  };
}

// Convert "HH:mm" to minutes since midnight
function timeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

// Convert minutes since midnight to "HH:mm"
function minutesToTime(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

export async function calculateAvailableSlots(params: {
  businessId: string;
  serviceId: string;
  dateStr: string; // "YYYY-MM-DD"
  professionalId?: string | null; // specific ID or 'any' or null
}): Promise<SlotAvailabilityResult> {
  const { businessId, serviceId, dateStr, professionalId } = params;

  // Parse target date
  // Using explicit local date parsing to avoid timezone day shift
  const [year, month, day] = dateStr.split('-').map(Number);
  const targetDate = new Date(year, month - 1, day);
  const dayOfWeek = targetDate.getDay(); // 0 = Sunday, 1 = Monday, etc.

  // 1. Fetch Business & Business Hours
  const business = await db.business.findUnique({
    where: { id: businessId },
    include: {
      businessHours: {
        where: { dayOfWeek },
      },
    },
  });

  if (!business) {
    return {
      date: dateStr,
      isOpen: false,
      message: 'Negócio não encontrado',
      slots: [],
      periods: { morning: [], afternoon: [], evening: [] },
    };
  }

  const businessHour = business.businessHours[0];
  if (!businessHour || !businessHour.isOpen) {
    return {
      date: dateStr,
      isOpen: false,
      message: 'Estabelecimento fechado nesta data',
      slots: [],
      periods: { morning: [], afternoon: [], evening: [] },
    };
  }

  // 2. Fetch Service
  const service = await db.service.findUnique({
    where: { id: serviceId, businessId, active: true },
    include: {
      professionals: {
        include: {
          professional: true,
        },
      },
    },
  });

  if (!service) {
    return {
      date: dateStr,
      isOpen: false,
      message: 'Serviço não encontrado ou inativo',
      slots: [],
      periods: { morning: [], afternoon: [], evening: [] },
    };
  }

  // 3. Determine Candidate Professionals
  let candidateProfessionals: any[] = [];

  if (professionalId && professionalId !== 'any') {
    const specificProf = await db.professional.findFirst({
      where: {
        id: professionalId,
        businessId,
        active: true,
      },
      include: {
        availabilities: {
          where: { dayOfWeek },
        },
        services: {
          where: { serviceId },
        },
      },
    });

    if (!specificProf || specificProf.services.length === 0) {
      return {
        date: dateStr,
        isOpen: false,
        message: 'Profissional não realiza este serviço ou está inativo',
        slots: [],
        periods: { morning: [], afternoon: [], evening: [] },
      };
    }
    candidateProfessionals = [specificProf];
  } else {
    // All active professionals assigned to this service
    const serviceProfs = await db.professional.findMany({
      where: {
        businessId,
        active: true,
        services: {
          some: { serviceId },
        },
      },
      include: {
        availabilities: {
          where: { dayOfWeek },
        },
      },
    });

    candidateProfessionals = serviceProfs;
  }

  if (candidateProfessionals.length === 0) {
    return {
      date: dateStr,
      isOpen: false,
      message: 'Nenhum profissional disponível para este serviço',
      slots: [],
      periods: { morning: [], afternoon: [], evening: [] },
    };
  }

  // 4. Fetch existing appointments for the day for candidate professionals
  const startOfDay = new Date(year, month - 1, day, 0, 0, 0);
  const endOfDay = new Date(year, month - 1, day, 23, 59, 59);

  const existingAppointments = await db.appointment.findMany({
    where: {
      businessId,
      professionalId: { in: candidateProfessionals.map((p) => p.id) },
      startTime: { gte: startOfDay, lte: endOfDay },
      status: { notIn: ['CANCELLED'] },
    },
  });

  // 5. Generate Time Slots
  const serviceDuration = service.durationMinutes || 30;
  const slotInterval = serviceDuration <= 20 ? 15 : 30; // 15 or 30 min step

  const businessOpenMin = timeToMinutes(businessHour.openTime || '09:00');
  const businessCloseMin = timeToMinutes(businessHour.closeTime || '18:00');

  // Check if date is today to filter past slots
  const now = new Date();
  const isToday =
    now.getFullYear() === year &&
    now.getMonth() === month - 1 &&
    now.getDate() === day;
  const currentMinutesToday = isToday ? now.getHours() * 60 + now.getMinutes() + 15 : -1; // 15 min buffer

  const slots: AvailableSlot[] = [];

  for (
    let slotStartMin = businessOpenMin;
    slotStartMin + serviceDuration <= businessCloseMin;
    slotStartMin += slotInterval
  ) {
    // If today and slot has already passed, skip
    if (isToday && slotStartMin < currentMinutesToday) {
      continue;
    }

    const slotEndMin = slotStartMin + serviceDuration;
    const slotTimeStr = minutesToTime(slotStartMin);
    const slotEndTimeStr = minutesToTime(slotEndMin);

    const availableProfIds: string[] = [];

    for (const prof of candidateProfessionals) {
      // Check professional working hours
      const profAvail = prof.availabilities?.[0];
      let profOpenMin = businessOpenMin;
      let profCloseMin = businessCloseMin;
      let profBreakStartMin: number | null = null;
      let profBreakEndMin: number | null = null;

      if (profAvail) {
        if (!profAvail.isAvailable) continue; // Day off
        if (profAvail.startTime) profOpenMin = timeToMinutes(profAvail.startTime);
        if (profAvail.endTime) profCloseMin = timeToMinutes(profAvail.endTime);
        if (profAvail.breakStart) profBreakStartMin = timeToMinutes(profAvail.breakStart);
        if (profAvail.breakEnd) profBreakEndMin = timeToMinutes(profAvail.breakEnd);
      }

      // Check if slot is within professional's shift
      if (slotStartMin < profOpenMin || slotEndMin > profCloseMin) {
        continue;
      }

      // Check if slot overlaps with lunch / break
      if (
        profBreakStartMin !== null &&
        profBreakEndMin !== null &&
        slotStartMin < profBreakEndMin &&
        slotEndMin > profBreakStartMin
      ) {
        continue;
      }

      // Check if overlaps with existing appointments for this professional
      const hasConflict = existingAppointments.some((appt) => {
        if (appt.professionalId !== prof.id) return false;
        const apptStart = new Date(appt.startTime);
        const apptEnd = new Date(appt.endTime);
        const apptStartMin = apptStart.getHours() * 60 + apptStart.getMinutes();
        const apptEndMin = apptEnd.getHours() * 60 + apptEnd.getMinutes();

        return slotStartMin < apptEndMin && slotEndMin > apptStartMin;
      });

      if (!hasConflict) {
        availableProfIds.push(prof.id);
      }
    }

    if (availableProfIds.length > 0) {
      // Pick suggested professional (the one with the fewest bookings today among available)
      const profBookingCounts = availableProfIds.map((id) => {
        const count = existingAppointments.filter((a) => a.professionalId === id).length;
        return { id, count };
      });
      profBookingCounts.sort((a, b) => a.count - b.count);
      const suggestedProfessionalId = profBookingCounts[0].id;

      let period: 'morning' | 'afternoon' | 'evening' = 'morning';
      if (slotStartMin >= 720 && slotStartMin < 1080) {
        period = 'afternoon';
      } else if (slotStartMin >= 1080) {
        period = 'evening';
      }

      slots.push({
        time: slotTimeStr,
        endTime: slotEndTimeStr,
        period,
        availableProfessionalIds: availableProfIds,
        suggestedProfessionalId,
      });
    }
  }

  const periods = {
    morning: slots.filter((s) => s.period === 'morning'),
    afternoon: slots.filter((s) => s.period === 'afternoon'),
    evening: slots.filter((s) => s.period === 'evening'),
  };

  return {
    date: dateStr,
    isOpen: true,
    slots,
    periods,
  };
}

