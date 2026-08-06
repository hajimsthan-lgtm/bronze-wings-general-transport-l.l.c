const ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function twoDigits(n) {
  if (n < 20) return ONES[n];
  return TENS[Math.floor(n / 10)] + (n % 10 ? ' ' + ONES[n % 10] : '');
}

function threeDigits(n) {
  const h = Math.floor(n / 100);
  const r = n % 100;
  let s = '';
  if (h) s += ONES[h] + ' Hundred';
  if (r) s += (h ? ' ' : '') + twoDigits(r);
  return s;
}

function convertInteger(num) {
  if (num === 0) return 'Zero';
  let words = '';
  const billions = Math.floor(num / 1000000000);
  const millions = Math.floor((num % 1000000000) / 1000000);
  const thousands = Math.floor((num % 1000000) / 1000);
  const rest = num % 1000;
  if (billions) words += threeDigits(billions) + ' Billion';
  if (millions) words += (words ? ' ' : '') + threeDigits(millions) + ' Million';
  if (thousands) words += (words ? ' ' : '') + threeDigits(thousands) + ' Thousand';
  if (rest) words += (words ? ' ' : '') + threeDigits(rest);
  return words;
}

export function numberToWords(num) {
  num = Number(num) || 0;
  const integer = Math.floor(num);
  const decimal = Math.round((num - integer) * 100);
  let result = convertInteger(integer) + ' Dirhams';
  if (decimal > 0) result += ' and ' + twoDigits(decimal) + ' Fils';
  return result + ' Only';
}