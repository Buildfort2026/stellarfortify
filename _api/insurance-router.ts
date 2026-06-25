import { createRouter, publicQuery } from "./middleware.js";
import { z } from "zod";
import { readFileSync } from "fs";
import { resolve } from "path";

const insuranceData = JSON.parse(readFileSync(resolve("./insurance-data.json"), "utf-8"));

// ===== 类型定义 =====
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

interface QuarterData {
  kpi: {
    company_count: number;
    solvency_median: number;
    total_asset: number;
    growth_median: number | null;
    invest_median: number | null;
    aaa_count: number;
    profit_total: number;
    prev_solvency_median?: number;
    prev_total_asset?: number;
    prev_profit_total?: number;
    prev_invest_median?: number;
  };
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

const data = insuranceData as unknown as InsuranceData;

// ===== 工具函数 =====
const REF_KEYWORDS = [
  "最优值", "次优值", "三优值", "四优值", "五优值", "六优值", "七优值", "八优值", "九优值",
  "最差值", "次差值", "三差值", "四差值", "五差值", "六差值", "七差值", "八差值", "九差值",
  "平均数", "中位数", "最大值", "最小值", "行业均值",
];

function isRefRow(name: string): boolean {
  if (!name) return true;
  return REF_KEYWORDS.some((kw) => name.includes(kw));
}

// ===== Router =====
export const insuranceRouter = createRouter({
  // 获取所有季度列表
  listQuarters: publicQuery.query(() => {
    return data.quarters.map((q) => ({
      id: q.id,
      label: q.label,
    }));
  }),

  // 获取某个季度的完整数据
  getQuarterData: publicQuery
    .input(z.object({ quarterId: z.string() }))
    .query(({ input }) => {
      const qd = data.quarterData[input.quarterId];
      if (!qd) throw new Error("Quarter not found");
      return {
        kpi: qd.kpi,
        suspendedCount: qd.suspended_count,
        notCompeteCount: qd.not_compete_count,
        totalDisclosed: qd.total_disclosed,
        companies: qd.companies.filter((c) => c.tag !== "不参与市场竞争"),
      };
    }),

  // 获取某个季度的KPI
  getKpi: publicQuery
    .input(z.object({ quarterId: z.string() }))
    .query(({ input }) => {
      const qd = data.quarterData[input.quarterId];
      if (!qd) throw new Error("Quarter not found");
      return qd.kpi;
    }),

  // 获取所有公司列表（去重）
  listCompanies: publicQuery.query(() => {
    const allNames = new Set<string>();
    Object.values(data.quarterData).forEach((qd) => {
      qd.companies.forEach((c) => {
        if (c.name && !isRefRow(c.name)) allNames.add(c.name);
      });
    });
    return Array.from(allNames).sort();
  }),

  // 获取某个公司所有季度的历史数据
  getCompanyHistory: publicQuery
    .input(z.object({ companyName: z.string() }))
    .query(({ input }) => {
      return data.allQuarterCompanies[input.companyName] || {};
    }),

  // 获取某个公司的完整详情（最新季度）
  getCompanyDetail: publicQuery
    .input(z.object({ companyName: z.string(), quarterId: z.string().optional() }))
    .query(({ input }) => {
      const { companyName, quarterId } = input;
      // 如果没有指定季度，使用最新的
      const qid = quarterId || data.quarters[data.quarters.length - 1]?.id;
      if (!qid) throw new Error("No quarter data available");

      const qd = data.quarterData[qid];
      if (!qd) throw new Error("Quarter not found");

      const company = qd.companies.find((c) => c.name === companyName);
      if (!company) throw new Error("Company not found");

      // 获取历史趋势
      const history = data.allQuarterCompanies[companyName] || {};

      return { company, history };
    }),

  // 搜索公司
  searchCompanies: publicQuery
    .input(z.object({ query: z.string() }))
    .query(({ input }) => {
      const q = input.query.toLowerCase();
      const allNames = new Set<string>();
      Object.values(data.quarterData).forEach((qd) => {
        qd.companies.forEach((c) => {
          if (c.name && c.name.toLowerCase().includes(q) && !isRefRow(c.name)) {
            allNames.add(c.name);
          }
        });
      });
      return Array.from(allNames).slice(0, 20);
    }),

  // 获取行业整体趋势数据
  getIndustryTrend: publicQuery.query(() => {
    const trends = data.quarters.map((q) => {
      const qd = data.quarterData[q.id];
      if (!qd) return null;
      const valid = qd.companies.filter((c) => c.comp_solvency);
      const solMed = valid.length > 0
        ? valid.sort((a, b) => (a.comp_solvency || 0) - (b.comp_solvency || 0))[Math.floor(valid.length / 2)]?.comp_solvency
        : null;
      return {
        quarter: q.label,
        totalAsset: qd.kpi.total_asset,
        solvencyMedian: solMed,
        profitTotal: qd.kpi.profit_total,
        companyCount: qd.kpi.company_count,
      };
    }).filter(Boolean);
    return trends;
  }),

  // 获取指定生态分类的公司
  getCompaniesByEco: publicQuery
    .input(z.object({ eco: z.string(), quarterId: z.string() }))
    .query(({ input }) => {
      const qd = data.quarterData[input.quarterId];
      if (!qd) throw new Error("Quarter not found");
      return qd.companies.filter(
        (c) =>
          c.eco === input.eco &&
          c.tag !== "不参与市场竞争" &&
          !isRefRow(c.name)
      );
    }),
});
