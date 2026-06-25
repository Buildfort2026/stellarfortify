import { useState, useCallback, useMemo } from 'react';
import KPISection from '@/sections/KPISection';
import SolvencySection from '@/sections/SolvencySection';
import CapitalSection from '@/sections/CapitalSection';
import OperationSection from '@/sections/OperationSection';
import InvestmentSection from '@/sections/InvestmentSection';
import CompanyModal from '@/components/CompanyModal';
import { useInsuranceData } from '@/hooks/useInsuranceData';
import type { Company, FilterType } from '@/types/insurance';

export default function Dashboard() {
  const { curQ, quarters, getQ, getCompanies } = useInsuranceData();
  const [modalCompany, setModalCompany] = useState<Company | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [curFilter, setCurFilter] = useState<FilterType>('all');

  const companies = useMemo(() => {
    if (!curQ) return [];
    let cs = getCompanies(curQ);
    if (curFilter === 'risk') {
      cs = cs.filter((c) =>
        ['净资产比例低于5%', '评级为B', '偿付能力低于100%', '评级不达标', '连续两年净现金流为负'].includes(c.tag)
      );
    } else if (curFilter !== 'all') {
      cs = cs.filter((c) => c.tag === curFilter);
    }
    return cs;
  }, [curQ, curFilter, getCompanies]);

  const qData = useMemo(() => (curQ ? getQ(curQ) : null), [curQ, getQ]);

  const prevQData = useMemo(() => {
    if (!curQ) return null;
    const sorted = [...quarters].sort((a, b) => a.id.localeCompare(b.id));
    const idx = sorted.findIndex((q) => q.id === curQ);
    if (idx > 0) {
      return getQ(sorted[idx - 1].id);
    }
    return null;
  }, [curQ, quarters, getQ]);

  const handleCompanyClick = useCallback((name: string) => {
    const allCs = getCompanies(curQ, false);
    const c = allCs.find((x) => x.name === name);
    if (c) {
      setModalCompany(c);
      setModalOpen(true);
    }
  }, [curQ, getCompanies]);

  const quarterLabel = useMemo(() => {
    return quarters.find((q) => q.id === curQ)?.label || curQ;
  }, [quarters, curQ]);

  return (
    <div className="p-5 max-w-[1640px] mx-auto">
      {/* Filter Tabs */}
      <div className="flex gap-1.5 flex-wrap mb-4">
        {[
          { key: 'all' as FilterType, label: '全部' },
          { key: '行业头部' as FilterType, label: '行业头部' },
          { key: '顶级水准' as FilterType, label: '顶级水准' },
          { key: '相对健康' as FilterType, label: '相对健康' },
          { key: '评级为B' as FilterType, label: '评级为B' },
          { key: 'risk' as FilterType, label: '风险关注' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setCurFilter(tab.key)}
            className={`px-2.5 py-1 rounded-full border text-[11px] font-medium cursor-pointer transition-all font-[inherit] ${
              curFilter === tab.key
                ? 'bg-[rgba(99,179,237,0.12)] border-[#63b3ed] text-[#63b3ed] font-bold'
                : 'bg-[rgba(255,255,255,0.03)] border-[rgba(99,179,237,0.12)] text-[#8899b4] hover:border-[rgba(99,179,237,0.3)] hover:text-[#e8edf5]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <KPISection companies={companies} qData={qData} prevQData={prevQData} />
      <SolvencySection companies={companies} onCompanyClick={handleCompanyClick} />
      <CapitalSection companies={companies} onCompanyClick={handleCompanyClick} />
      <OperationSection companies={companies} curQ={curQ} onCompanyClick={handleCompanyClick} />
      <InvestmentSection companies={companies} onCompanyClick={handleCompanyClick} />

      <CompanyModal
        company={modalCompany}
        quarterLabel={quarterLabel}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </div>
  );
}
