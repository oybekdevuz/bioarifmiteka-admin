const MONTHS = [
  "yanvar",
  "fevral",
  "mart",
  "aprel",
  "may",
  "iyun",
  "iyul",
  "avgust",
  "sentabr",
  "oktabr",
  "noyabr",
  "dekabr",
];
const WEEKDAYS = ["Yak", "Du", "Se", "Chor", "Pay", "Ju", "Sha"];

/** 1234567 → "1 234 567" */
export const formatNumber = (value: number): string =>
  Math.round(value)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, " ");

export const formatSom = (value: number): string => `${formatNumber(value)} so'm`;

export const formatUsd = (value: number): string => `$${value.toFixed(2)}`;

const parts = (key: string) => key.split("-").map(Number) as [number, number, number];

/** "2026-10-11" → "11-oktabr" */
export const formatDay = (key: string): string => {
  const [, m, d] = parts(key);
  return `${d}-${MONTHS[m - 1]}`;
};

/** "2026-10-11" → "Yak" */
export const formatWeekday = (key: string): string => {
  const [y, m, d] = parts(key);
  return WEEKDAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
};

/** "2026-10-01" → "Oktabr 2026" */
export const formatMonth = (key: string): string => {
  const [y, m] = parts(key);
  const name = MONTHS[m - 1];
  return `${name[0].toUpperCase()}${name.slice(1)} ${y}`;
};

/** Vaqt (ms) → "11.10.2026" (Toshkent vaqti) */
export const formatDate = (ms: number): string =>
  new Intl.DateTimeFormat("ru-RU", {
    timeZone: "Asia/Tashkent",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(ms));
