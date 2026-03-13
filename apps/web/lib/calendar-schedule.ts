import type { CalendarEventStatus } from '@/components/calendar/calendar';

interface CalendarWorkingHourLike {
  startTime: string;
  endTime: string;
}

interface CalendarAppointmentLike {
  startAt: string;
  endAt: string | null;
}

interface CalendarTimeOffLike {
  startAt: string;
  endAt: string;
}

export function toCalendarEventStatus(status: string): CalendarEventStatus {
  const normalizedStatus = status.trim().toLowerCase();

  if (normalizedStatus === 'pending') {
    return 'pending';
  }

  if (normalizedStatus === 'cancelled' || normalizedStatus === 'no_show') {
    return 'cancelled';
  }

  return 'confirmed';
}

function parseTimeToMinutes(value: string) {
  const [hours = '0', minutes = '0'] = value.split(':');
  return Number(hours) * 60 + Number(minutes);
}

export function resolveAppointmentEnd(startAt: string, endAt: string | null) {
  if (endAt) {
    return new Date(endAt);
  }

  return new Date(new Date(startAt).getTime() + 30 * 60 * 1000);
}

export function deriveCalendarHours(input: {
  workingHours: CalendarWorkingHourLike[];
  appointments: CalendarAppointmentLike[];
  timeOffRecords: CalendarTimeOffLike[];
}) {
  const startCandidates: number[] = [];
  const endCandidates: number[] = [];

  input.workingHours.forEach((entry) => {
    startCandidates.push(parseTimeToMinutes(entry.startTime));
    endCandidates.push(parseTimeToMinutes(entry.endTime));
  });

  input.appointments.forEach((appointment) => {
    const startDate = new Date(appointment.startAt);
    const endDate = resolveAppointmentEnd(appointment.startAt, appointment.endAt);

    startCandidates.push(startDate.getHours() * 60 + startDate.getMinutes());
    endCandidates.push(endDate.getHours() * 60 + endDate.getMinutes());
  });

  input.timeOffRecords.forEach((record) => {
    const startDate = new Date(record.startAt);
    const endDate = new Date(record.endAt);

    startCandidates.push(startDate.getHours() * 60 + startDate.getMinutes());
    endCandidates.push(endDate.getHours() * 60 + endDate.getMinutes());
  });

  if (!startCandidates.length || !endCandidates.length) {
    return {
      startHour: 8,
      endHour: 20,
    };
  }

  const minMinutes = Math.min(...startCandidates);
  const maxMinutes = Math.max(...endCandidates);
  const startHour = Math.max(6, Math.floor(minMinutes / 60));
  const endHour = Math.min(24, Math.max(startHour + 1, Math.ceil(maxMinutes / 60)));

  return { startHour, endHour };
}
