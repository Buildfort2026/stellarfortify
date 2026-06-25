import { useCallback, useRef, useEffect } from 'react';
import * as echarts from 'echarts';
import { fmt } from '@/utils/format';
import type { Company } from '@/types/insurance';

interface InvestmentSectionProps {
  companies: Company[];
  onCompanyClick: (name: string) => void;
}

export default function InvestmentSection({ companies, onCompanyClick }: InvestmentSectionProps) {
  const invTopRef = useRef<HTMLDivElement>(null);
  const invOld7Ref = useRef<HTMLDivElement>(null);
  const invQualRef = useRef<HTMLDivElement>(null);
  const butterflyRef = useRef<HTMLDivElement>(null);
  const chartInstances = useRef<Record<string, echarts.ECharts>>({});

  const initChart = useCallback((el: HTMLDivElement | null, key: string) => {
    if (!el) return null;
    if (chartInstances.current[key]) { chartInstances.current[key].dispose(); }
    const chart = echarts.init(el, undefined, { renderer: 'canvas' });
    chartInstances.current[key] = chart;
    return chart;
  }, []);

  useEffect(() => {
    // 1. Investment Top 10
    const cs1 = companies.filter((c) => c.invest_comp != null && !isNaN(c.invest_comp)).sort((a, b) => (b.invest_comp ?? 0) - (a.invest_comp ?? 0)).slice(0, 10);
    const ch1 = initChart(invTopRef.current, 'inv-top');
    if (ch1) {
      ch1.setOption({
        backgroundColor: 'transparent',
        tooltip: { trigger: 'item', formatter: (p: any) => `<b>${p.name}</b><br/>综合投资收益率：${fmt.pct(p.value)}` },
        grid: { left: 110, right: 60, top: 10, bottom: 20 },
        xAxis: { type: 'value', axisLabel: { color: '#4a5a72', formatter: (v: number) => (v * 100).toFixed(1) + '%' }, splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } } },
        yAxis: { type: 'category', data: cs1.map((c) => c.name).reverse(), axisLabel: { color: '#8899b4', fontSize: 10 }, axisTick: { show: false }, axisLine: { show: false }, triggerEvent: true },
        series: [{ type: 'bar', data: cs1.map((c) => c.invest_comp).reverse(), barMaxWidth: 20, itemStyle: { borderRadius: [0, 5, 5, 0], color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [{ offset: 0, color: 'rgba(246,224,94,0.8)' }, { offset: 1, color: 'rgba(246,173,85,0.5)' }]) }, label: { show: true, position: 'right', color: '#f6e05e', fontSize: 14, fontWeight: 800, formatter: (p: any) => fmt.pct(p.value) } }],
      });
      ch1.off('click');
      ch1.on('click', (p: any) => onCompanyClick(p.name));
      ch1.resize();
    }

    // 2. Old 7
    const cs2 = companies.filter((c) => c.eco === '老七家' && c.invest_3y_comp != null && c.invest_3y != null);
    const ch2 = initChart(invOld7Ref.current, 'inv-old7');
    if (ch2) {
      ch2.setOption({
        backgroundColor: 'transparent',
        tooltip: { trigger: 'axis', formatter: (p: any) => `<b>${p[0].axisValue}</b><br/>${p.map((s: any) => `${s.seriesName}：${fmt.pct(s.value)}`).join('<br/>')}` },
        legend: { data: ['近三年综合投资收益率', '近三年净投资收益率'], top: 0, right: 0, textStyle: { color: '#8899b4', fontSize: 10 } },
        grid: { left: 50, right: 10, top: 30, bottom: 60 },
        xAxis: { type: 'category', data: cs2.map((c) => c.name), axisLabel: { color: '#8899b4', fontSize: 10, rotate: 30 }, axisTick: { show: false }, axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } } },
        yAxis: { axisLabel: { color: '#4a5a72', formatter: (v: number) => (v * 100).toFixed(1) + '%' }, splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } } },
        series: [
          { name: '近三年综合投资收益率', type: 'bar', barMaxWidth: 18, data: cs2.map((c) => c.invest_3y_comp), itemStyle: { borderRadius: [3, 3, 0, 0], color: 'rgba(99,179,237,0.7)' } },
          { name: '近三年净投资收益率', type: 'bar', barMaxWidth: 18, data: cs2.map((c) => c.invest_3y), itemStyle: { borderRadius: [3, 3, 0, 0], color: 'rgba(104,211,145,0.7)' } },
        ],
      });
      ch2.off('click');
      ch2.on('click', (p: any) => onCompanyClick(p.name));
      ch2.resize();
    }

    // 3. Quality Companies
    const cs3 = companies.filter((c) => (c.tag === '行业头部' || c.tag === '顶级水准') && c.eco !== '老七家' && c.invest_3y_comp != null && c.invest_3y != null).sort((a, b) => (b.invest_3y_comp ?? 0) - (a.invest_3y_comp ?? 0)).slice(0, 10);
    const ch3 = initChart(invQualRef.current, 'inv-qual');
    if (ch3) {
      ch3.setOption({
        backgroundColor: 'transparent',
        tooltip: { trigger: 'axis', formatter: (p: any) => `<b>${p[0].axisValue}</b><br/>${p.map((s: any) => `${s.seriesName}：${fmt.pct(s.value)}`).join('<br/>')}` },
        legend: { data: ['近三年综合投资收益率', '近三年净投资收益率'], top: 0, right: 0, textStyle: { color: '#8899b4', fontSize: 10 } },
        grid: { left: 50, right: 10, top: 30, bottom: 60 },
        xAxis: { type: 'category', data: cs3.map((c) => c.name), axisLabel: { color: '#8899b4', fontSize: 10, rotate: 30 }, axisTick: { show: false }, axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } } },
        yAxis: { axisLabel: { color: '#4a5a72', formatter: (v: number) => (v * 100).toFixed(1) + '%' }, splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } } },
        series: [
          { name: '近三年综合投资收益率', type: 'bar', barMaxWidth: 18, data: cs3.map((c) => c.invest_3y_comp), itemStyle: { borderRadius: [3, 3, 0, 0], color: 'rgba(183,148,244,0.7)' } },
          { name: '近三年净投资收益率', type: 'bar', barMaxWidth: 18, data: cs3.map((c) => c.invest_3y), itemStyle: { borderRadius: [3, 3, 0, 0], color: 'rgba(246,224,94,0.7)' } },
        ],
      });
      ch3.off('click');
      ch3.on('click', (p: any) => onCompanyClick(p.name));
      ch3.resize();
    }

    // 4. Butterfly
    const cs4 = companies.filter((c) => c.market_risk_ratio > 0 && (c.equity_risk_ratio ?? 0) > 0).sort((a, b) => (b.market_risk_ratio + (b.equity_risk_ratio ?? 0)) - (a.market_risk_ratio + (a.equity_risk_ratio ?? 0))).slice(0, 20);
    const maxTotal = Math.max.apply(null, cs4.map((c) => c.market_risk_ratio + (c.equity_risk_ratio ?? 0))) * 1.05;
    const ch4 = initChart(butterflyRef.current, 'butterfly');
    if (ch4) {
      ch4.setOption({
        backgroundColor: 'transparent',
        tooltip: { trigger: 'axis', formatter: (p: any) => {
          const n = p[0].axisValue;
          const c = cs4.find((x) => x.name === n);
          const total = (c?.market_risk_ratio || 0) + (c?.equity_risk_ratio || 0);
          return `<b>${n}</b><br/>市场风险占比：${fmt.pct(c?.market_risk_ratio)}<br/>权益投资风险占比：${fmt.pct(c?.equity_risk_ratio)}<br/>合计：${fmt.pct(total)}`;
        }},
        legend: { data: ['市场风险占比', '权益投资风险占比'], top: 0, right: 0, textStyle: { color: '#8899b4', fontSize: 11 } },
        grid: { left: 120, right: 40, top: 30, bottom: 20 },
        xAxis: { type: 'value', min: 0, max: maxTotal, axisLabel: { color: '#4a5a72', formatter: (v: number) => (v * 100).toFixed(0) + '%', interval: 0.4 }, splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } }, axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } } },
        yAxis: { type: 'category', data: cs4.map((c) => c.name), axisLabel: { color: '#b0c0d8', fontSize: 10, fontWeight: 600 }, axisTick: { show: false }, axisLine: { show: false }, triggerEvent: true },
        series: [
          { name: '市场风险占比', type: 'bar', stack: 'risk', barMaxWidth: 14, data: cs4.map((c) => c.market_risk_ratio ?? 0), itemStyle: { borderRadius: 0, color: 'rgba(99,179,237,0.8)' }, label: { show: true, position: 'inside', color: '#e8edf5', fontSize: 9, formatter: (p: any) => (p.value * 100).toFixed(0) + '%' } },
          { name: '权益投资风险占比', type: 'bar', stack: 'risk', barMaxWidth: 14, data: cs4.map((c) => c.equity_risk_ratio ?? 0), itemStyle: { borderRadius: [0, 3, 3, 0], color: 'rgba(246,224,94,0.8)' }, label: { show: true, position: 'right', color: '#f6e05e', fontSize: 9, formatter: (p: any) => '+' + (p.value * 100).toFixed(0) + '%' } },
        ],
      });
      ch4.off('click');
      ch4.on('click', (p: any) => onCompanyClick(p.name));
    }

    const handleResize = () => { Object.values(chartInstances.current).forEach((c) => c && c.resize()); };
    window.addEventListener('resize', handleResize);
    return () => { window.removeEventListener('resize', handleResize); Object.values(chartInstances.current).forEach((c) => c && c.dispose()); };
  }, [companies, onCompanyClick, initChart]);

  return (
    <div className="mb-7">
      <div className="flex items-start gap-2.5 mb-4 pb-3 border-b border-[rgba(99,179,237,0.12)]">
        <div className="sec-bar b4" />
        <div className="flex-1">
          <div className="text-base font-bold text-[#e8edf5] leading-tight">投资能力</div>
          <div className="text-[11px] text-[#4a5a72] mt-1">综合投资收益率 · 近三年平均 · 资产配置策略 — 衡量险企资产管理水平</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="bg-[#111e35] border border-[rgba(99,179,237,0.12)] rounded-xl p-4">
          <div className="text-[13px] font-bold text-[#e8edf5] mb-3">本年累计综合投资收益率 Top 10</div>
          <div className="text-[11px] text-[#4a5a72] mb-2">综合投资收益率含浮盈浮亏，反映当期实际投资回报</div>
          <div ref={invTopRef} style={{ height: 300 }} />
        </div>
        <div className="bg-[#111e35] border border-[rgba(99,179,237,0.12)] rounded-xl p-4">
          <div className="text-[13px] font-bold text-[#e8edf5] mb-3">老七家近三年平均投资收益率</div>
          <div className="text-[11px] text-[#4a5a72] mb-2">综合投资收益率（含浮盈）vs 净投资收益率</div>
          <div ref={invOld7Ref} style={{ height: 300 }} />
        </div>
        <div className="bg-[#111e35] border border-[rgba(99,179,237,0.12)] rounded-xl p-4">
          <div className="text-[13px] font-bold text-[#e8edf5] mb-3">优质公司近三年平均投资收益率</div>
          <div className="text-[11px] text-[#4a5a72] mb-2">顶级水准 + 行业头部（非老七家）</div>
          <div ref={invQualRef} style={{ height: 300 }} />
        </div>
      </div>

      <div className="bg-[#111e35] border border-[rgba(99,179,237,0.12)] rounded-xl p-4">
        <div className="text-[13px] font-bold text-[#e8edf5] mb-3">资产配置策略：市场风险占比和权益投资风险占比（Top 20）</div>
        <div className="text-[11px] text-[#4a5a72] mb-2">柱子越长，有可能投资越进取。仅做粗略参考</div>
        <div ref={butterflyRef} style={{ height: 420 }} />
      </div>
    </div>
  );
}
