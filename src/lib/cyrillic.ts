const LATIN_TO_CYRILLIC: Record<string, string> = {
  a: 'а', b: 'б', c: 'ц', d: 'д', e: 'е', f: 'ф', g: 'г', h: 'х',
  i: 'и', j: 'й', k: 'к', l: 'л', m: 'м', n: 'н', o: 'о', p: 'п',
  q: 'к', r: 'р', s: 'с', t: 'т', u: 'у', v: 'в', w: 'в', x: 'кс',
  y: 'у', z: 'з',
  A: 'А', B: 'Б', C: 'Ц', D: 'Д', E: 'Е', F: 'Ф', G: 'Г', H: 'Х',
  I: 'И', J: 'Й', K: 'К', L: 'Л', M: 'М', N: 'Н', O: 'О', P: 'П',
  Q: 'К', R: 'Р', S: 'С', T: 'Т', U: 'У', V: 'В', W: 'В', X: 'Кс',
  Y: 'У', Z: 'З',
};

export function latinToCyrillic(input: string): string {
  let result = '';
  for (const ch of input) {
    result += LATIN_TO_CYRILLIC[ch] ?? ch;
  }
  return result;
}

const CYRILLIC_LETTER = /[\u0400-\u04FF]/;
const ALLOWED_CYRILLIC_TEXT = /^[\u0400-\u04FFa-zA-Z\s.,\-"'«»()/№;:!+&_@#0-9]*$/;

export function isCyrillicText(input: string): boolean {
  if (!input.trim()) return true;
  return ALLOWED_CYRILLIC_TEXT.test(input);
}

export function hasCyrillicLetters(input: string): boolean {
  return CYRILLIC_LETTER.test(input);
}

const ALLOWED_CYRILLIC_NAME = /^[\u0400-\u04FF\s\-]*$/;

export function isCyrillicName(input: string): boolean {
  if (!input.trim()) return true;
  return ALLOWED_CYRILLIC_NAME.test(input);
}

export function toCyrillicText(input: string): string {
  return latinToCyrillic(input);
}

export function toCyrillicName(input: string): string {
  return latinToCyrillic(input).replace(/[^\u0400-\u04FF\s\-]/g, '');
}
