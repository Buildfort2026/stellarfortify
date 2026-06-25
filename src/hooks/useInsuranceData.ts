import { useState, useEffect, useMemo, useCallback } from 'react';
import type { InsuranceData, Company, Quarter, QuarterData, FilterType } from '@/types/insurance';

let cachedData: InsuranceData | null = null;

export function useInsuranceData() {
  const [data, setData] = useState<InsuranceData | null>(cachedData);
  const [curQ, setCurQ] = useState<string>('');
  const [curFilter, setCurFilter] = useState<FilterType>('all');
  const [loading, setLoading] = useState(!cachedData);

  useEffect(() => {
    if (cachedData) {
      if (!curQ && cachedData.quarters.length > 0) {
        const sorted = [...cachedData.quarters].sort((a, b) => a.id.localeCompare(b.id));
        setCurQ(sorted[sorted.length - 1].id);
      }
      return;
    }

    fetch('/insurance-data.json')
      .then((res) => res.json())
      .then((json: InsuranceData) => {
        cachedData = json;
        setData(json);
        setLoading(false);
        if (json.quarters.length > 0) {
          const sorted = [...json.quarters].sort((a, b) => a.id.localeCompare(b.id));
          setCurQ(sorted[sorted.length - 1].id);
        }
      })
      .catch((err) => {
        console.error('Failed to load insurance data:', err);
        setLoading(false);
      });
  }, [curQ]);

  const quarters = useMemo(() => data?.quarters || [], [data]);
  const quarterData = useMemo(() => data?.quarterData || {}, [data]);

  const getQ = useCallback(
    (qid: string) => quarterData[qid] || null,
    [quarterData]
  );

  const getCompanies = useCallback(
    (qid: string, dashOnly = true): Company[] => {
      const q = getQ(qid);
      if (!q) return [];
      return dashOnly ? q.companies.filter((c) => c.tag !== '不参与市场竞争') : q.companies;
    },
    [getQ]
  );

  const getAllCompanies = useCallback((): Company[] => {
    return getCompanies(curQ, false);
  }, [curQ, getCompanies]);

  const getFilteredCompanies = useCallback((): Company[] => {
    const cs = getCompanies(curQ);
    if (curFilter === 'all') return cs;
    if (curFilter === 'risk')
      return cs.filter((c) =>
        ['净资产比例低于5%', '评级为B', '偿付能力低于100%', '评级不达标', '连续两年净现金流为负'].includes(
          c.tag
        )
      );
    return cs.filter((c) => c.tag === curFilter);
  }, [curQ, curFilter, getCompanies]);

  const getCurrentQData = useCallback((): QuarterData | null => {
    return getQ(curQ);
  }, [curQ, getQ]);

  return {
    curQ,
    setCurQ,
    curFilter,
    setCurFilter,
    quarters,
    getQ,
    getCompanies,
    getAllCompanies,
    getFilteredCompanies,
    getCurrentQData,
    loading,
  };
}

export { cachedData as insuranceData };
export type { InsuranceData, Company, Quarter, QuarterData, FilterType };
