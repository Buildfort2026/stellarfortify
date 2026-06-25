import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import * as echarts from 'echarts';
import { fmt } from '@/utils/format';
import { useInsuranceData } from '@/hooks/useInsuranceData';
import CompanyModal from '@/components/CompanyModal';
import type { Company } from '@/types/insurance';

export default function TrendPage() {
  const { curQ, quarters, getCompanies } = useInsuranceData();
  const [modalCompany, setModalCompany] = useState<Company | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [sl1, setSl1] = useState('中国人寿');
  const [sl2, setSl2] = useState('中国人寿');
  const [sl3, setSl3] = useState('中国人寿');

  const industryRef = useRef<HTMLDivElement>(null);
  const chSl1Ref = useRef<HTMLDivElement>(null);
  const chSl2Ref = useRef<HTMLDivElement>(null);
  const chSl3Ref = useRef<HTMLDivElement>(null);
  const chartInstances = useRef<Record<string, echarts.ECharts>>({});

  const allNames = useMemo(() => {
    const allNamesSet = new Set<string>();
    quarters.forEach((q) => {
      getCompanies(q.id).forEach((c) => allNamesSet.add(c.name));
    });
    return Array.from(allNamesSet);
  }, [quarters, getCompanies]);

  const initChart = useCallback((el: HTMLDivElement | null, key: string) => {
    if (!el) return null;
    if (chartInstances.current[key]) { chartInstances.current[key].dispose(); }
    const chart = echarts.init(el, undefined, { renderer: 'canvas' });
    chartInstances.current[key] = chart;
    return chart;
  }, []);

  const getCompanyHistory = useCallback((name: string) => {
    const qs = quarters.slice().sort((a, b) => a.id.localeCompare(b.id));
    return qs.map((q) => {
      const cs = getCompanies(q.id, false);
      const c = cs.find((x) => x.name === name);
      const year = q.id.slice(0, 4);
      const quarter = q.id.slice(4);
      return { q: qs.length > 20 ? year : year + quarter, data: c || null };
    });
  }, [quarters, getCompanies]);

  const handleCompanyClick = useCallback((name: string) => {
    const cs = getCompanies(curQ, false);
    const c = cs.find((x) => x.name === name);
    if (c) { setModalCompany(c); setModalOpen(true); }
  }, [curQ, getCompanies]);

  useEffect(() => {
    // 1. Industry Trend
    const qs = quarters.slice().sort((a, b) => a.id.localeCompare(b.id));
    const labels = qs.map((q) => q.label);
    const totalAssets = qs.map((q) => getCompanies(q.id).reduce((s, c) => s + (c.total_asset || 0), 0));
    const compMeds = qs.map((q) => {
      const vals = getCompanies(q.id).map((c) => c.comp_solvency).filter((v) => v > 0).sort((a, b) => a - b);
      return vals.length ? vals[Math.floor(vals.length / 2)] : 0;
    });
    const coreMeds = qs.map((q) => {
      const vals = getCompanies(q.id).map((c) => c.core_solvency).filter((v) => v > 0).sort((a, b) => a - b);
      return vals.length ? vals[Math.floor(vals.length / 2)] : 0;
    });

    const ch1 = initChart(industryRef.current, 'industry');
    if (ch1) {
      ch1.setOption({
        backgroundColor: 'transparent',
        tooltip: { trigger: 'axis', formatter: (p: any) => `<b>${p[0].axisValue}</b><br/>${p.map((s: any) => s.seriesName === '行业总资产(亿)' ? `${s.seriesName}：${fmt.wan(s.value)}` : `${s.seriesName}：${fmt.pct(s.value)}`).join('<br/>')}` },
        legend: { data: ['行业总资产(亿)', '综合偿付能力充足率中位数', '核心偿付能力充足率中位数'], top: 5, left: 'center', textStyle: { color: '#8899b4', fontSize: 10 } },
        grid: { left: 70, right: 80, top: 38, bottom: 28 },
        xAxis: { type: 'category', data: labels, axisLabel: { color: '#8899b4', fontSize: 11 }, axisTick: { show: false }, axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } } },
        yAxis: [
          { name: '总资产(亿)', nameTextStyle: { color: '#4a5a72', fontSize: 10 }, axisLabel: { color: '#4a5a72', fontSize: 10 }, splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } } },
          { name: '偿付能力充足率', nameTextStyle: { color: '#4a5a72', fontSize: 10 }, position: 'right', axisLabel: { color: '#4a5a72', fontSize: 10, formatter: (v: number) => (v * 100).toFixed(0) + '%' }, splitLine: { show: false } },
        ],
        series: [
          { name: '行业总资产(亿)', type: 'bar', yAxisIndex: 0, data: totalAssets, barMaxWidth: 40, itemStyle: { borderRadius: [3, 3, 0, 0], color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: 'rgba(99,179,237,0.6)' }, { offset: 1, color: 'rgba(99,179,237,0.2)' }]) } },
          { name: '综合偿付能力充足率中位数', type: 'line', yAxisIndex: 1, data: compMeds, smooth: true, lineStyle: { color: '#4fd1c5', width: 2 }, itemStyle: { color: '#4fd1c5' }, symbol: 'circle', symbolSize: 6 },
          { name: '核心偿付能力充足率中位数', type: 'line', yAxisIndex: 1, data: coreMeds, smooth: true, lineStyle: { color: '#f6ad55', width: 2 }, itemStyle: { color: '#f6ad55' }, symbol: 'circle', symbolSize: 6 },
        ],
      });
    }

    // Slice 1
    const hist1 = getCompanyHistory(sl1);
    const ch2 = initChart(chSl1Ref.current, 'sl1');
    if (ch2) {
      ch2.setOption({
        backgroundColor: 'transparent',
        tooltip: { trigger: 'axis', formatter: (p: any) => `<b>${p[0].axisValue}</b><br/>${p.map((s: any) => s.seriesName === '综合偿付能力充足率' ? `${s.seriesName}：${fmt.pct(s.value)}` : `${s.seriesName}：${fmt.num(s.value)}亿`).join('<br/>')}` },
        legend: { data: ['总资产', '净资产', '综合偿付能力充足率'], top: 0, right: 0, textStyle: { color: '#8899b4', fontSize: 10 } },
        grid: { left: 60, right: 60, top: 30, bottom: 30 },
        xAxis: { type: 'category', data: hist1.map((h) => h.q), axisLabel: { color: '#8899b4', fontSize: 10 }, axisTick: { show: false }, axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } } },
        yAxis: [
          { axisLabel: { color: '#4a5a72', fontSize: 10 }, splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } } },
          { position: 'right', axisLabel: { color: '#4a5a72', fontSize: 10, formatter: (v: number) => (v * 100).toFixed(0) + '%' }, splitLine: { show: false } },
        ],
        series: [
          { name: '总资产', type: 'bar', yAxisIndex: 0, data: hist1.map((h) => h.data?.total_asset || null), barMaxWidth: 20, itemStyle: { borderRadius: [3, 3, 0, 0], color: 'rgba(99,179,237,0.6)' } },
          { name: '净资产', type: 'bar', yAxisIndex: 0, data: hist1.map((h) => h.data?.net_asset || null), barMaxWidth: 14, itemStyle: { borderRadius: [3, 3, 0, 0], color: 'rgba(104,211,145,0.7)' } },
          { name: '综合偿付能力充足率', type: 'line', yAxisIndex: 1, data: hist1.map((h) => h.data?.comp_solvency || null), smooth: true, lineStyle: { color: '#f6ad55', width: 2 }, itemStyle: { color: '#f6ad55' }, symbol: 'circle', symbolSize: 5 },
        ],
      });
    }

    // Slice 2
    const hist2 = getCompanyHistory(sl2);
    const ch3 = initChart(chSl2Ref.current, 'sl2');
    if (ch3) {
      ch3.setOption({
        backgroundColor: 'transparent',
        tooltip: { trigger: 'axis', formatter: (p: any) => `<b>${p[0].axisValue}</b><br/>${p.map((s: any) => s.seriesName === '规模保费增速' ? `${s.seriesName}：${fmt.pct(s.value)}` : `${s.seriesName}：${fmt.num(s.value)}亿`).join('<br/>')}` },
        legend: { data: ['保险业务收入', '净利润', '规模保费增速'], top: 0, right: 0, textStyle: { color: '#8899b4', fontSize: 10 } },
        grid: { left: 60, right: 60, top: 30, bottom: 30 },
        xAxis: { type: 'category', data: hist2.map((h) => h.q), axisLabel: { color: '#8899b4', fontSize: 10 }, axisTick: { show: false }, axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } } },
        yAxis: [
          { axisLabel: { color: '#4a5a72', fontSize: 10 }, splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } } },
          { position: 'right', axisLabel: { color: '#4a5a72', fontSize: 10, formatter: (v: number) => (v * 100).toFixed(0) + '%' }, splitLine: { show: false } },
        ],
        series: [
          { name: '保险业务收入', type: 'bar', yAxisIndex: 0, data: hist2.map((h) => h.data?.income_q || null), barMaxWidth: 20, itemStyle: { borderRadius: [3, 3, 0, 0], color: 'rgba(99,179,237,0.6)' } },
          { name: '净利润', type: 'bar', yAxisIndex: 0, data: hist2.map((h) => h.data?.profit_q || null), barMaxWidth: 14, itemStyle: { color: (p: any) => p.value >= 0 ? 'rgba(104,211,145,0.7)' : 'rgba(252,129,129,0.7)' } },
          { name: '规模保费增速', type: 'line', yAxisIndex: 1, data: hist2.map((h) => h.data?.growth || null), smooth: true, lineStyle: { color: '#b794f4', width: 2 }, itemStyle: { color: '#b794f4' }, symbol: 'circle', symbolSize: 5 },
        ],
      });
    }

    // Slice 3
    const qs3 = quarters.slice().sort((a, b) => a.id.localeCompare(b.id));
    const yearMap: Record<string, Company> = {};
    qs3.forEach((q) => {
      const cs = getCompanies(q.id, false);
      const c = cs.find((x) => x.name === sl3);
      if (c && c.invest_3y_comp != null) yearMap[q.id.slice(0, 4)] = c;
    });
    const years = Object.keys(yearMap).sort();
    const ch4 = initChart(chSl3Ref.current, 'sl3');
    if (ch4) {
      ch4.setOption({
        backgroundColor: 'transparent',
        tooltip: { trigger: 'axis', formatter: (p: any) => `<b>${p[0].axisValue}年</b><br/>${p.map((s: any) => `${s.seriesName}：${fmt.pct(s.value)}`).join('<br/>')}` },
        legend: { data: ['近三年综合投资收益率', '近三年净投资收益率'], top: 0, right: 0, textStyle: { color: '#8899b4', fontSize: 10 } },
        grid: { left: 60, right: 20, top: 30, bottom: 30 },
        xAxis: { type: 'category', data: years.map((y) => y + '年'), axisLabel: { color: '#8899b4', fontSize: 10 }, axisTick: { show: false }, axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } } },
        yAxis: { axisLabel: { color: '#4a5a72', fontSize: 10, formatter: (v: number) => (v * 100).toFixed(1) + '%' }, splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } } },
        series: [
          { name: '近三年综合投资收益率', type: 'line', data: years.map((y) => yearMap[y].invest_3y_comp), smooth: true, lineStyle: { color: '#f6e05e', width: 2.5 }, itemStyle: { color: '#f6e05e' }, symbol: 'circle', symbolSize: 7, label: { show: true, position: 'top', color: '#f6e05e', fontSize: 10, formatter: (p: any) => fmt.pct(p.value) } },
          { name: '近三年净投资收益率', type: 'line', data: years.map((y) => yearMap[y].invest_3y), smooth: true, lineStyle: { color: '#4fd1c5', width: 2.5 }, itemStyle: { color: '#4fd1c5' }, symbol: 'circle', symbolSize: 7, label: { show: true, position: 'bottom', color: '#4fd1c5', fontSize: 10, formatter: (p: any) => fmt.pct(p.value) } },
        ],
      });
    }

    // Mini cards
    renderMiniCards();

    const handleResize = () => { Object.values(chartInstances.current).forEach((c) => c && c.resize()); };
    window.addEventListener('resize', handleResize);
    return () => { window.removeEventListener('resize', handleResize); Object.values(chartInstances.current).forEach((c) => c && c.dispose()); };
  }, [quarters, getCompanies, sl1, sl2, sl3, initChart, getCompanyHistory]);

  const renderMiniCards = () => {
    // Rendered via ECharts in useEffect
  };

  const quarterLabel = useMemo(() => {
    return quarters.find((q) => q.id === curQ)?.label || curQ;
  }, [quarters, curQ]);

  return (
    <div className="p-5 max-w-[1640px] mx-auto">
      {/* Industry Trend */}
      <div className="mb-5">
        <div className="flex items-start gap-2.5 mb-4 pb-3 border-b border-[rgba(99,179,237,0.12)]">
          <div className="sec-bar b5" />
          <div className="flex-1">
            <div className="text-base font-bold text-[#e8edf5] leading-tight">行业整体趋势追踪</div>
            <div className="text-[11px] text-[#4a5a72] mt-1">资产规模和偿付能力走势</div>
          </div>
        </div>
        <div className="bg-[#111e35] border border-[rgba(99,179,237,0.12)] rounded-xl p-4">
          <div ref={industryRef} style={{ height: 380 }} />
        </div>
      </div>

      {/* Eco Cards - simplified */}
      <div className="mb-5">
        <div className="flex items-start gap-2.5 mb-4 pb-3 border-b border-[rgba(99,179,237,0.12)]">
          <div className="sec-bar b1" />
          <div className="flex-1">
            <div className="text-base font-bold text-[#e8edf5] leading-tight">不同生态公司历史走势</div>
            <div className="text-[11px] text-[#4a5a72] mt-1">点击卡片可查看公司详情</div>
          </div>
        </div>
        <EcoSection type="old7" title="老七家（国内寿险行业规模 Top 7）" companies={getCompanies(curQ)} onCompanyClick={handleCompanyClick} getCompanyHistory={getCompanyHistory} />
        <EcoSection type="foreign" title="优秀合资/外资" companies={getCompanies(curQ)} onCompanyClick={handleCompanyClick} getCompanyHistory={getCompanyHistory} />
      </div>

      {/* Single Company Slices */}
      <div className="mb-5">
        <div className="flex items-start gap-2.5 mb-4 pb-3 border-b border-[rgba(99,179,237,0.12)]">
          <div className="sec-bar b3" />
          <div className="flex-1">
            <div className="text-base font-bold text-[#e8edf5] leading-tight">单公司历史走势观察</div>
            <div className="text-[11px] text-[#4a5a72] mt-1">选择公司，查看其历史资产、经营、投资三维度走势</div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-[#111e35] border border-[rgba(99,179,237,0.12)] rounded-xl p-4">
            <div className="text-[10px] text-[#4a5a72] mb-1.5 font-semibold uppercase tracking-wider">① 资产规模 & 偿付能力</div>
            <select value={sl1} onChange={(e) => setSl1(e.target.value)} className="w-full bg-[rgba(255,255,255,0.04)] border border-[rgba(99,179,237,0.12)] rounded-md px-2.5 py-1.5 text-[#4fd1c5] text-sm font-bold font-[inherit] cursor-pointer outline-none mb-2.5">
              {allNames.map((n) => <option key={n} value={n} className="bg-[#1a2540]">{n}</option>)}
            </select>
            <div ref={chSl1Ref} style={{ height: 210 }} />
          </div>
          <div className="bg-[#111e35] border border-[rgba(99,179,237,0.12)] rounded-xl p-4">
            <div className="text-[10px] text-[#4a5a72] mb-1.5 font-semibold uppercase tracking-wider">② 保费收入 & 净利润 & 增速</div>
            <select value={sl2} onChange={(e) => setSl2(e.target.value)} className="w-full bg-[rgba(255,255,255,0.04)] border border-[rgba(99,179,237,0.12)] rounded-md px-2.5 py-1.5 text-[#4fd1c5] text-sm font-bold font-[inherit] cursor-pointer outline-none mb-2.5">
              {allNames.map((n) => <option key={n} value={n} className="bg-[#1a2540]">{n}</option>)}
            </select>
            <div ref={chSl2Ref} style={{ height: 210 }} />
          </div>
          <div className="bg-[#111e35] border border-[rgba(99,179,237,0.12)] rounded-xl p-4">
            <div className="text-[10px] text-[#4a5a72] mb-1.5 font-semibold uppercase tracking-wider">③ 投资收益率走势（年度）</div>
            <select value={sl3} onChange={(e) => setSl3(e.target.value)} className="w-full bg-[rgba(255,255,255,0.04)] border border-[rgba(99,179,237,0.12)] rounded-md px-2.5 py-1.5 text-[#4fd1c5] text-sm font-bold font-[inherit] cursor-pointer outline-none mb-2.5">
              {allNames.map((n) => <option key={n} value={n} className="bg-[#1a2540]">{n}</option>)}
            </select>
            <div ref={chSl3Ref} style={{ height: 210 }} />
          </div>
        </div>
      </div>

      <CompanyModal company={modalCompany} quarterLabel={quarterLabel} open={modalOpen} onOpenChange={setModalOpen} />
    </div>
  );
}

