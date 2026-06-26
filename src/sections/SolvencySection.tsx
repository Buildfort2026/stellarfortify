import { useCallback, useRef, useEffect } from 'react';
import * as echarts from 'echarts';
import { fmt } from '@/utils/format';
import type { Company } from '@/types/insurance';

interface SolvencySectionProps {
  companies: Company[];
  onCompanyClick: (name: string) => void;
}

export default function SolvencySection({ companies, onCompanyClick }: SolvencySectionProps) {
  const compSolRef = useRef<HTMLDivElement>(null);
  const coreSolRef = useRef<HTMLDivElement>(null);
  const scatterRef = useRef<HTMLDivElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  const chartInstances = useRef<Record<string, echarts.ECharts>>({});

  const initChart = useCallback((el: HTMLDivElement | null, key: string) => {
    if (!el) return null;
    if (chartInstances.current[key]) {
      chartInstances.current[key].dispose();
    }
    const chart = echarts.init(el, undefined, { renderer: 'canvas' });
    chartInstances.current[key] = chart;
    return chart;
  }, []);

  useEffect(() => {
    // 1. Comprehensive Solvency Chart
    const cs1 = companies
      .filter((c) => c.comp_solvency > 0 && c.name !== '浜轰繚鍋ュ悍' && !['C', 'D'].includes(c.rating))
      .sort((a, b) => b.comp_solvency - a.comp_solvency)
      .slice(0, 20);
    const ch1 = initChart(compSolRef.current, 'comp-sol');
    if (ch1) {
      ch1.setOption({
        backgroundColor: 'transparent',
        tooltip: {
          trigger: 'axis',
          formatter: (p: any) => `<b>${p[0].name}</b><br/>缁煎悎鍋夸粯鑳藉姏鍏呰冻鐜囷細${fmt.pct(p[0].value)}`,
        },
        grid: { left: 110, right: 55, top: 10, bottom: 30 },
        xAxis: {
          type: 'value',
          axisLabel: { show: false },
          splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } },
        },
        yAxis: {
          type: 'category',
          data: cs1.map((c) => c.name).reverse(),
          axisLabel: { color: '#8899b4', fontSize: 11, fontWeight: 600 },
          axisTick: { show: false },
          axisLine: { show: false },
          triggerEvent: true,
        },
        series: [
          {
            type: 'bar',
            data: cs1.map((c) => c.comp_solvency).reverse(),
            barMaxWidth: 22,
            itemStyle: {
              borderRadius: [0, 4, 4, 0],
              color: (p: any) => {
                const v = p.value;
                if (v >= 3) return new echarts.graphic.LinearGradient(0, 0, 1, 0, [
                  { offset: 0, color: '#4fd1c5' }, { offset: 1, color: '#63b3ed' },
                ]);
                if (v >= 2) return new echarts.graphic.LinearGradient(0, 0, 1, 0, [
                  { offset: 0, color: '#63b3ed' }, { offset: 1, color: '#7f9cf5' },
                ]);
                if (v >= 1.5) return new echarts.graphic.LinearGradient(0, 0, 1, 0, [
                  { offset: 0, color: '#f6e05e' }, { offset: 1, color: '#f6ad55' },
                ]);
                return new echarts.graphic.LinearGradient(0, 0, 1, 0, [
                  { offset: 0, color: '#fc8181' }, { offset: 1, color: '#f6ad55' },
                ]);
              },
            },
            label: { show: true, position: 'right', color: '#8899b4', fontSize: 10, formatter: (p: any) => fmt.pct(p.value) },
          },
        ],
      });
      ch1.off('click');
      ch1.on('click', (p: any) => onCompanyClick(p.name));
      ch1.resize();
    }

    // 2. Core Solvency Chart
    const cs2 = companies
      .filter((c) => c.core_solvency > 0 && c.name !== '浜轰繚鍋ュ悍' && !['C', 'D'].includes(c.rating))
      .sort((a, b) => b.core_solvency - a.core_solvency)
      .slice(0, 20);
    const ch2 = initChart(coreSolRef.current, 'core-sol');
    if (ch2) {
      ch2.setOption({
        backgroundColor: 'transparent',
        tooltip: {
          trigger: 'axis',
          formatter: (p: any) => `<b>${p[0].name}</b><br/>鏍稿績鍋夸粯鑳藉姏鍏呰冻鐜囷細${fmt.pct(p[0].value)}`,
        },
        grid: { left: 110, right: 55, top: 10, bottom: 30 },
        xAxis: {
          type: 'value',
          axisLabel: { show: false },
          splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } },
        },
        yAxis: {
          type: 'category',
          data: cs2.map((c) => c.name).reverse(),
          axisLabel: { color: '#8899b4', fontSize: 11, fontWeight: 600 },
          axisTick: { show: false },
          axisLine: { show: false },
          triggerEvent: true,
        },
        series: [
          {
            type: 'bar',
            data: cs2.map((c) => c.core_solvency).reverse(),
            barMaxWidth: 22,
            itemStyle: {
              borderRadius: [0, 4, 4, 0],
              color: (p: any) => {
                const v = p.value;
                if (v >= 1) return new echarts.graphic.LinearGradient(0, 0, 1, 0, [
                  { offset: 0, color: '#68d391' }, { offset: 1, color: '#4fd1c5' },
                ]);
                return new echarts.graphic.LinearGradient(0, 0, 1, 0, [
                  { offset: 0, color: '#f6ad55' }, { offset: 1, color: '#fc8181' },
                ]);
              },
            },
            label: { show: true, position: 'right', color: '#8899b4', fontSize: 10, formatter: (p: any) => fmt.pct(p.value) },
          },
        ],
      });
      ch2.off('click');
      ch2.on('click', (p: any) => onCompanyClick(p.name));
      ch2.resize();
    }

    // 3. Scatter Chart
    const filtered = companies.filter(
      (c) => c.comp_solvency > 0 && c.core_solvency > 0 && !['人保健康', '恒安标准人寿', '华汇人寿'].includes(c.name);
    );
    const compTop10 = [...filtered].sort((a, b) => b.comp_solvency - a.comp_solvency).slice(0, 10).map((c) => c.name);
    const coreTop10 = [...filtered].sort((a, b) => b.core_solvency - a.core_solvency).slice(0, 10).map((c) => c.name);
    const showNames = [...new Set([...compTop10, ...coreTop10])];
    const showSet = new Set(showNames);

    const ch3 = initChart(scatterRef.current, 'scatter');
    if (ch3) {
      ch3.setOption({
        backgroundColor: 'transparent',
        tooltip: {
          trigger: 'item',
          formatter: (p: any) => `<b>${p.data[2]}</b><br/>缁煎悎锛?{fmt.pct(p.data[0])}<br/>鏍稿績锛?{fmt.pct(p.data[1])}`,
        },
        grid: { left: 70, right: 30, top: 30, bottom: 55 },
        xAxis: {
          name: '缁煎悎鍋夸粯鑳藉姏鍏呰冻鐜?,
          nameLocation: 'middle',
          nameGap: 30,
          nameTextStyle: { color: '#8899b4', fontSize: 10 },
          min: 2,
          axisLabel: { color: '#4a5a72', fontSize: 10, formatter: (v: number) => (v * 100).toFixed(0) + '%' },
          splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } },
        },
        yAxis: {
          name: '鏍稿績鍋夸粯鑳藉姏鍏呰冻鐜?,
          nameLocation: 'middle',
          nameGap: 50,
          nameTextStyle: { color: '#8899b4', fontSize: 10 },
          min: 1,
          axisLabel: { color: '#4a5a72', fontSize: 10, formatter: (v: number) => (v * 100).toFixed(0) + '%' },
          splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } },
        },
        series: [
          {
            type: 'scatter',
            data: filtered.filter((c) => showSet.has(c.name)).map((c) => [c.comp_solvency, c.core_solvency, c.name, c.tag]),
            symbolSize: 10,
            itemStyle: {
              color: (p: any) => {
                const tag = p.data[3];
                if (tag === '琛屼笟澶撮儴') return '#63b3ed';
                if (tag === '椤剁骇姘村噯') return '#4fd1c5';
                if (tag === '鐩稿鍋ュ悍') return '#68d391';
                return '#f6ad55';
              },
              opacity: 0.85,
              borderColor: 'rgba(255,255,255,0.2)',
              borderWidth: 1,
            },
            label: { show: true, formatter: (p: any) => p.data[2], color: '#8899b4', fontSize: 9, position: 'top' },
          },
        ],
      });
      ch3.off('click');
      ch3.on('click', (p: any) => onCompanyClick(p.data[2]));
      ch3.resize();
    }

    // 4. Boxplot
    const compVals = companies.map((c) => c.comp_solvency).filter((v) => v > 0).sort((a, b) => a - b);
    const coreVals = companies.map((c) => c.core_solvency).filter((v) => v > 0).sort((a, b) => a - b);

    function boxStats(arr: number[]): number[] {
      const n = arr.length;
      const q1 = arr[Math.floor(n * 0.25)];
      const q2 = arr[Math.floor(n * 0.5)];
      const q3 = arr[Math.floor(n * 0.75)];
      const iqr = q3 - q1;
      const min = Math.max(arr[0], q1 - 1.5 * iqr);
      const max = Math.min(arr[n - 1], q3 + 1.5 * iqr);
      return [min, q1, q2, q3, max];
    }

    const ch4 = initChart(boxRef.current, 'box');
    if (ch4) {
      ch4.setOption({
        backgroundColor: 'transparent',
        tooltip: {
          trigger: 'item',
          formatter: (p: any) => {
            const d = p.data;
            return `<b>${p.name}</b><br/>最小值：${fmt.pct(d[1])}<br/>Q1：${fmt.pct(d[2])}<br/>中位数：${fmt.pct(d[3])}<br/>Q3：${fmt.pct(d[4])}<br/>最大值：${fmt.pct(d[5])}`;
          },
        },
        grid: { left: 70, right: 30, top: 30, bottom: 30 },
        xAxis: {
          type: 'category',
          data: ['缁煎悎鍋夸粯鑳藉姏鍏呰冻鐜?, '鏍稿績鍋夸粯鑳藉姏鍏呰冻鐜?],
          axisLabel: { color: '#8899b4' },
          axisTick: { show: false },
          axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } },
        },
        yAxis: {
          axisLabel: { color: '#4a5a72', formatter: (v: number) => (v * 100).toFixed(0) + '%' },
          splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } },
        },
        series: [
          {
            type: 'boxplot',
            data: [boxStats(compVals), boxStats(coreVals)],
            itemStyle: { color: 'rgba(99,179,237,0.15)', borderColor: '#63b3ed', borderWidth: 2 },
            boxWidth: ['30%', '50%'],
          },
        ],
      });
    }

    const handleResize = () => {
      Object.values(chartInstances.current).forEach((c) => c && c.resize());
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      Object.values(chartInstances.current).forEach((c) => c && c.dispose());
    };
  }, [companies, onCompanyClick, initChart]);

  return (
    <div className="mb-7">
      <div className="flex items-start gap-2.5 mb-4 pb-3 border-b border-[rgba(99,179,237,0.12)]">
        <div className="sec-bar b1" />
        <div className="flex-1">
          <div className="text-base font-bold text-[#e8edf5] leading-tight">鍋夸粯鑳藉姏鍏ㄦ櫙</div>
          <div className="text-[11px] text-[#4a5a72] mt-1">
            缁煎悎鍋夸粯鑳藉姏鍏呰冻鐜?路 鏍稿績鍋夸粯鑳藉姏鍏呰冻鐜?路 椋庨櫓缁煎悎璇勭骇 鈥?鐩戠鏍稿績涓夐」鎸囨爣
          </div>
        </div>
      </div>

      <div className="grid grid-cols-[1fr_1fr_1.3fr] gap-4 mb-4">
        <div className="bg-[#111e35] border border-[rgba(99,179,237,0.12)] rounded-xl p-4">
          <div className="flex items-start justify-between mb-3 gap-2">
            <div>
              <div className="text-[13px] font-bold text-[#e8edf5] leading-snug">缁煎悎鍋夸粯鑳藉姏鍏呰冻鐜囨帓鍚嶏紙Top 20锛?/div>
              <div className="text-[11px] text-[#4a5a72] mt-0.5 leading-snug">鐩戠瑕佹眰鈮?00%锛屽厖瓒崇巼瓒婇珮璧勬湰瓒婂厖瑁曪紱閮ㄥ垎鍏徃鏁版嵁鏈噰绾?/div>
            </div>
          </div>
          <div ref={compSolRef} style={{ height: 480 }} />
        </div>

        <div className="bg-[#111e35] border border-[rgba(99,179,237,0.12)] rounded-xl p-4">
          <div className="flex items-start justify-between mb-3 gap-2">
            <div>
              <div className="text-[13px] font-bold text-[#e8edf5] leading-snug">鏍稿績鍋夸粯鑳藉姏鍏呰冻鐜囨帓鍚嶏紙Top 20锛?/div>
              <div className="text-[11px] text-[#4a5a72] mt-0.5 leading-snug">浣庝簬100%涓虹洃绠￠噸鐐瑰叧娉ㄥ璞★紝浣庝簬50%瑙﹀彂鐩戠绾㈢嚎锛涢儴鍒嗗叕鍙告暟鎹湭閲囩撼</div>
            </div>
          </div>
          <div ref={coreSolRef} style={{ height: 480 }} />
        </div>

        {/* Pyramid + AAA Hall */}
        <div className="p-0 bg-transparent border-none">
          <div className="flex items-start justify-between mb-3 gap-2">
            <div>
              <div className="text-[13px] font-bold text-[#e8edf5] leading-snug">椋庨櫓缁煎悎璇勭骇鍒嗗竷</div>
              <div className="text-[11px] text-[#4a5a72] mt-0.5 leading-snug">璇勭骇閲戝瓧濉?鈥?AAA涓哄灏栵紝灞傚眰鍚戜笅璇勭骇閫愭笎闄嶄綆</div>
            </div>
          </div>
          <PyramidChart companies={companies} />
          <AAAHall companies={companies} onCompanyClick={onCompanyClick} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-[#111e35] border border-[rgba(99,179,237,0.12)] rounded-xl p-4">
          <div className="flex items-start justify-between mb-3 gap-2">
            <div>
              <div className="text-[13px] font-bold text-[#e8edf5] leading-snug">鏍稿績 vs 缁煎悎鍋夸粯鑳藉姏鍏呰冻鐜囨暎鐐瑰浘</div>
              <div className="text-[11px] text-[#4a5a72] mt-0.5 leading-snug">二者差距反映资本质量；点击查看公司详情；已排除极端值</div>
            </div>
          </div>
          <div ref={scatterRef} style={{ height: 300 }} />
        </div>
        <div className="bg-[#111e35] border border-[rgba(99,179,237,0.12)] rounded-xl p-4">
          <div className="flex items-start justify-between mb-3 gap-2">
            <div>
              <div className="text-[13px] font-bold text-[#e8edf5] leading-snug">鍋夸粯鑳藉姏鍏呰冻鐜囪涓氬垎甯?/div>
              <div className="text-[11px] text-[#4a5a72] mt-0.5 leading-snug">灞曠ず琛屼笟鏁翠綋鍒嗗竷姘村钩涓庣鏁ｇ▼搴?/div>
            </div>
          </div>
          <div ref={boxRef} style={{ height: 300 }} />
        </div>
      </div>
    </div>
  );
}

