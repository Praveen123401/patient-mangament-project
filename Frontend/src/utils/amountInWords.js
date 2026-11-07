const ONES = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve",
  "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

const two = (n) => (n < 20 ? ONES[n] : TENS[Math.floor(n / 10)] + (n % 10 ? ` ${ONES[n % 10]}` : ""));
const three = (n) =>
  (n >= 100 ? `${ONES[Math.floor(n / 100)]} Hundred${n % 100 ? " " : ""}` : "") + two(n % 100);

// 1500 -> "Rupees One Thousand Five Hundred Only" (Indian system: lakh, crore)
export default function amountInWords(amount) {
  const value = Math.abs(Number(amount)) || 0;
  const n = Math.floor(value);
  const paise = Math.round((value - n) * 100);
  if (n === 0 && paise === 0) return "Zero Rupees Only";

  const parts = [];
  const crore = Math.floor(n / 10000000);
  const lakh = Math.floor((n % 10000000) / 100000);
  const thousand = Math.floor((n % 100000) / 1000);
  const rest = n % 1000;
  if (crore) parts.push(`${three(crore)} Crore`);
  if (lakh) parts.push(`${two(lakh)} Lakh`);
  if (thousand) parts.push(`${two(thousand)} Thousand`);
  if (rest) parts.push(three(rest));

  return `Rupees ${parts.join(" ") || "Zero"}${paise ? ` and ${two(paise)} Paise` : ""} Only`;
}