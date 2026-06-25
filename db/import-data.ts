/**
 * 保险公司偿付能力数据导入脚本（批量插入优化版）
 * 用法：npx tsx db/import-data.ts
 */
import { getDb } from "../api/queries/connection.js";
import { companies, quarters, quarterlyMetrics } from "./schema.js";
import { eq } from "drizzle-orm";
import XLSX from "xlsx";

const EXCEL_PATH = "/mnt/agents/upload/保险公司偿付能力数据.xlsx";
const BATCH_SIZE = 100;

function toFloat(v: unknown): string | null {
  if (v === null || v === "" || v === "-" || v === undefined) return null;
  const n = parseFloat(String(v));
  return isNaN(n) ? null : String(n);
}

function toInt(v: unknown): number | null {
  if (v === null || v === "" || v === undefined) return null;
  const n = parseInt(String(v));
  return isNaN(n) ? null : n;
}

function parseYear(v: unknown): number | null {
  if (!v) return null;
  const m = String(v).match(/(\d{4})/);
  return m ? parseInt(m[1]) : null;
}

function quarterSortKey(name: string): number {
  const m = name.match(/(\d{4})年([一二三四])季度/);
  if (m) {
    const year = parseInt(m[1]);
    const qMap: Record<string, number> = { 一: 1, 二: 2, 三: 3, 四: 4 };
    return year * 10 + (qMap[m[2]] || 0);
  }
  return 0;
}

function getQuarterInfo(sheetName: string) {
  const m = sheetName.match(/(\d{4})年([一二三四])季度/);
  if (m) {
    const year = parseInt(m[1]);
    const qMap: Record<string, string> = { 一: "1", 二: "2", 三: "3", 四: "4" };
    const q = qMap[m[2]] || "0";
    return { quarterId: `${year}Q${q}`, label: sheetName, sheetName };
  }
  return { quarterId: sheetName, label: sheetName, sheetName };
}

