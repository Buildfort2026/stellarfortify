import { useState, useMemo, useCallback } from 'react';
import { fmt, tagClass, ratingClass, getRatingWeight } from '@/utils/format';
import { useInsuranceData } from '@/hooks/useInsuranceData';
import CompanyModal from '@/components/CompanyModal';
import type { Company } from '@/types/insurance';

const SORT_COLS: Array<{ key: string; label: string }> = [
  { key: 'name', label: '公司名称' },
  { key: 'type', label: '类型' },
  { key: 'tag', label: '风险标签' },
  { key: 'rating', label: '评级' },
  { key: 'comp_solvency', label: '综合偿付%' },
  { key: 'core_solvency', label: '核心偿付%' },
  { key: 'total_asset', label: '总资产(亿)' },
  { key: 'net_asset_rate', label: '净资产率' },
  { key: 'income_q', label: '季度保费(亿)' },
  { key: 'growth', label: '保费增速' },
  { key: 'profit_q', label: '季度净利润(亿)' },
  { key: 'roe_y', label: '年化ROE' },
  { key: 'invest_comp', label: '综合投资收益率' },
  { key: 'invest_3y_comp', label: '近三年综合收益率' },
  { key: 'invest_3y', label: '近三年净收益率' },
];

const TAG_ORDER = ['顶级水准', '行业头部', '相对健康', '净资产比例低于5%', '连续两年净现金流为负', '偿付能力低于100%', '评级为B', '评级不达标', '暂停披露'];

