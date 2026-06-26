import { useMemo } from 'react';
import { fmt, deltaHtml } from '@/utils/format';
import type { Company } from '@/types/insurance';

interface KPISectionProps {
  companies: Company[];
  qData: { kpi: { prev_solvency_median?: number; prev_total_asset?: number }; suspended_count: number } | null;
  prevQData: { companies: Company[] } | null;
}

const KPI_COLORS = [
  { cls: 'c1', valColor: 'text-[#4fd1c5]', gradient: 'from-[#4fd1c5] to-[#63b3ed]' },
  { cls: 'c2', valColor: 'text-[#63b3ed]', gradient: 'from-[#63b3ed] to-[#7f9cf5]' },
  { cls: 'c3', valColor: 'text-[#68d391]', gradient: 'from-[#68d391] to-[#4fd1c5]' },
  { cls: 'c4', valColor: 'text-[#ecc94b]', gradient: 'from-[#f6ad55] to-[#f6e05e]' },
  { cls: 'c5', valColor: 'text-[#b794f4]', gradient: 'from-[#b794f4] to-[#9f7aea]' },
];

export default function KPISection({ companies, qData, prevQData }: KPISectionProps) {
  const stats = useMemo(() => {
    if (!companies.length) return null;

    const suspendedCount = qData?.suspended_count || 0;

    // Solvency median
    const solVals = companies.map((c) => c.comp_solvency).filter((v) => (v ?? 0) > 0).sort((a, b) => (a ?? 0) - (b ?? 0));
    const solMed = solVals.length ? solVals[Math.floor(solVals.length / 2)] : 0;
    const prevSolMed = qData?.kpi?.prev_solvency_median || null;

    // Total asset
    const totalAsset = companies.reduce((s, c) => s + (c.total_asset || 0), 0);
    const prevTotalAsset = qData?.kpi?.prev_total_asset || null;

    // Growth median
    const growVals = companies.map((c) => c.growth).filter((v) => v != null && !isNaN(v)).sort((a, b) => (a ?? 0) - (b ?? 0));
    const growMed = growVals.length ? growVals[Math.floor(growVals.length / 2)] : 0;

    // Prev growth median
    let prevGrowMed: number | null = null;
    if (prevQData) {
      const pgVals = prevQData.companies
        .map((c) => c.growth)
        .filter((v): v is number => v != null && !isNaN(v))
        .sort((a, b) => a - b);
      prevGrowMed = pgVals.length ? pgVals[Math.floor(pgVals.length / 2)] : null;
    }

    // Investment 3y median
    const inv3yVals = companies
      .map((c) => c.invest_3y_comp)
      .filter((v): v is number => v != null && !isNaN(v))
      .sort((a, b) => a - b);
    const inv3yMed = inv3yVals.length ? inv3yVals[Math.floor(inv3yVals.length / 2)] : 0;

    // Prev inv3y median
    let prevInv3yMed: number | null = null;
    if (prevQData) {
      const piVals = prevQData.companies
        .map((c) => c.invest_3y_comp)
        .filter((v): v is number => v != null && !isNaN(v))
        .sort((a, b) => a - b);
      prevInv3yMed = piVals.length ? piVals[Math.floor(piVals.length / 2)] : null;
    }

    return {
      count: companies.length,
      suspendedCount,
      totalAsset,
      prevTotalAsset,
      solMed,
      prevSolMed,
      growMed,
      prevGrowMed,
      growDisclosed: growVals.length,
      inv3yMed,
      prevInv3yMed,
      inv3yDisclosed: inv3yVals.length,
    };
  }, [companies, qData, prevQData]);

  if (!stats) return null;

  const items = [
    {
      label: '披露公司总数',
      value: `${stats.count}家`,
      sub: `未披露：${stats.suspendedCount}家`,
      tip: null as string | null,
    },
    {
      label: '行业总资产合计',
      value: fmt.wan(stats.totalAsset),
      sub: `较上季度 ${deltaHtml(stats.totalAsset, stats.prevTotalAsset, false)}`,
      tip: `${stats.count}家纳入分析公司合计`,
    },
    {
      label: '综合偿付能力充足率·行业中位数',
      value: fmt.pct(stats.solMed, 1),
      sub: `较上季度 ${deltaHtml(stats.solMed, stats.prevSolMed)}`,
      tip: null,
    },
    {
      label: '规模保费同比增速·行业中位数',
      value: fmt.pct(stats.growMed, 2),
      sub: `较上季度 ${deltaHtml(stats.growMed, stats.prevGrowMed, true, 2)}`,
      tip: `已披露增速数据 ${stats.growDisclosed} 家`,
    },
    {
      label: '近三年平均综合投资收益率',
      value: fmt.pct(stats.inv3yMed, 2),
      sub: `较上季度 ${deltaHtml(stats.inv3yMed, stats.prevInv3yMed, true, 2)}`,
      tip: `已披露近三年投资收益率 ${stats.inv3yDisclosed} 家；此处为行业中位数`,
    },
  ];

  return (
    <div className="grid grid-cols-5 gap-3.5 mb-6">
      {items.map((item, idx) => {
        const color = KPI_COLORS[idx];
        return (
          <div
            key={idx}
            className={`relative overflow-hidden bg-[#111e35] border border-[rgba(99,179,237,0.12)] rounded-xl p-4 transition-all hover:border-[rgba(99,179,237,0.3)] hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,0,0,0.3)] ${color.cls}`}
          >
            <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${color.gradient}`} />
            <div className="text-[10px] text-[#4a5a72] uppercase tracking-wider mb-1.5 font-semibold flex items-center gap-1 flex-wrap">
              {item.label}
              {item.tip && <InfoTip text={item.tip} />}
            </div>
            <div className={`text-2xl font-extrabold leading-none mb-1.5 tracking-tight ${color.valColor}`}>
              {item.value}
            </div>
            <div className="text-[11px] text-[#4a5a72] flex items-center gap-1.5 flex-wrap">
              {item.sub}
            </div>
          </div>
        );
      })}
    </div>
  );
}

import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

function InfoTip({ text }: { text: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button className="w-4 h-4 rounded-full border border-[#4a5a72] bg-transparent text-[#4a5a72] inline-flex items-center justify-center text-[9px] font-extrabold cursor-pointer hover:border-[#63b3ed] hover:text-[#63b3ed] ml-0.5">
          i
        </button>
      </TooltipTrigger>
      <TooltipContent 
        side="top" 
        sideOffset={6}
        className="bg-[#1e2d4a] border border-[rgba(99,179,237,0.3)] rounded-lg px-3.5 py-2 text-[11px] text-[#8899b4] w-[220px] leading-relaxed shadow-xl"
      >
        {text}
      </TooltipContent>
    </Tooltip>
  );
}