async function main() {
  console.log("📊 开始导入保险数据...");
  const startTime = Date.now();
  const db = getDb();

  console.log(`📖 读取 Excel...`);
  const workbook = XLSX.readFile(EXCEL_PATH);
  const sheetNames = workbook.SheetNames.filter((n) =>
    /\d{4}年[一二三四]季度/.test(n)
  ).sort((a, b) => quarterSortKey(a) - quarterSortKey(b));
  console.log(`   发现 ${sheetNames.length} 个季度`);

  const companyMap = new Map<string, any>();
  const quarterDataList: any[] = [];

  for (const sheetName of sheetNames) {
    const ws = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];
    const headerRow = rows[1] || [];
    const colMap: Record<string, number> = {};
    headerRow.forEach((h, i) => { if (h) colMap[String(h).trim()] = i; });

    const qInfo = getQuarterInfo(sheetName);
    let suspendedCount = 0;
    const sheetCompanies: any[] = [];

    for (let i = 3; i < rows.length; i++) {
      const row = rows[i];
      if (!row || !row[1]) continue;
      const name = String(row[1]).trim();
      if (/最优值|次优值|次差值|最差值|平均数|中位数|最大值|最小值|行业均值/.test(name)) continue;

      const tag = row[colMap["风险标签"] || 4];
      if (tag === "不参与市场竞争") continue;
      if (tag === "暂停披露") suspendedCount++;

      if (!companyMap.has(name)) {
        companyMap.set(name, {
          name, type: row[colMap["类型"] || 2], eco: row[colMap["生态"] || 3], tag,
          bg: row[colMap["股东背景"] || 6], status: row[colMap["企业状态"] || 7],
          foundTime: row[colMap["成立时间"] || 8], foundYear: parseYear(row[colMap["成立时间"] || 8]),
          address: row[colMap["注册地址"] || 9], regCapital: toFloat(row[colMap["注册资本"] || 10]),
          region: toInt(row[colMap["经营区域"] || 11]),
        });
      }

      sheetCompanies.push({
        name, quarterId: qInfo.quarterId, tag,
        coreSolvency: toFloat(row[colMap["核心偿付能力充足率"] || 13]),
        compSolvency: toFloat(row[colMap["综合偿付能力充足率"] || 14]),
        rating: row[colMap["风险综合\n评级"] || 15] || null,
        ratingScore: toFloat(row[colMap["辅助列\n（评级赋分）"] || 16]),
        totalAsset: toFloat(row[colMap["总资产"] || 12]),
        recogAsset: toFloat(row[colMap["认可资产"] || 17]),
        recogLiab: toFloat(row[colMap["认可负债"] || 18]),
        assetLiabRatio: toFloat(row[colMap["认可\n资产负债率"] || 19]),
        actualCapital: toFloat(row[colMap["实际资本"] || 20]),
        coreCapital: toFloat(row[colMap["核心资本"] || 21]),
        coreCapitalRatio: toFloat(row[colMap["核心资本/实际资本"] || 22]),
        core1Capital: toFloat(row[colMap["核心\n一级资本"] || 23]),
        core2Capital: toFloat(row[colMap["核心\n二级资本"] || 24]),
        minCapital: toFloat(row[colMap["最低资本"] || 25]),
        netAsset: toFloat(row[colMap["净资产"] || 26]),
        netAssetRate: toFloat(row[colMap["净资产率"] || 27]),
        incomeQ: toFloat(row[colMap["保险业务收入(季度)"] || 28]),
        incomeY: toFloat(row[colMap["保险业务收入(年度)"] || 29]),
        growth: toFloat(row[colMap["规模保费同比增速"] || 30]),
        profitQ: toFloat(row[colMap["净利润\n（季度）"] || 31]),
        profitY: toFloat(row[colMap["净利润\n（年度）"] || 32]),
        insRiskCapital: toFloat(row[colMap["寿险业务保险风险最低资本"] || 33]),
        surrenderCapital: toFloat(row[colMap["退保风险最低资本"] || 34]),
        surrenderRatio: toFloat(row[colMap["退保风险占比"] || 35]),
        mgmtCount: toInt(row[colMap["高管人数"] || 36]),
        maxSalary: toFloat(row[colMap["最高年度薪酬"] || 37]),
        roeQ: toFloat(row[colMap["净资产收益率（季度）"] || 38]),
        roeY: toFloat(row[colMap["净资产收益率（年度）"] || 39]),
        quantRisk: toFloat(row[colMap["量化风险\n最低资本"] || 40]),
        riskDiversify: toFloat(row[colMap["风险\n分散效应"] || 41]),
        lossAbsorb: toFloat(row[colMap["损失吸收"] || 42]),
        quantRiskSum: toFloat(row[colMap["量化风险简单加总"] || 43]),
        marketRisk: toFloat(row[colMap["市场风险\n最低资本"] || 44]),
        marketRiskRatio: toFloat(row[colMap["市场风险\n占比"] || 45]),
        equityRisk: toFloat(row[colMap["权益价格风险\n最低资本"] || 46]),
        overseasFi: toFloat(row[colMap["境外固收\n最低资本"] || 47]),
        overseasEq: toFloat(row[colMap["境外权益\n最低资本"] || 48]),
        fxRisk: toFloat(row[colMap["汇率风险\n最低资本"] || 49]),
        overseasTotal: toFloat(row[colMap["境外投资相关\n最低资本合计"] || 50]),
        overseasRatio: toFloat(row[colMap["境外投资\n市场风险占比"] || 51]),
        equityRiskTotal: toFloat(row[colMap["权益价格风险\n最低资本合计"] || 52]),
        marketDiversify: toFloat(row[colMap["市场风险\n风险分散效应"] || 53]),
        marketRiskSum: toFloat(row[colMap["市场风险\n简单加总"] || 54]),
        equityRiskRatio: toFloat(row[colMap["权益投资\n风险占比"] || 55]),
        investComp: toFloat(row[colMap["本年累计综合投资收益率"] || 56]),
        invest3yComp: toFloat(row[colMap["近三年平均综合\n投资收益率"] || 57]),
        invest3y: toFloat(row[colMap["近三年平均\n投资收益率"] || 58]),
      });
    }

    // 计算 KPI
    const solVals = sheetCompanies.map((c) => c.compSolvency).filter((v) => v != null).map(Number).sort((a: number, b: number) => a - b);
    const n = solVals.length;
    const solMed = n > 0 ? (n % 2 === 0 ? (solVals[n / 2 - 1] + solVals[n / 2]) / 2 : solVals[Math.floor(n / 2)]) : null;
    const totalAsset = sheetCompanies.reduce((s: number, c: any) => s + (Number(c.totalAsset) || 0), 0);
    const grVals = sheetCompanies.map((c) => c.growth).filter((v) => v != null).map(Number).sort((a: number, b: number) => a - b);
    const ng = grVals.length;
    const grMed = ng > 0 ? (ng % 2 === 0 ? (grVals[ng / 2 - 1] + grVals[ng / 2]) / 2 : grVals[Math.floor(ng / 2)]) : null;
    const invVals = sheetCompanies.map((c) => c.invest3yComp).filter((v) => v != null).map(Number).sort((a: number, b: number) => a - b);
    const ni = invVals.length;
    const invMed = ni > 0 ? (ni % 2 === 0 ? (invVals[ni / 2 - 1] + invVals[ni / 2]) / 2 : invVals[Math.floor(ni / 2)]) : null;
    const aaaCount = sheetCompanies.filter((c: any) => c.rating === "AAA").length;
    const profitTotal = sheetCompanies.reduce((s: number, c: any) => s + (Number(c.profitQ) || 0), 0);

    quarterDataList.push({
      ...qInfo, suspendedCount, notCompeteCount: 0,
      totalDisclosed: sheetCompanies.length,
      kpiStats: JSON.stringify({ companyCount: sheetCompanies.length, solvencyMedian: solMed, totalAsset, growthMedian: grMed, investMedian: invMed, aaaCount, profitTotal }),
      metrics: sheetCompanies,
    });
  }

  console.log(`   ${companyMap.size} 家唯一公司, ${quarterDataList.reduce((s, q) => s + q.metrics.length, 0)} 条指标数据`);

  // 批量插入公司
  console.log("🏢 导入公司...");
  const companyList = Array.from(companyMap.values());
  for (let i = 0; i < companyList.length; i += BATCH_SIZE) {
    const batch = companyList.slice(i, i + BATCH_SIZE);
    try {
      await db.insert(companies).values(batch as any);
    } catch (e: any) {
      if (e.message?.includes("Duplicate")) {
        for (const c of batch) {
          try { await db.insert(companies).values(c as any); } catch {}
        }
      }
    }
  }

  const allCompanies = await db.select().from(companies);
  const companyIdMap = new Map(allCompanies.map((c) => [c.name, c.id]));
  console.log(`   ✅ ${companyIdMap.size} 家公司`);

  // 批量插入季度
  console.log("📅 导入季度...");
  for (let i = 0; i < quarterDataList.length; i += BATCH_SIZE) {
    const batch = quarterDataList.slice(i, i + BATCH_SIZE).map((q) => ({
      quarterId: q.quarterId, label: q.label, sheetName: q.sheetName,
      suspendedCount: q.suspendedCount, notCompeteCount: q.notCompeteCount,
      totalDisclosed: q.totalDisclosed, kpiStats: q.kpiStats,
    }));
    try {
      await db.insert(quarters).values(batch as any)
        .onDuplicateKeyUpdate({
          set: { label: batch[0].label, totalDisclosed: batch[0].totalDisclosed, suspendedCount: batch[0].suspendedCount, kpiStats: batch[0].kpiStats },
        });
    } catch {}
  }
  console.log(`   ✅ ${quarterDataList.length} 个季度`);

  // 批量插入指标
  console.log("📈 导入指标...");
  let totalMetrics = 0;
  for (const q of quarterDataList) {
    const metricsBatch = q.metrics.map((m: any) => ({
      companyId: companyIdMap.get(m.name),
      quarterId: m.quarterId,
      coreSolvency: m.coreSolvency, compSolvency: m.compSolvency,
      rating: m.rating, ratingScore: m.ratingScore,
      totalAsset: m.totalAsset, recogAsset: m.recogAsset,
      recogLiab: m.recogLiab, assetLiabRatio: m.assetLiabRatio,
      actualCapital: m.actualCapital, coreCapital: m.coreCapital,
      coreCapitalRatio: m.coreCapitalRatio, core1Capital: m.core1Capital,
      core2Capital: m.core2Capital, minCapital: m.minCapital,
      netAsset: m.netAsset, netAssetRate: m.netAssetRate,
      incomeQ: m.incomeQ, incomeY: m.incomeY, growth: m.growth,
      profitQ: m.profitQ, profitY: m.profitY,
      insRiskCapital: m.insRiskCapital, surrenderCapital: m.surrenderCapital,
      surrenderRatio: m.surrenderRatio, mgmtCount: m.mgmtCount,
      maxSalary: m.maxSalary, roeQ: m.roeQ, roeY: m.roeY,
      quantRisk: m.quantRisk, riskDiversify: m.riskDiversify,
      lossAbsorb: m.lossAbsorb, quantRiskSum: m.quantRiskSum,
      marketRisk: m.marketRisk, marketRiskRatio: m.marketRiskRatio,
      equityRisk: m.equityRisk, overseasFi: m.overseasFi,
      overseasEq: m.overseasEq, fxRisk: m.fxRisk,
      overseasTotal: m.overseasTotal, overseasRatio: m.overseasRatio,
      equityRiskTotal: m.equityRiskTotal, marketDiversify: m.marketDiversify,
      marketRiskSum: m.marketRiskSum, equityRiskRatio: m.equityRiskRatio,
      investComp: m.investComp, invest3yComp: m.invest3yComp, invest3y: m.invest3y,
    })).filter((m: any) => m.companyId);

    for (let i = 0; i < metricsBatch.length; i += BATCH_SIZE) {
      const batch = metricsBatch.slice(i, i + BATCH_SIZE);
      try {
        await db.insert(quarterlyMetrics).values(batch as any)
          .onDuplicateKeyUpdate({
            set: { compSolvency: batch[0]?.compSolvency },
          });
        totalMetrics += batch.length;
      } catch (e: any) {
        console.warn(`   ⚠️ 批次失败: ${e.message}`);
      }
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`   ✅ ${totalMetrics} 条指标数据`);
  console.log(`\n🎉 导入完成！耗时 ${elapsed}秒`);
}

main().catch((e) => { console.error("❌ 导入失败:", e); process.exit(1); });
