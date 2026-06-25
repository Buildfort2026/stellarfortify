import { useCallback, useRef, useEffect } from 'react';
import * as echarts from 'echarts';
import { fmt } from '@/utils/format';
import type { Company } from '@/types/insurance';

interface OperationSectionProps {
  companies: Company[];
  curQ: string;
  onCompanyClick: (name: string) => void;
}

export default function OperationSection({ companies, curQ, onCompanyClick }: OperationSectionProps) {
  const treemapRef = useRef<HTMLDivElement>(null);
  const profitRef = useRef<HTMLDivElement>(null);
  const growthRef = useRef<HTMLDivElement>(null);
  const roeRef = useRef<HTMLDivElement>(null);
  const surrenderRef = useRef<HTMLDivElement>(null);
  const chartInstances = useRef<Record<string, echarts.ECharts>>({});

  const initChart = useCallback((el: HTMLDivElement | null, key: string) => {
    if (!el) return null;
    if (chartInstances.current[key]) { chartInstances.current[key].dispose(); }
    const chart = echarts.init(el, undefined, { renderer: 'canvas' });
    chartInstances.current[key] = chart;
    return chart;
  }, []);

  useEffect(() => {
    const colors = ['#63b3ed', '#4fd1c5', '#68d391', '#f6e05e', '#f6ad55', '#b794f4', '#fc8181', '#7f9cf5'];

    // 1. Treemap
    const cs1 = companies.filter((c) => c.income_q > 0).sort((a, b) => b.income_q - a.income_q).slice(0, 20);
    const ch1 = initChart(treemapRef.current, 'treemap');
    if (ch1) {
      ch1.setOption({
        backgroundColor: 'transparent',
        tooltip: { formatter: (p: any) => `<b>${p.name}</b><br/>保险业务收入：${fmt.wan(p.value)}亿` },
        series: [{ type: 'treemap', roam: false, nodeClick: false, breadcrumb: { show: false }, data: cs1.map((c, i) => ({ name: c.name, value: c.income_q, itemStyle: { color: colors[i % colors.length] + 'aa', borderColor: 'rgba(0,0,0,0.2)', borderWidth: 1, gapWidth: 2 }, label: { show: true, color: '#fff', fontWeight: 700, fontSize: 11 } })) }],
      });
      ch1.off('click');
      ch1.on('click', (p: any) => onCompanyClick(p.name));
      ch1.resize();
    }

    // 2. Profit
    const cs2 = companies.filter((c) => c.profit_y != null).sort((a, b) => (b.profit_y || 0) - (a.profit_y || 0)).slice(0, 20);
    const ch2 = initChart(profitRef.current, 'profit');
    if (ch2) {
      ch2.setOption({
        backgroundColor: 'transparent',
        tooltip: { trigger: 'axis', formatter: (p: any) => {
          const n = p[0].name;
          const c = cs2.find((x) => x.name === n);
          return `<b>${n}</b><br/>年度累计净利润：${fmt.num(c?.profit_y)}亿<br/>季度净利润：${fmt.num(c?.profit_q)}亿`;
        }},
        legend: { data: ['年度累计净利润', '季度净利润'], top: 0, right: 0, textStyle: { color: '#8899b4', fontSize: 11 } },
        grid: { left: 120, right: 40, top: 30, bottom: 20 },
        xAxis: { type: 'value', axisLabel: { color: '#4a5a72', fontSize: 10 }, splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } }, axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } } },
        yAxis: { type: 'category', data: cs2.map((c) => c.name).reverse(), axisLabel: { color: '#8899b4', fontSize: 10 }, axisTick: { show: false }, axisLine: { show: false }, triggerEvent: true },
        series: [
          { name: '年度累计净利润', type: 'bar', barMaxWidth: 12, data: cs2.map((c) => c.profit_y || 0).reverse(), itemStyle: { borderRadius: [0, 3, 3, 0], color: (p: any) => p.value >= 0 ? new echarts.graphic.LinearGradient(0, 0, 1, 0, [{ offset: 0, color: 'rgba(99,179,237,0.8)' }, { offset: 1, color: 'rgba(99,179,237,0.3)' }]) : new echarts.graphic.LinearGradient(0, 0, 1, 0, [{ offset: 0, color: 'rgba(252,129,129,0.8)' }, { offset: 1, color: 'rgba(252,129,129,0.3)' }]) }, label: { show: true, position: 'right', color: '#8899b4', fontSize: 9, formatter: (p: any) => fmt.num(p.value) + '亿' } },
          { name: '季度净利润', type: 'bar', barMaxWidth: 8, data: cs2.map((c) => c.profit_q || 0).reverse(), itemStyle: { borderRadius: [0, 2, 2, 0], color: (p: any) => p.value >= 0 ? 'rgba(104,211,145,0.7)' : 'rgba(246,173,85,0.7)' } },
        ],
      });
      ch2.off('click');
      ch2.on('click', (p: any) => onCompanyClick(p.name));
      ch2.resize();
    }

    // 3. Growth
    const riskTags = ['评级不达标', '评级为B', '偿付能力低于100%'];
    const latestYear = parseInt(curQ.replace('Q', '').slice(0, 4));
    const cs3 = companies.filter((c) => {
      if (riskTags.includes(c.tag)) return false;
      if (c.growth == null || isNaN(c.growth)) return false;
      if (c.found_year && (latestYear - c.found_year) < 5) return false;
      return true;
    }).sort((a, b) => (b.growth ?? 0) - (a.growth ?? 0)).slice(0, 20);
    const ch3 = initChart(growthRef.current, 'growth');
    if (ch3) {
      ch3.setOption({
        backgroundColor: 'transparent',
        tooltip: { trigger: 'axis', formatter: (p: any) => `<b>${p[0].name}</b><br/>规模保费同比增速：${fmt.pct(p[0].value)}` },
        grid: { left: 110, right: 40, top: 10, bottom: 20 },
        xAxis: { type: 'value', axisLabel: { color: '#4a5a72', formatter: (v: number) => (v * 100).toFixed(0) + '%' }, splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } } },
        yAxis: { type: 'category', data: cs3.map((c) => c.name).reverse(), axisLabel: { color: '#8899b4', fontSize: 10 }, axisTick: { show: false }, axisLine: { show: false }, triggerEvent: true },
        series: [{ type: 'bar', data: cs3.map((c) => c.growth).reverse(), barMaxWidth: 14, itemStyle: { borderRadius: [0, 4, 4, 0], color: (p: any) => p.value > 0 ? new echarts.graphic.LinearGradient(0, 0, 1, 0, [{ offset: 0, color: 'rgba(104,211,145,0.7)' }, { offset: 1, color: 'rgba(79,209,197,0.4)' }]) : new echarts.graphic.LinearGradient(0, 0, 1, 0, [{ offset: 0, color: 'rgba(252,129,129,0.7)' }, { offset: 1, color: 'rgba(246,173,85,0.4)' }]) }, label: { show: true, position: 'right', color: '#8899b4', fontSize: 9, formatter: (p: any) => fmt.pct(p.value) } }],
      });
      ch3.off('click');
      ch3.on('click', (p: any) => onCompanyClick(p.name));
      ch3.resize();
    }

    // 4. ROE
    const cs4 = companies.filter((c) => c.roe_y != null && !isNaN(c.roe_y)).sort((a, b) => (b.roe_y ?? 0) - (a.roe_y ?? 0)).slice(0, 20);
    const ch4 = initChart(roeRef.current, 'roe');
    if (ch4) {
      ch4.setOption({
        backgroundColor: 'transparent',
        tooltip: { trigger: 'axis', formatter: (p: any) => `<b>${p[0].name}</b><br/>年化ROE：${fmt.pct(p[0].value)}` },
        grid: { left: 110, right: 40, top: 10, bottom: 20 },
        xAxis: { type: 'value', axisLabel: { color: '#4a5a72', formatter: (v: number) => (v * 100).toFixed(0) + '%' }, splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } } },
        yAxis: { type: 'category', data: cs4.map((c) => c.name).reverse(), axisLabel: { color: '#8899b4', fontSize: 10 }, axisTick: { show: false }, axisLine: { show: false }, triggerEvent: true },
        series: [{ type: 'bar', data: cs4.map((c) => c.roe_y).reverse(), barMaxWidth: 14, itemStyle: { borderRadius: [0, 4, 4, 0], color: (p: any) => p.value > 0 ? new echarts.graphic.LinearGradient(0, 0, 1, 0, [{ offset: 0, color: 'rgba(183,148,244,0.8)' }, { offset: 1, color: 'rgba(159,122,234,0.4)' }]) : new echarts.graphic.LinearGradient(0, 0, 1, 0, [{ offset: 0, color: 'rgba(252,129,129,0.7)' }, { offset: 1, color: 'rgba(246,173,85,0.4)' }]) }, label: { show: true, position: 'right', color: '#8899b4', fontSize: 9, formatter: (p: any) => fmt.pct(p.value) } }],
      });
      ch4.off('click');
      ch4.on('click', (p: any) => onCompanyClick(p.name));
      ch4.resize();
    }

    // 5. Surrender
    const cs5 = companies.filter((c) => !riskTags.includes(c.tag) && c.surrender_ratio > 0).sort((a, b) => a.surrender_ratio - b.surrender_ratio).slice(0, 20);
    const ch5 = initChart(surrenderRef.current, 'surrender');
    if (ch5) {
      ch5.setOption({
        backgroundColor: 'transparent',
        tooltip: { trigger: 'axis', formatter: (p: any) => `<b>${p[0].name}</b><br/>退保风险占比：${fmt.pct(p[0].value)}` },
        grid: { left: 110, right: 40, top: 10, bottom: 20 },
        xAxis: { type: 'value', axisLabel: { color: '#4a5a72', formatter: (v: number) => (v * 100).toFixed(0) + '%' }, splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } } },
        yAxis: { type: 'category', data: cs5.map((c) => c.name).reverse(), axisLabel: { color: '#8899b4', fontSize: 10 }, axisTick: { show: false }, axisLine: { show: false }, triggerEvent: true },
        series: [{ type: 'bar', data: cs5.map((c) => c.surrender_ratio).reverse(), barMaxWidth: 14, itemStyle: { borderRadius: [0, 4, 4, 0], color: (p: any) => { const v = p.value; if (v < 0.3) return new echarts.graphic.LinearGradient(0, 0, 1, 0, [{ offset: 0, color: 'rgba(104,211,145,0.7)' }, { offset: 1, color: 'rgba(79,209,197,0.4)' }]); if (v < 0.5) return new echarts.graphic.LinearGradient(0, 0, 1, 0, [{ offset: 0, color: 'rgba(246,224,94,0.7)' }, { offset: 1, color: 'rgba(246,173,85,0.4)' }]); return new echarts.graphic.LinearGradient(0, 0, 1, 0, [{ offset: 0, color: 'rgba(252,129,129,0.7)' }, { offset: 1, color: 'rgba(246,173,85,0.4)' }]); } }, label: { show: true, position: 'right', color: '#8899b4', fontSize: 9, formatter: (p: any) => fmt.pct(p.value) } }],
      });
      ch5.off('click');
      ch5.on('click', (p: any) => onCompanyClick(p.name));
      ch5.resize();
    }

    const handleResize = () => { Object.values(chartInstances.current).forEach((c) => c && c.resize()); };
    window.addEventListener('resize', handleResize);
    return () => { window.removeEventListener('resize', handleResize); Object.values(chartInstances.current).forEach((c) => c && c.dispose()); };
  }, [companies, curQ, onCompanyClick, initChart]);

  return (
    <div className="mb-7">
      <div className="flex items-start gap-2.5 mb-4 pb-3 border-b border-[rgba(99,179,237,0.12)]">
        <div className="sec-bar b3" />
        <div className="flex-1">
          <div className="text-base font-bold text-[#e8edf5] leading-tight">经营水平</div>
          <div className="text-[11px] text-[#4a5a72] mt-1">保险业务收入 · 净利润 · ROE · 规模保费增速 — 衡量险企盈利能力与成长性</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-[#111e35] border border-[rgba(99,179,237,0.12)] rounded-xl p-4">
          <div className="text-[13px] font-bold text-[#e8edf5] mb-3">保险业务收入 Top 20</div>
          <div className="text-[11px] text-[#4a5a72] mb-2">矩形面积对应收入规模，点击查看公司详情</div>
          <div ref={treemapRef} style={{ height: 360 }} />
        </div>
        <div className="bg-[#111e35] border border-[rgba(99,179,237,0.12)] rounded-xl p-4">
          <div className="text-[13px] font-bold text-[#e8edf5] mb-3">净利润 Top 20</div>
          <div className="text-[11px] text-[#4a5a72] mb-2">按年度累计排序，正负值分左右展示</div>
          <div ref={profitRef} style={{ height: 360 }} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-[#111e35] border border-[rgba(99,179,237,0.12)] rounded-xl p-4">
          <div className="text-[13px] font-bold text-[#e8edf5] mb-3">规模保费同比增速排名</div>
          <div className="text-[11px] text-[#4a5a72] mb-2">部分公司数据未采纳</div>
          <div ref={growthRef} style={{ height: 380 }} />
        </div>
        <div className="bg-[#111e35] border border-[rgba(99,179,237,0.12)] rounded-xl p-4">
          <div className="text-[13px] font-bold text-[#e8edf5] mb-3">净资产收益率（ROE）排名</div>
          <div className="text-[11px] text-[#4a5a72] mb-2">年化ROE，衡量股东回报能力</div>
          <div ref={roeRef} style={{ height: 380 }} />
        </div>
        <div className="bg-[#111e35] border border-[rgba(99,179,237,0.12)] rounded-xl p-4">
          <div className="text-[13px] font-bold text-[#e8edf5] mb-3">退保风险占比排名</div>
          <div className="text-[11px] text-[#4a5a72] mb-2">退保风险/最低资本，越低越稳健</div>
          <div ref={surrenderRef} style={{ height: 380 }} />
        </div>
      </div>
    </div>
  );
}
