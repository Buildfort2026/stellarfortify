export const fmt = {
  pct: (v: number | null | undefined, d = 1): string => {
    if (v == null || isNaN(+v)) return "—";
    return (v * 100).toFixed(d) + "%";
  },
  pct2: (v: number | null | undefined, d = 1): string => {
    if (v == null || isNaN(+v)) return "—";
    return (+v).toFixed(d) + "%";
  },
  num: (v: number | null | undefined, d = 1): string => {
    if (v == null || isNaN(+v)) return "—";
    return (+v).toFixed(d);
  },
  wan: (v: number | null | undefined): string => {
    if (v == null || isNaN(+v)) return "—";
    return +v >= 10000 ? (v / 10000).toFixed(2) + "万亿" : (+v).toFixed(2) + "亿";
  },
  sign: (v: number): string => (v > 0 ? "+" : ""),
};

export function tagClass(tag?: string): string {
  if (!tag) return "tag-other";
  if (tag === "行业头部") return "tag-head";
  if (tag === "顶级水准") return "tag-top";
  if (tag === "相对健康") return "tag-healthy";
  if (["净资产比例低于5%", "评级为B", "偿付能力低于100%", "评级不达标", "连续两年净现金流为负"].includes(tag)) return "tag-risk";
  return "tag-other";
}

export function ratingClass(r?: string): string {
  if (!r) return "";
  return "rb-" + r.replace(/\+/g, "").trim();
}

export function mTagClass(tag?: string): string {
  if (!tag) return "other";
  if (tag === "行业头部") return "head";
  if (tag === "顶级水准") return "top";
  if (tag === "相对健康") return "healthy";
  if (["净资产比例低于5%", "评级为B", "偿付能力低于100%", "评级不达标", "连续两年净现金流为负"].includes(tag)) return "risk";
  return "other";
}
