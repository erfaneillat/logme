export function formatJalaliDate(date: Date | string | number, options?: Intl.DateTimeFormatOptions) {
  const d = new Date(date);
  return d.toLocaleDateString('fa-IR-u-ca-persian', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options,
  });
}

export function formatJalaliTime(date: Date | string | number, options?: Intl.DateTimeFormatOptions) {
  const d = new Date(date);
  return d.toLocaleTimeString('fa-IR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    ...options,
  });
}

export function formatJalaliDateTime(date: Date | string | number, optionsDate?: Intl.DateTimeFormatOptions, optionsTime?: Intl.DateTimeFormatOptions) {
  return `${formatJalaliDate(date, optionsDate)}، ${formatJalaliTime(date, optionsTime)}`;
}
