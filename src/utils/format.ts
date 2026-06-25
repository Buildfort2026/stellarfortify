export const fmt = {
  pct: (v: number | null | undefined, d = 1): string => {
    if (v == null || (typeof v === 'number' && isNaN(v))) return '—';
    return (v * 100).toFixed(d) + '%';
  },
  pct2: (v: number | null | undefined, d = 1): string => {
    if (v == null || (typeof v === 'number' && isNaN(v))) return '—';
    return (+v).toFixed(d) + '%';
  },
  num: (v: number | null | undefined, d = 1): string => {
    if (v == null || (typeof v === 'number' && isNaN(v))) return '—';
    return (+v).toFixed(d);
  },
  wan: (v: number | null | undefined): string => {
    if (v == null || (typeof v === 'number' && isNaN(v))) return '—';
    return (+v >= 10000 ? (v / 10000).toFixed(2) + '万亿' : (+v).toFixed(2) + '亿');
  },
  sign: (v: number): string => (v > 0 ? '+' : ''),
};

export function tagClass(tag: string | null | undefined): string {
  if (!tag) return 'tag-other';
  if (tag === '行业头部') return 'tag-head';
  if (tag === '顶级水准') return 'tag-top';
  if (tag === '相对健康') return 'tag-healthy';
  if (['净资产比例低于5%', '评级为B', '偿付能力低于100%', '评级不达标', '连续两年净现金流为负'].includes(tag))
    return 'tag-risk';
  return 'tag-other';
}

export function ratingClass(r: string | null | undefined): string {
  if (!r) return '';
  return 'rb-' + r.replace(/\+/g, '').trim();
}

export function mTagClass(tag: string | null | undefined): string {
  if (!tag) return 'other';
  if (tag === '行业头部') return 'head';
  if (tag === '顶级水准') return 'top';
  if (tag === '相对健康') return 'healthy';
  if (['净资产比例低于5%', '评级为B', '偿付能力低于100%', '评级不达标', '连续两年净现金流为负'].includes(tag))
    return 'risk';
  return 'other';
}

export function deltaHtml(cur: number | null, prev: number | null, isPct = true, digits = 1): string {
  if (prev == null || cur == null) return '';
  const d = cur - prev;
  const sign = d >= 0 ? '+' : '';
  const str = isPct ? `${sign}${(d * 100).toFixed(digits)}%` : `${sign}${(d / 10000).toFixed(2)}万亿`;
  return str;
}

export function getRatingWeight(r: string | null | undefined): number {
  const w: Record<string, number> = { AAA: 8, AA: 7, A: 6, BBB: 5, BB: 4, B: 3, C: 2, D: 1 };
  return w[r || ''] || 0;
}
