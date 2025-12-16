// utils/isChristmas.ts
export function isChristmasSeason() {
  const now = new Date();
  const month = now.getMonth(); // 0 = enero, 11 = diciembre
  const day = now.getDate();
  return month === 11 && day >= 1 && day <= 26; // 1 al 26 de diciembre
}