function EcoSection({ type, title, companies, onCompanyClick, getCompanyHistory }: {
  type: string; title: string; companies: Company[]; onCompanyClick: (name: string) => void;
  getCompanyHistory: (name: string) => Array<{ q: string; data: Company | null }>;
}) {
    const chartRefs = useRef<Record<string, echarts.ECharts>>({});

  let names: string[] = [];
  if (type === 'old7') {
    names = companies.filter((c) => c.eco === '老七家').sort((a, b) => (b.total_asset || 0) - (a.total_asset || 0)).map((c) => c.name);
  } else if (type === 'foreign') {
    names = companies.filter((c) => ['顶级水准', '行业头部'].includes(c.tag) && ['合资', '外资'].includes(c.type)).sort((a, b) => (b.total_asset || 0) - (a.total_asset || 0)).slice(0, 7).map((c) => c.name);
  }

  useEffect(() => {
    names.forEach((name) => {
      const chartId = `mini-${type}-${name}`;
      const el = document.getElementById(chartId);
      if (!el) return;
      if (chartRefs.current[chartId]) chartRefs.current[chartId].dispose();
      const chart = echarts.init(el, undefined, { renderer: 'canvas' });
      chartRefs.current[chartId] = chart;

      const hist = getCompanyHistory(name);
      const assetData = hist.map((h) => h.data?.total_asset || null);
      const profitData = hist.map((h) => h.data?.net_asset || null);
      const solData = hist.map((h) => h.data?.comp_solvency || null);
      const labels = hist.map((h) => h.q);

      chart.setOption({
        backgroundColor: 'transparent',
        tooltip: { trigger: 'axis', confine: true, textStyle: { fontSize: 10 }, formatter: (p: any) => p.map((s: any) => `${s.seriesName}：${s.seriesName === '偿付能力' ? fmt.pct(s.value) : fmt.num(s.value) + '亿'}`).join('<br/>') },
        grid: { left: 8, right: 8, top: 5, bottom: 18 },
        xAxis: { type: 'category', data: labels, axisLabel: { color: '#4a5a72', fontSize: 8, interval: (idx: number) => idx === 0 || idx === labels.length - 1 }, axisTick: { show: false }, axisLine: { show: false } },
        yAxis: [{ type: 'value', show: false }, { type: 'value', show: false }],
        series: [
          { name: '总资产', type: 'bar', yAxisIndex: 0, data: assetData, barMaxWidth: 8, itemStyle: { borderRadius: [2, 2, 0, 0], color: 'rgba(99,179,237,0.5)' } },
          { name: '净资产', type: 'bar', yAxisIndex: 0, data: profitData, barMaxWidth: 6, itemStyle: { borderRadius: [2, 2, 0, 0], color: (p: any) => (p.value || 0) >= 0 ? 'rgba(104,211,145,0.7)' : 'rgba(252,129,129,0.7)' } },
          { name: '偿付能力', type: 'line', yAxisIndex: 1, data: solData, smooth: true, lineStyle: { color: '#f6ad55', width: 1.5 }, itemStyle: { color: '#f6ad55' }, symbol: 'circle', symbolSize: 3 },
        ],
      });
    });

    return () => { Object.values(chartRefs.current).forEach((c) => c && c.dispose()); };
  }, [names, getCompanyHistory, type]);

  return (
    <div className="mb-5">
      <div className={`eco-title ${type}`}>{title}</div>
      <div className="grid grid-cols-7 gap-3">
        {names.map((name) => (
          <div key={name} className="mini-card" onClick={() => onCompanyClick(name)}>
            <div className="text-[11px] font-bold text-[#e8edf5] mb-2 whitespace-nowrap overflow-hidden text-ellipsis">{name}</div>
            <div className="h-[110px]" id={`mini-${type}-${name}`} />
          </div>
        ))}
      </div>
    </div>
  );
}
