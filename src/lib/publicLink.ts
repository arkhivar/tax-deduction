/**
 * Browsers expose internationalized domains in punycode via window.location
 * (e.g. https://xn--b1ag3bst.help). Public links should be shown and shared
 * in Unicode form (https://вычет.help), so decode the xn-- labels back.
 * RFC 3492 bootstring decoding; no dependency needed.
 */

const BASE = 36;
const TMIN = 1;
const TMAX = 26;
const SKEW = 38;
const DAMP = 700;
const INITIAL_BIAS = 72;
const INITIAL_N = 128;

function decodePunycodeLabel(label: string): string {
  try {
    const output: number[] = [];
    let rest = label;
    const delim = rest.lastIndexOf('-');
    if (delim >= 0) {
      for (const ch of rest.slice(0, delim)) output.push(ch.codePointAt(0)!);
      rest = rest.slice(delim + 1);
    }

    let n = INITIAL_N;
    let i = 0;
    let bias = INITIAL_BIAS;
    let idx = 0;

    while (idx < rest.length) {
      const oldi = i;
      let w = 1;
      for (let k = BASE; ; k += BASE) {
        if (idx >= rest.length) return label;
        const c = rest.charCodeAt(idx++);
        const digit =
          c >= 97 && c <= 122 ? c - 97
          : c >= 65 && c <= 90 ? c - 65
          : c >= 48 && c <= 57 ? c - 22
          : BASE;
        if (digit >= BASE) return label;
        i += digit * w;
        const t = k <= bias ? TMIN : k >= bias + TMAX ? TMAX : k - bias;
        if (digit < t) break;
        w *= BASE - t;
      }
      const outLen = output.length + 1;
      let delta = oldi === 0 ? Math.floor((i - oldi) / DAMP) : (i - oldi) >> 1;
      delta += Math.floor(delta / outLen);
      let k2 = 0;
      while (delta > Math.floor(((BASE - TMIN) * TMAX) / 2)) {
        delta = Math.floor(delta / (BASE - TMIN));
        k2 += BASE;
      }
      bias = k2 + Math.floor(((BASE - TMIN + 1) * delta) / (delta + SKEW));
      n += Math.floor(i / outLen);
      i %= outLen;
      output.splice(i, 0, n);
      i++;
    }
    return String.fromCodePoint(...output);
  } catch {
    return label;
  }
}

/** Converts an origin like https://xn--b1ag3bst.help to https://вычет.help. */
export function toUnicodeOrigin(origin: string): string {
  const match = origin.match(/^(https?:\/\/)([^/:]+)(:\d+)?$/i);
  if (!match) return origin;
  const [, protocol, host, port = ''] = match;
  const unicodeHost = host
    .split('.')
    .map((label) => (label.toLowerCase().startsWith('xn--') ? decodePunycodeLabel(label.slice(4)) : label))
    .join('.');
  return `${protocol}${unicodeHost}${port}`;
}

/** Current site origin with an IDN domain shown in Unicode form. */
export function getPublicOrigin(): string {
  return toUnicodeOrigin(window.location.origin);
}

/** Current page URL with an IDN domain shown in Unicode form. */
export function getPublicUrl(): string {
  const { pathname, search, hash } = window.location;
  return `${getPublicOrigin()}${pathname}${search}${hash}`;
}
