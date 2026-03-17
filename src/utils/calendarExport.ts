interface BookingEvent {
  id: string;
  title: string;
  description: string;
  start: Date;
  end: Date;
  location?: string;
}

export function generateICalEvent(event: BookingEvent): string {
  const formatDate = (date: Date): string => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const escapeText = (text: string): string => {
    return text
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\n/g, '\\n');
  };

  const lines = [
    'BEGIN:VEVENT',
    `UID:${event.id}@petify.app`,
    `DTSTAMP:${formatDate(new Date())}`,
    `DTSTART:${formatDate(event.start)}`,
    `DTEND:${formatDate(event.end)}`,
    `SUMMARY:${escapeText(event.title)}`,
    `DESCRIPTION:${escapeText(event.description)}`,
  ];

  if (event.location) {
    lines.push(`LOCATION:${escapeText(event.location)}`);
  }

  lines.push('STATUS:CONFIRMED');
  lines.push('END:VEVENT');

  return lines.join('\r\n');
}

export function generateICalFile(events: BookingEvent[]): string {
  const header = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Petify//Booking Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Petify Reservas',
    'X-WR-TIMEZONE:America/Santiago',
  ].join('\r\n');

  const eventStrings = events.map(event => generateICalEvent(event)).join('\r\n');

  const footer = 'END:VCALENDAR';

  return `${header}\r\n${eventStrings}\r\n${footer}`;
}

export function downloadICalFile(content: string, filename: string = 'petify-reservas.ics'): void {
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportBookingsToCalendar(bookings: any[]): void {
  const events: BookingEvent[] = bookings.map(booking => {
    const startDate = new Date(booking.scheduled_date);
    const endDate = new Date(startDate.getTime() + (booking.duration_minutes || 60) * 60000);

    return {
      id: booking.id,
      title: `${booking.service_type || 'Servicio'} - ${booking.provider_name || 'Proveedor'}`,
      description: `Reserva de ${booking.service_type}\nPara: ${booking.pet_names || 'Mascota'}\nEstado: ${booking.status}`,
      start: startDate,
      end: endDate,
      location: booking.location || undefined
    };
  });

  const icalContent = generateICalFile(events);
  downloadICalFile(icalContent);
}

export function addToGoogleCalendar(booking: any): string {
  const startDate = new Date(booking.scheduled_date);
  const endDate = new Date(startDate.getTime() + (booking.duration_minutes || 60) * 60000);

  const formatGoogleDate = (date: Date): string => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `${booking.service_type} - ${booking.provider_name}`,
    dates: `${formatGoogleDate(startDate)}/${formatGoogleDate(endDate)}`,
    details: `Reserva de ${booking.service_type} con ${booking.provider_name}\nPara: ${booking.pet_names}\nEstado: ${booking.status}`,
    location: booking.location || '',
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function addToOutlookCalendar(booking: any): string {
  const startDate = new Date(booking.scheduled_date);
  const endDate = new Date(startDate.getTime() + (booking.duration_minutes || 60) * 60000);

  const formatOutlookDate = (date: Date): string => {
    return date.toISOString();
  };

  const params = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: `${booking.service_type} - ${booking.provider_name}`,
    startdt: formatOutlookDate(startDate),
    enddt: formatOutlookDate(endDate),
    body: `Reserva de ${booking.service_type} con ${booking.provider_name}\nPara: ${booking.pet_names}\nEstado: ${booking.status}`,
    location: booking.location || '',
  });

  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}