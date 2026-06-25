import {
  mysqlTable,
  mysqlEnum,
  serial,
  varchar,
  text,
  timestamp,
  decimal,
  int,
  json,
  uniqueIndex,
} from "drizzle-orm/mysql-core";

// ==================== 用户表（已有） ====================
export const users = mysqlTable("users", {
  id: serial("id").primaryKey(),
  unionId: varchar("unionId", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 320 }),
  avatar: text("avatar"),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
  lastSignInAt: timestamp("lastSignInAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ==================== 保险公司表 ====================
export const companies = mysqlTable("companies", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  type: varchar("type", { length: 20 }),       // 国企/民企/外资/合资/混合
  eco: varchar("eco", { length: 30 }),         // 生态：老七家/银行系/能源系等
  tag: varchar("tag", { length: 50 }),         // 风险标签
  bg: text("bg"),                              // 股东背景
  status: text("status"),                      // 企业状态描述
  foundTime: varchar("found_time", { length: 50 }),  // 成立时间
  foundYear: int("found_year"),                // 成立年份
  address: varchar("address", { length: 50 }), // 注册地址
  regCapital: decimal("reg_capital", { precision: 12, scale: 4 }), // 注册资本
  region: int("region"),                       // 经营区域
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("idx_company_name").on(table.name),
]);

export type Company = typeof companies.$inferSelect;
export type InsertCompany = typeof companies.$inferInsert;

// ==================== 季度元数据表 ====================
export const quarters = mysqlTable("quarters", {
  id: serial("id").primaryKey(),
  quarterId: varchar("quarter_id", { length: 10 }).notNull().unique(), // 如 "2024Q1"
  label: varchar("label", { length: 30 }).notNull(),                  // 如 "2024年一季度"
  sheetName: varchar("sheet_name", { length: 30 }),                   // Excel sheet名
  suspendedCount: int("suspended_count").default(0),                  // 暂停披露数
  notCompeteCount: int("not_compete_count").default(0),               // 不参与市场竞争数
  totalDisclosed: int("total_disclosed").default(0),                  // 总披露公司数
  // KPI 统计数据（JSON格式，减少字段数量）
  kpiStats: json("kpi_stats"),             // {solvencyMedian, totalAsset, growthMedian, investMedian, aaaCount, profitTotal}
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("idx_quarter_id").on(table.quarterId),
]);

export type Quarter = typeof quarters.$inferSelect;
export type InsertQuarter = typeof quarters.$inferInsert;

// ==================== 季度指标数据表 ====================
export const quarterlyMetrics = mysqlTable("quarterly_metrics", {
  id: serial("id").primaryKey(),
  companyId: int("company_id").notNull(),     // 关联 companies.id
  quarterId: varchar("quarter_id", { length: 10 }).notNull(), // 如 "2024Q1"

  // ===== 偿付能力 =====
  coreSolvency: decimal("core_solvency", { precision: 10, scale: 6 }),      // 核心偿付能力充足率
  compSolvency: decimal("comp_solvency", { precision: 10, scale: 6 }),      // 综合偿付能力充足率
  rating: varchar("rating", { length: 10 }),                               // 风险综合评级
  ratingScore: decimal("rating_score", { precision: 8, scale: 4 }),        // 评级赋分

  // ===== 资本结构 =====
  totalAsset: decimal("total_asset", { precision: 14, scale: 4 }),         // 总资产（亿元）
  recogAsset: decimal("recog_asset", { precision: 14, scale: 4 }),         // 认可资产
  recogLiab: decimal("recog_liab", { precision: 14, scale: 4 }),           // 认可负债
  assetLiabRatio: decimal("asset_liab_ratio", { precision: 8, scale: 6 }), // 认可资产负债率
  actualCapital: decimal("actual_capital", { precision: 12, scale: 4 }),   // 实际资本
  coreCapital: decimal("core_capital", { precision: 12, scale: 4 }),       // 核心资本
  coreCapitalRatio: decimal("core_capital_ratio", { precision: 8, scale: 6 }), // 核心资本/实际资本
  core1Capital: decimal("core1_capital", { precision: 12, scale: 4 }),     // 核心一级资本
  core2Capital: decimal("core2_capital", { precision: 12, scale: 4 }),     // 核心二级资本
  minCapital: decimal("min_capital", { precision: 12, scale: 4 }),         // 最低资本
  netAsset: decimal("net_asset", { precision: 12, scale: 4 }),             // 净资产
  netAssetRate: decimal("net_asset_rate", { precision: 8, scale: 6 }),     // 净资产率

  // ===== 经营水平 =====
  incomeQ: decimal("income_q", { precision: 12, scale: 4 }),               // 保险业务收入（季度）
  incomeY: decimal("income_y", { precision: 12, scale: 4 }),               // 保险业务收入（年度）
  growth: decimal("growth", { precision: 8, scale: 4 }),                   // 规模保费同比增速
  profitQ: decimal("profit_q", { precision: 12, scale: 4 }),               // 净利润（季度）
  profitY: decimal("profit_y", { precision: 12, scale: 4 }),               // 净利润（年度）
  insRiskCapital: decimal("ins_risk_capital", { precision: 10, scale: 4 }), // 寿险业务保险风险最低资本
  surrenderCapital: decimal("surrender_capital", { precision: 10, scale: 4 }), // 退保风险最低资本
  surrenderRatio: decimal("surrender_ratio", { precision: 8, scale: 6 }),  // 退保风险占比
  mgmtCount: int("mgmt_count"),                                             // 高管人数
  maxSalary: decimal("max_salary", { precision: 10, scale: 4 }),            // 最高年度薪酬

  // ===== 盈利能力 =====
  roeQ: decimal("roe_q", { precision: 8, scale: 6 }),                      // ROE（季度）
  roeY: decimal("roe_y", { precision: 8, scale: 6 }),                      // ROE（年度）

  // ===== 投资能力 =====
  quantRisk: decimal("quant_risk", { precision: 10, scale: 4 }),            // 量化风险最低资本
  riskDiversify: decimal("risk_diversify", { precision: 10, scale: 4 }),    // 风险分散效应
  lossAbsorb: decimal("loss_absorb", { precision: 10, scale: 4 }),          // 损失吸收
  quantRiskSum: decimal("quant_risk_sum", { precision: 10, scale: 4 }),     // 量化风险简单加总
  marketRisk: decimal("market_risk", { precision: 10, scale: 4 }),          // 市场风险最低资本
  marketRiskRatio: decimal("market_risk_ratio", { precision: 8, scale: 6 }), // 市场风险占比
  equityRisk: decimal("equity_risk", { precision: 10, scale: 4 }),          // 权益价格风险最低资本
  overseasFi: decimal("overseas_fi", { precision: 10, scale: 4 }),          // 境外固收最低资本
  overseasEq: decimal("overseas_eq", { precision: 10, scale: 4 }),          // 境外权益最低资本
  fxRisk: decimal("fx_risk", { precision: 10, scale: 4 }),                  // 汇率风险最低资本
  overseasTotal: decimal("overseas_total", { precision: 10, scale: 4 }),    // 境外投资相关最低资本合计
  overseasRatio: decimal("overseas_ratio", { precision: 8, scale: 6 }),     // 境外投资市场风险占比
  equityRiskTotal: decimal("equity_risk_total", { precision: 10, scale: 4 }), // 权益价格风险最低资本合计
  marketDiversify: decimal("market_diversify", { precision: 10, scale: 4 }), // 市场风险分散效应
  marketRiskSum: decimal("market_risk_sum", { precision: 10, scale: 4 }),   // 市场风险简单加总
  equityRiskRatio: decimal("equity_risk_ratio", { precision: 8, scale: 6 }), // 权益投资风险占比
  investComp: decimal("invest_comp", { precision: 8, scale: 6 }),           // 本年累计综合投资收益率
  invest3yComp: decimal("invest_3y_comp", { precision: 8, scale: 6 }),      // 近三年平均综合投资收益率
  invest3y: decimal("invest_3y", { precision: 8, scale: 6 }),               // 近三年平均投资收益率

  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("idx_metrics_company_quarter").on(table.companyId, table.quarterId),
]);

export type QuarterlyMetric = typeof quarterlyMetrics.$inferSelect;
export type InsertQuarterlyMetric = typeof quarterlyMetrics.$inferInsert;
