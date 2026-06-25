import { useInsuranceData } from '@/hooks/useInsuranceData';

const ROADMAP = [
  { status: 'done', title: '数据可视化仪表盘 V1.0', desc: '完成基础数据可视化，覆盖偿付能力、资本实力、经营水平、投资能力四大模块' },
  { status: 'done', title: '多季度数据对比', desc: '支持历史纵览，追踪单公司和行业整体走势' },
  { status: 'now', title: '全栈升级 & 用户系统', desc: 'React + TypeScript + tRPC 全栈架构，支持用户注册登录' },
  { status: 'plan', title: '数据自动更新', desc: '每季度自动抓取和更新偿付能力报告数据' },
  { status: 'plan', title: '高级分析功能', desc: '同业对比、自定义筛选、数据导出增强' },
  { status: 'plan', title: '会员体系', desc: '专业版数据分析、定制化报告、API 接口' },
];

const METRICS = [
  { label: '综合偿付能力充足率', desc: '实际资本/最低资本，监管要求≥100%，低于100%将受到监管干预' },
  { label: '核心偿付能力充足率', desc: '核心资本/最低资本，监管要求≥50%，低于100%为重点关注对象' },
  { label: '风险综合评级', desc: 'AAA>AA>A>BBB>BB>B>C，综合反映公司风险管控水平' },
  { label: '退保风险占比', desc: '退保风险最低资本/最低资本，越高说明退保压力越大' },
  { label: '综合投资收益率', desc: '含浮盈浮亏的投资回报率，比净投资收益率更全面' },
  { label: '净资产率', desc: '净资产/总资产，反映险企自有资本厚度，低于5%需关注' },
  { label: '认可资产负债率', desc: '认可负债/认可资产，反映险企整体杠杆水平' },
];

export default function AboutPage() {
  const { quarters, getQ } = useInsuranceData();
  const firstQ = quarters[0];
  const lastQ = quarters[quarters.length - 1];

  // Count fields from first company
  let fieldCount = 0;
  const firstQD = firstQ ? getQ(firstQ.id) : null;
  if (firstQD?.companies?.[0]) {
    fieldCount = Object.keys(firstQD.companies[0]).length;
  }

  return (
    <div className="p-5 max-w-[1100px]">
      <div className="mb-6">
        <h1 className="text-[22px] font-extrabold text-[#e8edf5] mb-2">险企透视 · 偿付能力数据分析平台</h1>
        <p className="text-[#8899b4] text-[13px] leading-relaxed">
          本平台基于寿险公司官网公开披露的偿付能力报告数据，通过专业的数据筛选、整理与可视化，为保险从业者提供客观、全面、直观的险企健康度评估工具。
        </p>
      </div>

      {/* Data Info + Metrics */}
      <div className="grid grid-cols-2 gap-5 mb-5">
        <div className="about-card">
          <h3 className="text-sm font-bold text-[#e8edf5] mb-3.5 flex items-center gap-2">📊 数据说明</h3>
          <ul className="pl-4 text-[13px] text-[#8899b4] leading-7">
            <li>数据来源：各寿险公司官网公开披露的偿付能力季度报告（监管强制披露）</li>
            <li>当前覆盖：{firstQ?.label} ~ {lastQ?.label}，共 <strong className="text-[#4fd1c5]">{quarters.length}个季度</strong></li>
            <li>公司范围：<strong className="text-[#4fd1c5]">87家寿险公司</strong>（含20家暂停披露公司，已排除2家不参与市场竞争公司）</li>
            <li>数据维度：超 <strong className="text-[#4fd1c5]">{fieldCount}个数据指标</strong>，涵盖偿付能力、资本结构、经营水平、投资能力等模块</li>
            <li>更新频率：每季度更新一次（每年4次），通常在季度结束后约45天内披露</li>
            <li>使用提示：保险公司及其产品的对比分析维度众多，同时卖方的推荐和买方的选择也有各自的主观性。【星汉仪表盘】的研究仅是其中一种视角，难以覆盖全部的客观事实和价值判断，请理性对待，按需使用。</li>
          </ul>
        </div>
        <div className="about-card">
          <h3 className="text-sm font-bold text-[#e8edf5] mb-3.5 flex items-center gap-2">📋 核心指标说明</h3>
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr><th className="px-2 py-1.5 text-left text-[#4a5a72] font-semibold text-[10px] border-b border-[rgba(99,179,237,0.12)]">指标</th><th className="px-2 py-1.5 text-left text-[#4a5a72] font-semibold text-[10px] border-b border-[rgba(99,179,237,0.12)]">说明</th></tr>
            </thead>
            <tbody>
              {METRICS.map((m) => (
                <tr key={m.label}>
                  <td className="px-2 py-1.5 border-b border-[rgba(255,255,255,0.04)] text-[#4fd1c5] font-semibold">{m.label}</td>
                  <td className="px-2 py-1.5 border-b border-[rgba(255,255,255,0.04)] text-[#8899b4] leading-5">{m.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Roadmap */}
      <div className="about-card mb-5">
        <h3 className="text-sm font-bold text-[#e8edf5] mb-3.5 flex items-center gap-2">🗓️ 产品路线图</h3>
        <div>
          {ROADMAP.map((item, idx) => (
            <div key={idx} className="road-item">
              <div className={`road-dot ${item.status}`}>
                {item.status === 'done' ? '✓' : item.status === 'now' ? '●' : '○'}
              </div>
              <div>
                <div className="text-[13px] font-bold text-[#e8edf5] mb-0.5">{item.title}</div>
                <div className="text-xs text-[#4a5a72] leading-relaxed">{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Contact */}
      <div className="about-card">
        <h3 className="text-sm font-bold text-[#e8edf5] mb-3.5 flex items-center gap-2">📱 联系我</h3>
        <div className="grid grid-cols-5 gap-3.5">
          <div className="flex flex-col items-center gap-2">
            <div className="w-full max-w-[130px] h-[130px] bg-[#0d1528] rounded-lg border border-[rgba(99,179,237,0.12)] flex items-center justify-center text-[#4a5a72] text-xs">微信二维码</div>
            <span className="text-[11px] text-[#8899b4] font-semibold">微信（李星汉）</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="w-full max-w-[130px] h-[130px] bg-[#0d1528] rounded-lg border border-[rgba(99,179,237,0.12)] flex items-center justify-center text-[#4a5a72] text-xs">公众号二维码</div>
            <span className="text-[11px] text-[#8899b4] font-semibold">公众号 BuildFort 2026</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="w-full max-w-[130px] h-[130px] bg-[#0d1528] rounded-lg border border-[rgba(99,179,237,0.12)] flex items-center justify-center text-[#4a5a72] text-xs">视频号二维码</div>
            <span className="text-[11px] text-[#8899b4] font-semibold">视频号 BuildFort学钱班</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="w-full max-w-[130px] h-[130px] bg-[#0d1528] rounded-lg border border-[rgba(99,179,237,0.12)] flex items-center justify-center text-[#4a5a72] text-xs">知识星球二维码</div>
            <span className="text-[11px] text-[#8899b4] font-semibold">知识星球 BuildFort学钱班</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="w-full max-w-[130px] h-[130px] bg-[#0d1528] rounded-lg border border-[rgba(99,179,237,0.12)] flex items-center justify-center text-[#4a5a72] text-xs">课程二维码</div>
            <span className="text-[11px] text-[#8899b4] font-semibold">险企透视课</span>
          </div>
        </div>
      </div>
    </div>
  );
}
