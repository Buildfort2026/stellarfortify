import { useCallback, useRef, useEffect } from 'react';
import * as echarts from 'echarts';
import { fmt } from '@/utils/format';
import type { Company } from '@/types/insurance';

interface CapitalSectionProps {
  companies: Company[];
  onCompanyClick: (name: string) => void;
}

export default function CapitalSection({ companies, onCompanyClick }: CapitalSectionProps) {
  const assetRef = useRef<HTMLDivElement>(null);
  const liabRef = useRef<HTMLDivElement>(null);
  const coreCapRef = useRef<HTMLDivElement>(null);
  const netPieRef = useRef<HTMLDivElement>(null);
  const chartInstances = useRef<Record<string, echarts.ECharts>>({});

  const initChart = useCallback((el: HTMLDivElement | null, key: string) => {
    if (!el) return null;
    if (chartInstances.current[key]) { chartInstances.current[key].dispose(); }
    const chart = echarts.init(el, undefined, { renderer: 'canvas' });
    chartInstances.current[key] = chart;
    return chart;
  }, []);

  useEffect(() => {
    const cs1 = companies.filter((c) => c.total_asset > 0).sort((a, b) => b.total_asset - a.total_asset);
    const ch1 = initChart(assetRef.current, 'asset');
    if (ch1) {
      ch1.setOption({
        backgroundColor: 'transparent',
        tooltip: { trigger: 'axis', formatter: (p: any) => {
          const name = p[0].name;
          const c = cs1.find((x) => x.name === name);
          return `<b>${name}</b><br/>总资产：${fmt.wan(c?.total_asset)}<br/>净资产：${fmt.wan(c?.net_asset)}<br/>净资产率：${fmt.pct(c?.net_asset_rate)}`;
        }},
        grid: { left: 140, right: 20, top: 20, bottom: 40 },
        xAxis: { type: 'value', axisLabel: { color: '#4a5a72', fontSize: 10, formatter: (v: number) => v >= 10000 ? (v / 10000).toFixed(0) + '万亿' : v + '亿' }, splitLine: { lineStyle: { color: 'rgba(255,255,255,0.04)' } } },
        yAxis: { type: 'category', data: cs1.map((c) => c.name).reverse(), axisLabel: { color: '#b0c0d8', fontSize: 10, width: 135, overflow: 'truncate' }, axisTick: { show: false }, axisLine: { show: false }, triggerEvent: true },
        series: [
          { name: '总资产', type: 'bar', barMaxWidth: 10, barCategoryGap: '2.5px', data: cs1.map((c) => Math.max(0, c.total_asset || 0)).reverse(), itemStyle: { borderRadius: [0, 3, 3, 0], color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [{ offset: 0, color: 'rgba(99,179,237,0.6)' }, { offset: 1, color: 'rgba(99,179,237,0.3)' }]) }, z: 1 },
          { name: '净资产', type: 'bar', barMaxWidth: 10, barGap: '-100%', data: cs1.map((c) => Math.max(0, c.net_asset || 0)).reverse(), itemStyle: { borderRadius: [0, 3, 3, 0], color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [{ offset: 0, color: 'rgba(104,211,145,0.8)' }, { offset: 1, color: 'rgba(104,211,145,0.4)' }]) }, z: 2 },
        ],
        legend: { data: ['总资产', '净资产'], top: 0, right: 0, textStyle: { color: '#8899b4', fontSize: 11 } },
      });
      ch1.off('click');
      ch1.on('click', (p: any) => onCompanyClick(p.name));
      ch1.resize();
    }

    const cs2 = companies.filter((c) => c.asset_liab_ratio > 0);
    const bins = [
      { label: '50%~60%', min: 0.5, max: 0.6 },
      { label: '60%~70%', min: 0.6, max: 0.7 },
      { label: '70%~80%', min: 0.7, max: 0.8 },
      { label: '80%~90%', min: 0.8, max: 0.9 },
      { label: '90%~100%', min: 0.9, max: 1.01 },
    ];
    const counts = bins.map((b) => cs2.filter((c) => c.asset_liab_ratio >= b.min && c.asset_liab_ratio < b.max).length);
    const ch2 = initChart(liabRef.current, 'liab');
    if (ch2) {
      ch2.setOption({
        backgroundColor: 'transparent',
        tooltip: { trigger: 'axis', formatter: (p: any) => `${p[0].name}<br/>公司数：${p[0].value}家` },
        grid: { left: 40, right: 10, top: 20, bottom: 40 },
        xAxis: { type: 'category', data: bins.map((b) => b.label), axisLabel: { color: '#8899b4', fontSize: 10, interval: 0 }, axisTick: { show: false }, axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } } },
        yAxis: { axisLabel: { color: '#4a5a72', fontSize: 10 }, splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } } },
        series: [{ type: 'bar', data: counts, barMaxWidth: 40, itemStyle: { borderRadius: [4, 4, 0, 0], color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: '#63b3ed' }, { offset: 1, color: 'rgba(99,179,237,0.3)' }]) }, label: { show: true, position: 'top', color: '#8899b4', fontSize: 11, fontWeight: 600, formatter: (p: any) => p.value + '家' } }],
      });
    }

    const validTags = ['顶级水准', '行业头部', '相对健康'];
    const cs3 = companies.filter((c) => validTags.includes(c.tag) && c.core_capital_ratio > 0).sort((a, b) => b.core_capital_ratio - a.core_capital_ratio).slice(0, 10);
    const ch3 = initChart(coreCapRef.current, 'core-cap');
    if (ch3) {
      ch3.setOption({
        backgroundColor: 'transparent',
        tooltip: { trigger: 'axis', formatter: (p: any) => `<b>${p[0].name}</b><br/>核心资本占比：${fmt.pct(p[0].value)}` },
        grid: { left: 100, right: 40, top: 10, bottom: 20 },
        xAxis: { type: 'value', axisLabel: { color: '#4a5a72', formatter: (v: number) => (v * 100).toFixed(0) + '%' }, splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } } },
        yAxis: { type: 'category', data: cs3.map((c) => c.name).reverse(), axisLabel: { color: '#8899b4', fontSize: 10 }, axisTick: { show: false }, axisLine: { show: false }, triggerEvent: true },
        series: [{ type: 'bar', data: cs3.map((c) => c.core_capital_ratio).reverse(), barMaxWidth: 16, itemStyle: { borderRadius: [0, 4, 4, 0], color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [{ offset: 0, color: '#68d391' }, { offset: 1, color: '#4fd1c5' }]) }, label: { show: true, position: 'right', color: '#8899b4', fontSize: 10, formatter: (p: any) => fmt.pct(p.value) } }],
      });
      ch3.off('click');
      ch3.on('click', (p: any) => onCompanyClick(p.name));
      ch3.resize();
    }

    const cs4 = companies.filter((c) => c.net_asset_rate > 0);
    const pieBins = [
      { label: '0~2%', min: 0, max: 0.02, color: '#fc8181' },
      { label: '2%~5%', min: 0.02, max: 0.05, color: '#f6ad55' },
      { label: '5%~8%', min: 0.05, max: 0.08, color: '#f6e05e' },
      { label: '8%~12%', min: 0.08, max: 0.12, color: '#68d391' },
      { label: '12%以上', min: 0.12, max: 99, color: '#4fd1c5' },
    ];
    const pieData = pieBins.map((b) => ({
      name: b.label,
      value: cs4.filter((c) => c.net_asset_rate >= b.min && c.net_asset_rate < b.max).length,
      itemStyle: { color: b.color + 'cc', borderColor: 'rgba(0,0,0,0.2)', borderWidth: 1 },
    }));
    const ch4 = initChart(netPieRef.current, 'net-pie');
    if (ch4) {
      ch4.setOption({
        backgroundColor: 'transparent',
        tooltip: { trigger: 'item', formatter: (p: any) => `${p.name}<br/>公司数：${p.value}家<br/>占比：${p.percent}%` },
        legend: { orient: 'vertical', right: 5, top: 'middle', textStyle: { color: '#8899b4', fontSize: 10 } },
        series: [{ type: 'pie', radius: ['40%', '72%'], center: ['42%', '50%'], data: pieData, label: { show: false }, emphasis: { scale: true, scaleSize: 5 } }],
      });
    }

    const handleResize = () => { Object.values(chartInstances.current).forEach((c) => c && c.resize()); };
    window.addEventListener('resize', handleResize);
    return () => { window.removeEventListener('resize', handleResize); Object.values(chartInstances.current).forEach((c) => c && c.dispose()); };
  }, [companies, onCompanyClick, initChart]);

  return (
    <div className="mb-7">
      <div className="flex items-start gap-2.5 mb-4 pb-3 border-b border-[rgba(99,179,237,0.12)]">
        <div className="sec-bar b2" />
        <div className="flex-1">
          <div className="text-base font-bold text-[#e8edf5] leading-tight">资本实力与结构</div>
          <div className="text-[11px] text-[#4a5a72] mt-1">总资产 · 净资产 · 认可资产负债率 · 核心资本占比 — 衡量险企资本厚度与质量</div>
        </div>
      </div>

      <div className="bg-[#111e35] border border-[rgba(99,179,237,0.12)] rounded-xl p-4 mb-4">
        <div className="flex items-start justify-between mb-3 gap-2">
          <div>
            <div className="text-[13px] font-bold text-[#e8edf5] leading-snug">资产规模全景（亿元）</div>
            <div className="text-[11px] text-[#4a5a72] mt-0.5 leading-snug">{companies.length}家纳入分析公司数据（含暂停披露）</div>
          </div>
        </div>
        <div ref={assetRef} style={{ height: 950 }} />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-[#111e35] border border-[rgba(99,179,237,0.12)] rounded-xl p-4">
          <div className="text-[13px] font-bold text-[#e8edf5] mb-3">认可资产负债率分布</div>
          <div className="text-[11px] text-[#4a5a72] mb-2">反映行业整体杠杆水平</div>
          <div ref={liabRef} style={{ height: 280 }} />
        </div>
        <div className="bg-[#111e35] border border-[rgba(99,179,237,0.12)] rounded-xl p-4">
          <div className="flex items-start justify-between mb-3 gap-2">
            <div>
              <div className="text-[13px] font-bold text-[#e8edf5] leading-snug">核心资本占比 Top 10</div>
              <div className="text-[11px] text-[#4a5a72] mt-0.5 leading-snug">核心资本/实际资本越高越好；部分公司数据未采纳</div>
            </div>
          </div>
          <div ref={coreCapRef} style={{ height: 280 }} />
        </div>
        <div className="bg-[#111e35] border border-[rgba(99,179,237,0.12)] rounded-xl p-4">
          <div className="text-[13px] font-bold text-[#e8edf5] mb-3">净资产比例分布</div>
          <div className="text-[11px] text-[#4a5a72] mb-2">净资产/总资产低于5%需关注</div>
          <div ref={netPieRef} style={{ height: 280 }} />
        </div>
      </div>
    </div>
  );
}
