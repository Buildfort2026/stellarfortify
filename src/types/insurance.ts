export interface Quarter {
  id: string;
  label: string;
  sheet: string;
}

export interface Company {
  name: string;
  type: string;
  eco: string;
  tag: string;
  bg?: string;
  status?: string;
  found_time?: string;
  found_year: number | null;
  address?: string;
  reg_capital?: number;
  region?: number;
  total_asset: number;
  core_solvency: number;
  comp_solvency: number;
  rating: string;
  rating_score: number | null;
  recog_asset?: number;
  recog_liab?: number;
  asset_liab_ratio: number;
  actual_capital?: number;
  core_capital?: number;
  core_capital_ratio: number;
  core1_capital?: number;
  core2_capital?: number;
  min_capital?: number;
  net_asset: number;
  net_asset_rate: number;
  income_q: number;
  income_y?: number;
  growth: number | null;
  profit_q: number;
  profit_y?: number;
  ins_risk_capital?: number;
  surrender_capital?: number;
  surrender_ratio: number;
  mgmt_count?: number;
  max_salary?: number;
  roe_q?: number | null;
  roe_y: number | null;
  quant_risk?: number;
  risk_diversify?: number;
  loss_absorb?: number;
  quant_risk_sum?: number;
  market_risk?: number;
  market_risk_ratio: number;
  equity_risk_ratio?: number;
  equity_risk?: number;
  overseas_fi?: number;
  overseas_eq?: number;
  fx_risk?: number;
  overseas_total?: number;
  overseas_ratio?: number;
  total_staff?: number;
  doc_url?: string;
  invest_comp: number | null;
  invest_3y_comp: number | null;
  invest_3y: number | null;
}

export interface QuarterKPI {
  company_count: number;
  solvency_median: number;
  total_asset: number;
  growth_median: number;
  invest_median: number;
  aaa_count: number;
  profit_total: number;
  prev_solvency_median?: number;
  prev_total_asset?: number;
}

export interface QuarterData {
  kpi: QuarterKPI;
  suspended_count: number;
  not_compete_count: number;
  total_disclosed: number;
  companies: Company[];
}

export interface InsuranceData {
  quarters: Quarter[];
  quarterData: Record<string, QuarterData>;
}

export type FilterType = 'all' | '行业头部' | '顶级水准' | '相对健康' | '评级为B' | 'risk';

export const RATING_ORDER = ['AAA', 'AA', 'A', 'BBB', 'BB', 'B', 'C', 'D'];

export const TAG_ORDER = [
  '顶级水准',
  '行业头部',
  '相对健康',
  '净资产比例低于5%',
  '连续两年净现金流为负',
  '偿付能力低于100%',
  '评级为B',
  '评级不达标',
  '暂停披露',
];