export default function DataTable() {
  const { curQ, getQ, getCompanies } = useInsuranceData();
  const [search, setSearch] = useState('');
  const [tagF, setTagF] = useState('');
  const [typeF, setTypeF] = useState('');
  const [ratingF, setRatingF] = useState('');
  const [sortCol, setSortCol] = useState('');
  const [sortDir, setSortDir] = useState(1);
  const [modalCompany, setModalCompany] = useState<Company | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const allCompanies = useMemo(() => {
    if (!curQ) return [];
    return getCompanies(curQ, false);
  }, [curQ, getCompanies]);

  const filtered = useMemo(() => {
    let data = allCompanies;
    if (search) data = data.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));
    if (tagF) data = data.filter((c) => c.tag === tagF);
    if (typeF) data = data.filter((c) => c.type === typeF);
    if (ratingF) data = data.filter((c) => c.rating === ratingF);

    if (sortCol) {
      if (sortCol === 'rating') {
        data = [...data].sort((a, b) => sortDir * (getRatingWeight(b.rating) - getRatingWeight(a.rating)));
      } else if (sortCol === 'tag') {
        data = [...data].sort((a, b) => {
          const ia = TAG_ORDER.indexOf(a.tag), ib = TAG_ORDER.indexOf(b.tag);
          return sortDir * ((ia >= 0 ? ia : 99) - (ib >= 0 ? ib : 99));
        });
      } else {
        data = [...data].sort((a, b) => {
          const va = (a as any)[sortCol] ?? -Infinity;
          const vb = (b as any)[sortCol] ?? -Infinity;
          if (typeof va === 'string') return sortDir * va.localeCompare(vb);
          return sortDir * (vb - va);
        });
      }
    }
    return data;
  }, [allCompanies, search, tagF, typeF, ratingF, sortCol, sortDir]);

  const handleSort = useCallback((col: string) => {
    if (sortCol === col) setSortDir((d) => -d);
    else { setSortCol(col); setSortDir(1); }
  }, [sortCol]);

  const handleCompanyClick = useCallback((name: string) => {
    const c = allCompanies.find((x) => x.name === name);
    if (c) { setModalCompany(c); setModalOpen(true); }
  }, [allCompanies]);

  const statVals = useMemo(() => {
    const statCols = [
      { k: 'comp_solvency', f: fmt.pct }, { k: 'core_solvency', f: fmt.pct },
      { k: 'total_asset', f: fmt.num }, { k: 'net_asset_rate', f: fmt.pct },
      { k: 'income_q', f: fmt.num }, { k: 'growth', f: fmt.pct },
      { k: 'profit_q', f: fmt.num }, { k: 'roe_y', f: fmt.pct },
      { k: 'invest_comp', f: fmt.pct }, { k: 'invest_3y_comp', f: fmt.pct },
      { k: 'invest_3y', f: fmt.pct },
    ];
    return statCols.map((s) => {
      const vals = filtered.map((c: any) => c[s.k]).filter((v: any) => v != null && !isNaN(v));
      if (!vals.length) return '— | —';
      const avg = vals.reduce((a: number, b: number) => a + b, 0) / vals.length;
      const sorted = vals.slice().sort((a: number, b: number) => a - b);
      const med = sorted.length % 2 ? sorted[Math.floor(sorted.length / 2)] : (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2;
      return s.f(avg) + ' | ' + s.f(med);
    });
  }, [filtered]);

  const exportCSV = useCallback(() => {
    const headers = ['公司名称', '类型', '生态', '风险标签', '风险评级', '综合偿付能力充足率', '核心偿付能力充足率', '总资产(亿)', '净资产率', '季度保费(亿)', '保费增速', '季度净利润(亿)', '年化ROE', '综合投资收益率', '近三年综合收益率', '近三年净收益率'];
    const rows = allCompanies.map((c) => [
      c.name, c.type, c.eco, c.tag, c.rating,
      c.comp_solvency ? (c.comp_solvency * 100).toFixed(2) + '%' : '',
      c.core_solvency ? (c.core_solvency * 100).toFixed(2) + '%' : '',
      c.total_asset ? c.total_asset.toFixed(2) : '',
      c.net_asset_rate ? (c.net_asset_rate * 100).toFixed(2) + '%' : '',
      c.income_q ? c.income_q.toFixed(2) : '',
      c.growth ? (c.growth * 100).toFixed(2) + '%' : '',
      c.profit_q != null ? c.profit_q.toFixed(2) : '',
      c.roe_y ? (c.roe_y * 100).toFixed(2) + '%' : '',
      c.invest_comp ? (c.invest_comp * 100).toFixed(2) + '%' : '',
      c.invest_3y_comp ? (c.invest_3y_comp * 100).toFixed(2) + '%' : '',
      c.invest_3y ? (c.invest_3y * 100).toFixed(2) + '%' : '',
    ]);
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${v || ''}"`).join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `险企透视_${curQ}.csv`; a.click();
  }, [allCompanies, curQ]);

  const quarterLabel = useMemo(() => {
    const qs = getQ(curQ);
    return qs ? curQ : '';
  }, [curQ, getQ]);

  return (
    <div className="p-5 max-w-[1640px] mx-auto">
      <div className="flex gap-2.5 items-center mb-3.5 flex-wrap">
        <div className="flex items-center gap-1.5 bg-[#111e35] border border-[rgba(99,179,237,0.12)] rounded-lg px-3 py-1.5 flex-1 min-w-[180px] max-w-[300px]">
          <span className="text-[#4a5a72] text-[13px]">🔍</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索公司名称..."
            className="bg-transparent border-none text-[#e8edf5] text-[13px] font-[inherit] outline-none w-full placeholder:text-[#4a5a72]"
          />
        </div>
        <select value={tagF} onChange={(e) => setTagF(e.target.value)} className="bg-[#111e35] border border-[rgba(99,179,237,0.12)] rounded-lg px-2.5 py-1.5 text-[#8899b4] text-xs font-[inherit] cursor-pointer outline-none appearance-none pr-6">
          <option value="">全部标签</option>
          <option>顶级水准</option><option>行业头部</option><option>相对健康</option>
          <option>净资产比例低于5%</option><option>连续两年净现金流为负</option>
          <option>偿付能力低于100%</option><option>评级为B</option><option>评级不达标</option>
          <option>暂停披露</option>
        </select>
        <select value={typeF} onChange={(e) => setTypeF(e.target.value)} className="bg-[#111e35] border border-[rgba(99,179,237,0.12)] rounded-lg px-2.5 py-1.5 text-[#8899b4] text-xs font-[inherit] cursor-pointer outline-none appearance-none pr-6">
          <option value="">全部类型</option>
          <option>国企</option><option>民企</option><option>外资</option><option>合资</option><option>混合</option>
        </select>
        <select value={ratingF} onChange={(e) => setRatingF(e.target.value)} className="bg-[#111e35] border border-[rgba(99,179,237,0.12)] rounded-lg px-2.5 py-1.5 text-[#8899b4] text-xs font-[inherit] cursor-pointer outline-none appearance-none pr-6">
          <option value="">全部评级</option>
          <option>AAA</option><option>AA</option><option>A</option><option>BBB</option><option>BB</option><option>B</option>
        </select>
        <div className="flex-1" />
        <span className="text-xs text-[#4a5a72] whitespace-nowrap">共 {filtered.length} 家公司</span>
        <button onClick={exportCSV} className="px-3.5 py-1.5 rounded-lg border text-xs font-semibold font-[inherit] cursor-pointer transition-all whitespace-nowrap bg-[rgba(99,179,237,0.1)] border-[rgba(99,179,237,0.35)] text-[#63b3ed]">
          导出 CSV
        </button>
      </div>

      <div className="bg-[#111e35] border border-[rgba(99,179,237,0.12)] rounded-xl overflow-hidden">
        <div className="overflow-x-auto max-h-[calc(100vh-200px)] overflow-y-auto">
          <table className="w-full border-separate border-spacing-0 text-xs dt" style={{ tableLayout: 'fixed', minWidth: 1650 }}>
            <colgroup>
              <col style={{ width: 100 }} /><col style={{ width: 54 }} /><col style={{ width: 120 }} /><col style={{ width: 56 }} />
              <col /><col /><col /><col /><col /><col /><col /><col /><col /><col /><col />
            </colgroup>
            <thead>
              <tr>
                {SORT_COLS.map((col) => (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key)}
                    className={`bg-[#0d1528] px-2.5 py-2 text-left text-[#4a5a72] font-semibold text-[10px] border-b border-[rgba(99,179,237,0.12)] whitespace-nowrap cursor-pointer select-none hover:text-[#4fd1c5] ${sortCol === col.key ? (sortDir === 1 ? 'sa' : 'sd') : ''} ${col.key.includes('_') ? 'text-right' : ''}`}
                  >
                    {col.label} <span className="s-arr" />
                  </th>
                ))}
              </tr>
              <tr>
                <th className="frozen-1 bg-[#1a2845]" style={{ position: 'sticky', top: 29, zIndex: 16, left: 0 }}>
                  <span className="text-[#4fd1c5] font-semibold text-[10px]">行业统计</span>
                </th>
                <th className="frozen-2 bg-[#1a2845]" style={{ position: 'sticky', top: 29, zIndex: 16, left: 100 }} />
                <th className="frozen-3 bg-[#1a2845]" style={{ position: 'sticky', top: 29, zIndex: 16, left: 154 }} />
                <th className="frozen-4 bg-[#1a2845]" style={{ position: 'sticky', top: 29, zIndex: 16, left: 274 }} />
                {statVals.map((v, i) => (
                  <th key={i} className="bg-[#1a2845] text-[#e8edf5] font-bold text-[10px]">
                    <span className="text-[#63b3ed] font-semibold text-[10px]">{v}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.name} onClick={() => handleCompanyClick(c.name)} className="cursor-pointer hover:bg-[rgba(99,179,237,0.04)]">
                  <td className="frozen-1 bg-[#0d1528] px-2.5 py-1.5 border-b border-[rgba(255,255,255,0.04)] text-[#4fd1c5] font-semibold whitespace-nowrap">{c.name}</td>
                  <td className="frozen-2 bg-[#0d1528] px-2.5 py-1.5 border-b border-[rgba(255,255,255,0.04)] text-[#8899b4] whitespace-nowrap">{c.type || '—'}</td>
                  <td className="frozen-3 bg-[#0d1528] px-2.5 py-1.5 border-b border-[rgba(255,255,255,0.04)] whitespace-nowrap"><span className={`tag-b ${tagClass(c.tag)}`}>{c.tag || '—'}</span></td>
                  <td className="frozen-4 bg-[#0d1528] px-2.5 py-1.5 border-b border-[rgba(255,255,255,0.04)] whitespace-nowrap"><span className={`rb ${ratingClass(c.rating)}`}>{c.rating || '—'}</span></td>
                  <td className="px-2.5 py-1.5 border-b border-[rgba(255,255,255,0.04)] text-[#e8edf5] font-mono text-right whitespace-nowrap">{fmt.pct(c.comp_solvency)}</td>
                  <td className="px-2.5 py-1.5 border-b border-[rgba(255,255,255,0.04)] text-[#e8edf5] font-mono text-right whitespace-nowrap">{fmt.pct(c.core_solvency)}</td>
                  <td className="px-2.5 py-1.5 border-b border-[rgba(255,255,255,0.04)] text-[#e8edf5] font-mono text-right whitespace-nowrap">{fmt.num(c.total_asset)}</td>
                  <td className="px-2.5 py-1.5 border-b border-[rgba(255,255,255,0.04)] text-[#e8edf5] font-mono text-right whitespace-nowrap">{fmt.pct(c.net_asset_rate)}</td>
                  <td className="px-2.5 py-1.5 border-b border-[rgba(255,255,255,0.04)] text-[#e8edf5] font-mono text-right whitespace-nowrap">{fmt.num(c.income_q)}</td>
                  <td className="px-2.5 py-1.5 border-b border-[rgba(255,255,255,0.04)] text-[#e8edf5] font-mono text-right whitespace-nowrap">{fmt.pct(c.growth)}</td>
                  <td className="px-2.5 py-1.5 border-b border-[rgba(255,255,255,0.04)] text-[#e8edf5] font-mono text-right whitespace-nowrap">{fmt.num(c.profit_q)}</td>
                  <td className="px-2.5 py-1.5 border-b border-[rgba(255,255,255,0.04)] text-[#e8edf5] font-mono text-right whitespace-nowrap">{fmt.pct(c.roe_y)}</td>
                  <td className="px-2.5 py-1.5 border-b border-[rgba(255,255,255,0.04)] text-[#e8edf5] font-mono text-right whitespace-nowrap">{fmt.pct(c.invest_comp)}</td>
                  <td className="px-2.5 py-1.5 border-b border-[rgba(255,255,255,0.04)] text-[#e8edf5] font-mono text-right whitespace-nowrap">{fmt.pct(c.invest_3y_comp)}</td>
                  <td className="px-2.5 py-1.5 border-b border-[rgba(255,255,255,0.04)] text-[#e8edf5] font-mono text-right whitespace-nowrap">{fmt.pct(c.invest_3y)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-3.5 py-2.5 border-t border-[rgba(99,179,237,0.12)] text-xs text-[#4a5a72]">
          <span>共 {filtered.length} 条数据，下拉滚动查看全部</span>
        </div>
      </div>

      <CompanyModal
        company={modalCompany}
        quarterLabel={quarterLabel}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </div>
  );
}
