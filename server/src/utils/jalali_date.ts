/**
 * Utility functions to convert Gregorian dates to Jalali (Persian) calendar
 */

interface JalaliDate {
    year: number;
    month: number;
    day: number;
}

/**
 * Convert Gregorian date to Jalali date
 * Based on algorithm from: https://www.fourmilab.ch/documents/calendar/
 */
export function gregorianToJalali(gDate: Date): JalaliDate {
    const gy = gDate.getFullYear();
    const gm = gDate.getMonth() + 1;
    const gd = gDate.getDate();

    let g_d_n = 365 * gy + Math.floor((gy + 3) / 4) - Math.floor((gy + 99) / 100) + Math.floor((gy + 399) / 400);

    for (let i = 0; i < gm; ++i) {
        switch (i) {
            case 0:
            case 2:
            case 4:
            case 6:
            case 7:
            case 9:
            case 11:
                g_d_n += 31;
                break;
            case 1:
                if (gy % 400 === 0 || (gy % 100 !== 0 && gy % 4 === 0)) g_d_n += 29;
                else g_d_n += 28;
                break;
            case 3:
            case 5:
            case 8:
            case 10:
                g_d_n += 30;
                break;
        }
    }

    g_d_n += gd;

    let j_d_n = g_d_n - 79;

    let j_np = Math.floor(j_d_n / 12053);
    j_d_n %= 12053;

    let jy = 979 + 33 * j_np + 4 * Math.floor(j_d_n / 1461);

    j_d_n %= 1461;

    if (j_d_n > 365) {
        jy += Math.floor((j_d_n - 1) / 365);
        j_d_n = (j_d_n - 1) % 365;
    }

    let jm = 0;
    let jd = j_d_n + 1;

    if (jd <= 186) {
        jm = 1 + Math.floor(jd / 31);
        jd = (jd % 31) || 31;
    } else {
        jm = 7 + Math.floor((jd - 186) / 30);
        jd = ((jd - 186) % 30) || 30;
    }

    return {
        year: Math.floor(jy),
        month: Math.floor(jm),
        day: Math.floor(jd),
    };
}

/**
 * Format Jalali date as Persian string without year
 * e.g., "25 مهر"
 */
export function formatJalaliDatePersian(jDate: JalaliDate): string {
    const jalaliMonths = [
        'فروردین',
        'اردیبهشت',
        'خرداد',
        'تیر',
        'مرداد',
        'شهریور',
        'مهر',
        'آبان',
        'آذر',
        'دی',
        'بهمن',
        'اسفند',
    ];

    const monthStr = jalaliMonths[jDate.month - 1];
    const dayStr = jDate.day.toString();

    return `${dayStr} ${monthStr}`;
}

/**
 * Format Jalali date as YYYY-MM-DD string
 */
export function formatJalaliDateISO(jDate: JalaliDate): string {
    const year = jDate.year.toString();
    const month = String(jDate.month).padStart(2, '0');
    const day = String(jDate.day).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Get tomorrow's date in Jalali format (Persian string)
 */
export function getTomorrowJalaliPersian(): string {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const jDate = gregorianToJalali(tomorrow);
    return formatJalaliDatePersian(jDate);
}

/**
 * Get current time in Persian (HH:MM format)
 */
export function getCurrentTimePersian(): string {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
}
