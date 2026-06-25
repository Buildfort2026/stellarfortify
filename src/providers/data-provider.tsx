/**
 * Static Data Provider - 通过 fetch 加载保险数据
 */
import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";

interface QuarterInfo {
  id: string;
  label: string;
  sheet: string;
}

interface CompanyMetrics {
  name: string;
  type?: string;
  eco?: string;
  tag?: string;
  bg?: string;
  status?: string;
  found_time?: string;
  found_year?: number;
  address?: string;
  reg_capital?: number;
  region?: number;
  total_asset?: number;
  core_solvency?: number;
  comp_solvency?: number;
  rating?: string;
  rating_score?: number;
  recog_asset?: number;
  recog_liab?: number;
  asset_liab_ratio?: number;
  actual_capital?: number;
  core_capital?: number;
  core_capital_ratio?: number;
  core1_capital?: number;
  core2_capital?: number;
  min_capital?: number;
  net_asset?: number;
  net_asset_rate?: number;
  income_q?: number;
  income_y?: number;
  growth?: number;
  profit_q?: number;
  profit_y?: number;
  ins_risk_capital?: number;
  surrender_capital?: number;
  surrender_ratio?: number;
  mgmt_count?: number;
  max_salary?: number;
  roe_q?: number;
  roe_y?: number;
  quant_risk?: number;
  risk_diversify?: number;
  loss_absorb?: number;
  quant_risk_sum?: number;
  market_risk?: number;
  market_risk_ratio?: number;
  equity_risk?: number;
  overseas_fi?: number;
  overseas_eq?: number;
  fx_risk?: number;
  overseas_total?: number;
  overseas_ratio?: number;
  equity_risk_total?: number;
  market_diversify?: number;
  market_risk_sum?: number;
  equity_risk_ratio?: number;
  invest_comp?: number;
  invest_3y_comp?: number;
  invest_3y?: number;
}

interface KpiData {
  company_count: number;
  solvency_median: number;
  total_asset: number;
  growth_median: number | null;
  invest_median: number | null;
  aaa_count: number;
  profit_total: number;
}

interface QuarterData {
  kpi: KpiData;
  suspended_count: number;
  not_compete_count: number;
  total_disclosed: number;
  companies: CompanyMetrics[];
}

interface InsuranceData {
  quarters: QuarterInfo[];
  quarterData: Record<string, QuarterData>;
  allQuarterCompanies: Record<string, Record<string, Partial<CompanyMetrics>>>;
}

interface DataContextType {
  quarters: QuarterInfo[];
  getQuarterData: (quarterId: string) => { kpi: KpiData; suspendedCount: number; notCompeteCount: number; totalDisclosed: number; companies: CompanyMetrics[] } | null;
  getCompanyDetail: (name: string, quarterId?: string) => { company: CompanyMetrics; history: Record<string, Partial<CompanyMetrics>> } | null;
  getCompanyHistory: (name: string) => Record<string, Partial<CompanyMetrics>>;
  getIndustryTrend: () => Array<{ quarter: string; totalAsset: number; solvencyMedian: number | null; profitTotal: number; companyCount: number }>;
  listCompanies: () => string[];
  searchCompanies: (query: string) => string[];
  isLoading: boolean;
}

const DataContext = createContext<DataContextType | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<InsuranceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/insurance-data.json")
      .then((r) => r.json())
      .then((d) => { setData(d); setIsLoading(false); })
      .catch(() => setIsLoading(false));
  }, []);

  const value: DataContextType = {
    quarters: data?.quarters || [],
    isLoading,

    getQuarterData: (quarterId: string) => {
      if (!data) return null;
      const qd = data.quarterData[quarterId];
      if (!qd) return null;
      return {
        kpi: qd.kpi,
        suspendedCount: qd.suspended_count,
        notCompeteCount: qd.not_compete_count,
        totalDisclosed: qd.total_disclosed,
        companies: qd.companies.filter((c) => c.tag !== "不参与市场竞争"),
      };
    },

    getCompanyDetail: (name: string, quarterId?: string) => {
      if (!data) return null;
      const qid = quarterId || data.quarters[data.quarters.length - 1]?.id;
      if (!qid) return null;
      const qd = data.quarterData[qid];
      if (!qd) return null;
      const company = qd.companies.find((c) => c.name === name);
      if (!company) return null;
      const history = data.allQuarterCompanies[name] || {};
      return { company, history };
    },

    getCompanyHistory: (name: string) => data?.allQuarterCompanies[name] || {},

    getIndustryTrend: () => {
      if (!data) return [];
      return data.quarters.map((q) => {
        const qd = data.quarterData[q.id];
        if (!qd) return null;
        const valid = qd.companies.filter((c) => c.comp_solvency);
        const solMed = valid.length > 0
          ? valid.sort((a, b) => (a.comp_solvency || 0) - (b.comp_solvency || 0))[Math.floor(valid.length / 2)]?.comp_solvency
          : null;
        return {
          quarter: q.label,
          totalAsset: qd.kpi.total_asset,
          solvencyMedian: solMed || null,
          profitTotal: qd.kpi.profit_total,
          companyCount: qd.kpi.company_count,
        };
      }).filter(Boolean) as Array<{ quarter: string; totalAsset: number; solvencyMedian: number | null; profitTotal: number; companyCount: number }>;
    },

    listCompanies: () => {
      if (!data) return [];
      const allNames = new Set<string>();
      Object.values(data.quarterData).forEach((qd) => {
        qd.companies.forEach((c) => { if (c.name) allNames.add(c.name); });
      });
      return Array.from(allNames).sort();
    },

    searchCompanies: (query: string) => {
      if (!data) return [];
      const q = query.toLowerCase();
      const allNames = new Set<string>();
      Object.values(data.quarterData).forEach((qd) => {
        qd.companies.forEach((c) => { if (c.name && c.name.toLowerCase().includes(q)) allNames.add(c.name); });
      });
      return Array.from(allNames).slice(0, 20);
    },
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useStaticData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useStaticData must be used within DataProvider");
  return ctx;
}