// ===== Pyramid Chart (SVG-based) =====
function PyramidChart({ companies }: { companies: Company[] }) {
  const containerRef = useRef<HTMLDivElement>(null);

  const cs = companies.filter((c) => c.rating);
  const ratingOrder = ['AAA', 'AA', 'A', 'BBB', 'BB', 'B', 'C', 'D'];
  const counts: Record<string, number> = {};
  cs.forEach((c) => { counts[c.rating] = (counts[c.rating] || 0) + 1; });
  const levels = ratingOrder.filter((r) => counts[r]);
  const n = levels.length;
  if (n === 0) return null;

  const PALETTE = [
    { top: 'rgba(185,220,255,0.78)', sideL: 'rgba(145,190,250,0.65)', sideR: 'rgba(100,155,225,0.55)', hl: 'rgba(235,248,255,0.92)', stroke: 'rgba(255,255,255,0.72)' },
    { top: 'rgba(145,235,215,0.78)', sideL: 'rgba(95,210,185,0.65)', sideR: 'rgba(55,180,158,0.55)', hl: 'rgba(205,252,242,0.92)', stroke: 'rgba(255,255,255,0.72)' },
    { top: 'rgba(165,242,192,0.78)', sideL: 'rgba(115,218,152,0.65)', sideR: 'rgba(70,188,115,0.55)', hl: 'rgba(212,255,228,0.92)', stroke: 'rgba(255,255,255,0.72)' },
    { top: 'rgba(255,238,138,0.78)', sideL: 'rgba(248,212,88,0.65)', sideR: 'rgba(222,182,52,0.55)', hl: 'rgba(255,250,208,0.92)', stroke: 'rgba(255,255,255,0.72)' },
    { top: 'rgba(255,192,112,0.78)', sideL: 'rgba(248,158,68,0.65)', sideR: 'rgba(222,128,42,0.55)', hl: 'rgba(255,225,182,0.92)', stroke: 'rgba(255,255,255,0.72)' },
    { top: 'rgba(255,172,182,0.78)', sideL: 'rgba(248,132,142,0.65)', sideR: 'rgba(222,102,112,0.55)', hl: 'rgba(255,212,218,0.92)', stroke: 'rgba(255,255,255,0.72)' },
  ];
  const LEGEND_COLORS = ['#93c5fd', '#6ee7b7', '#86efac', '#fde68a', '#fdba74', '#fca5a5'];

  const W = 520;
  const H = 290;
  const YROT = 22 * Math.PI / 180;
  const cy = Math.cos(YROT), sy = Math.sin(YROT);
  const A30 = Math.PI / 6;
  const c30 = Math.cos(A30), s30 = Math.sin(A30);

  function iso(x: number, y: number, z: number) {
    const xr = x * cy - z * sy;
    const zr = x * sy + z * cy;
    return { px: (xr - y) * c30, py: -(xr + y) * s30 + zr };
  }

  const BH = 3.6, TH = 5.2, GAP = 0.22, LH = TH / n;
  const allP: Array<{ px: number; py: number }> = [];
  for (let i = 0; i < n; i++) {
    const hB = i * LH + GAP / 2, hT = (i + 1) * LH - GAP / 2;
    const sB = 1 - hB / TH, sT = 1 - hT / TH;
    const pts = [
      [BH * sB, BH * sB, hB], [BH * sB, -BH * sB, hB], [-BH * sB, -BH * sB, hB], [-BH * sB, BH * sB, hB],
      [BH * sT, BH * sT, hT], [BH * sT, -BH * sT, hT], [-BH * sT, -BH * sT, hT], [-BH * sT, BH * sT, hT],
    ];
    pts.forEach(([x, y, z]) => allP.push(iso(x, y, z)));
  }
  const mnX = Math.min(...allP.map((p) => p.px)), mxX = Math.max(...allP.map((p) => p.px));
  const mnY = Math.min(...allP.map((p) => p.py)), mxY = Math.max(...allP.map((p) => p.py));

  const LGW = 110, PAD = 12;
  const dW = W - LGW - PAD * 2, dH = H - PAD * 2;
  const sc = Math.min(dW / (mxX - mnX), dH / (mxY - mnY)) * 0.90;
  const ox = PAD + dW / 2 - (mnX + mxX) / 2 * sc;
  const oy = PAD + dH / 2 + (mnY + mxY) / 2 * sc;

  const CROT = Math.atan2(sy * c30, sy * s30 + cy);
  const cc = Math.cos(CROT), scR = Math.sin(CROT);
  function sv(p: { px: number; py: number }) {
    const x = p.px * sc, y = -p.py * sc;
    return { x: ox + (x * cc - y * scR), y: oy + (x * scR + y * cc) };
  }
  function p3(x: number, y: number, z: number) { return sv(iso(x, y, z)); }
  function pStr(arr: Array<{ x: number; y: number }>) { return arr.map((p) => p.x.toFixed(1) + ',' + p.y.toFixed(1)).join(' '); }

  const gradients: Array<{ id: string; x1: string; y1: string; x2: string; y2: string; stops: Array<[string, string]> }> = [];
  levels.forEach((rating, idx) => {
    const col = PALETTE[Math.min(idx, PALETTE.length - 1)];
    gradients.push({ id: 'gT' + rating, x1: '10%', y1: '10%', x2: '90%', y2: '90%', stops: [['0%', col.hl], ['40%', col.top], ['100%', col.sideL]] });
    gradients.push({ id: 'gL' + rating, x1: '0%', y1: '0%', x2: '0%', y2: '100%', stops: [['0%', col.sideL], ['100%', col.sideR]] });
  });

  const lx = W - LGW + 5;
  const totalLH = n * 25;
  const ly0 = (H - totalLH) / 2;

  return (
    <div ref={containerRef} style={{ height: 290, position: 'relative' }}>
      <svg width={W} height={H} style={{ position: 'absolute', top: 0, left: 0 }}>
        <defs>
          {gradients.map((g) => (
            <linearGradient key={g.id} id={g.id} x1={g.x1} y1={g.y1} x2={g.x2} y2={g.y2}>
              {g.stops.map(([off, col]) => (
                <stop key={off} offset={off} stopColor={col} />
              ))}
            </linearGradient>
          ))}
        </defs>

        {levels.map((rating, idx) => {
          const ratingIdx = n - 1 - idx;
          const colorIdx = ratingIdx;
          const col = PALETTE[Math.min(colorIdx, PALETTE.length - 1)];
          const hB = idx * LH + GAP / 2, hT = (idx + 1) * LH - GAP / 2;
          const sB = 1 - hB / TH, sT = 1 - hT / TH;

          const bP = [
            p3(BH * sB, BH * sB, hB), p3(BH * sB, -BH * sB, hB),
            p3(-BH * sB, -BH * sB, hB), p3(-BH * sB, BH * sB, hB),
          ];
          const tP = [
            p3(BH * sT, BH * sT, hT), p3(BH * sT, -BH * sT, hT),
            p3(-BH * sT, -BH * sT, hT), p3(-BH * sT, BH * sT, hT),
          ];

          return (
            <g
              key={rating}
              style={{ cursor: 'pointer' }}
              onMouseEnter={(e) => { (e.currentTarget as SVGGElement).style.filter = 'brightness(1.20) drop-shadow(0 4px 12px rgba(200,230,255,0.30))'; }}
              onMouseLeave={(e) => { (e.currentTarget as SVGGElement).style.filter = ''; }}
              onClick={() => { const names = cs.filter((c) => c.rating === rating).map((c) => c.name); if (names.length === 1) { onCompanyClick(names[0]); } else { console.log(rating + ' 等级公司:', names); } }}
            >
              <polygon points={pStr([bP[0], bP[1], tP[1], tP[0]])} fill={`url(#gR${rating})`} stroke={col.stroke} strokeWidth="0.8" strokeLinejoin="round" />
              <polygon points={pStr([bP[0], bP[3], tP[3], tP[0]])} fill={`url(#gL${rating})`} stroke={col.stroke} strokeWidth="0.8" strokeLinejoin="round" />
              <polygon points={pStr(tP)} fill={`url(#gT${rating})`} stroke={col.stroke} strokeWidth="1" strokeLinejoin="round" />
              <line x1={tP[3].x.toFixed(1)} y1={tP[3].y.toFixed(1)} x2={tP[0].x.toFixed(1)} y2={tP[0].y.toFixed(1)} stroke="rgba(255,255,255,0.88)" strokeWidth="1.8" strokeLinecap="round" />
              <line x1={tP[0].x.toFixed(1)} y1={tP[0].y.toFixed(1)} x2={tP[1].x.toFixed(1)} y2={tP[1].y.toFixed(1)} stroke="rgba(255,255,255,0.52)" strokeWidth="1.2" strokeLinecap="round" />
            </g>
          );
        })}

        {/* Legend */}
        {levels.map((rating, idx) => {
          const ly = ly0 + idx * 25;
          const lc = LEGEND_COLORS[Math.min(idx, LEGEND_COLORS.length - 1)];
          return (
            <g key={'legend-' + rating}>
              <rect x={lx} y={ly} width={13} height={13} rx={3} fill={lc} opacity="0.88" />
              <text x={lx + 18} y={ly + 11} fill="#8899b4" fontSize="12" fontFamily="Inter, system-ui, sans-serif" fontWeight="600">
                {rating}
              </text>
              {counts[rating] && (
                <text x={lx + 45} y={ly + 11} fill="#4a6080" fontSize="10" fontFamily="Inter, system-ui, sans-serif">
                  {counts[rating]}瀹?                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ===== AAA Hall =====
function AAAHall({ companies, onCompanyClick }: { companies: Company[]; onCompanyClick: (name: string) => void }) {
  const aaa = companies.filter((c) => c.rating === 'AAA');
  const colors = ['c0', 'c1', 'c2', 'c3', 'c4', 'c5', 'c6'];

  return (
    <div className="mt-1 pt-1 border-t border-[rgba(99,179,237,0.08)]">
      <div className="mb-1.5">
        <div className="text-[13px] font-bold text-[#e8edf5] leading-snug">瀵块櫓鍏徃 AAA 姒?/div>
        <div className="text-[11px] text-[#4a5a72] mt-0.5">鐩戠璁よ瘉鐨勫皷瀛愮敓</div>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {aaa.map((c, idx) => {
          const logoPath = '/logo/' + c.name + '.png';
          const colorClass = colors[idx % colors.length];
          return (
            <div
              key={c.name}
              className={`aaa-item ${colorClass}`}
              onClick={() => onCompanyClick(c.name)}
              title={`${c.name} 鈥?鐐瑰嚮鏌ョ湅璇︽儏`}
            >
              <img
                src={logoPath}
                alt={c.name}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}


