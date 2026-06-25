import { fmt, ratingClass, mTagClass } from '@/utils/format';
import type { Company } from '@/types/insurance';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface CompanyModalProps {
  company: Company | null;
  quarterLabel: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CompanyModal({ company, quarterLabel, open, onOpenChange }: CompanyModalProps) {
  if (!company) return null;

  const tCls = mTagClass(company.tag);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0d1528] border-[rgba(99,179,237,0.3)] text-[#e8edf5] max-w-[700px] max-h-[85vh] overflow-y-auto rounded-2xl shadow-2xl">
        <DialogHeader className="border-b border-[rgba(99,179,237,0.12)] pb-3 sticky top-0 bg-[#0d1528] z-10">
          <DialogTitle className="text-[17px] font-extrabold text-[#e8edf5]">{company.name}</DialogTitle>
        </DialogHeader>

        <div className="pt-4">
          <div className={`m-tag ${tCls}`}>{company.tag || '—'}</div>

          <div className="grid grid-cols-3 gap-2.5 mb-4">
            <div className="bg-[#111e35] border border-[rgba(99,179,237,0.12)] rounded-lg p-2.5">
              <div className="text-[10px] text-[#4a5a72] mb-px uppercase tracking-wider">综合偿付能力充足率</div>
              <div className={`text-[17px] font-bold ${company.comp_solvency > 1 ? 'text-[#68d391]' : company.comp_solvency > 0.75 ? 'text-[#f6ad55]' : 'text-[#fc8181]'}`}>
                {fmt.pct(company.comp_solvency)}
              </div>
            </div>
            <div className="bg-[#111e35] border border-[rgba(99,179,237,0.12)] rounded-lg p-2.5">
              <div className="text-[10px] text-[#4a5a72] mb-px uppercase tracking-wider">核心偿付能力充足率</div>
              <div className={`text-[17px] font-bold ${company.core_solvency > 1 ? 'text-[#68d391]' : company.core_solvency > 0.5 ? 'text-[#f6ad55]' : 'text-[#fc8181]'}`}>
                {fmt.pct(company.core_solvency)}
              </div>
            </div>
            <div className="bg-[#111e35] border border-[rgba(99,179,237,0.12)] rounded-lg p-2.5">
              <div className="text-[10px] text-[#4a5a72] mb-px uppercase tracking-wider">风险综合评级</div>
              <div className="text-[17px] font-bold">
                <span className={`rb ${ratingClass(company.rating)}`}>{company.rating || '—'}</span>
              </div>
            </div>
            <div className="bg-[#111e35] border border-[rgba(99,179,237,0.12)] rounded-lg p-2.5">
              <div className="text-[10px] text-[#4a5a72] mb-px uppercase tracking-wider">总资产规模</div>
              <div className="text-[17px] font-bold text-[#e8edf5]">{fmt.wan(company.total_asset)}</div>
            </div>
            <div className="bg-[#111e35] border border-[rgba(99,179,237,0.12)] rounded-lg p-2.5">
              <div className="text-[10px] text-[#4a5a72] mb-px uppercase tracking-wider">净资产率</div>
              <div className={`text-[17px] font-bold ${company.net_asset_rate > 0.05 ? 'text-[#68d391]' : 'text-[#fc8181]'}`}>
                {fmt.pct(company.net_asset_rate)}
              </div>
            </div>
            <div className="bg-[#111e35] border border-[rgba(99,179,237,0.12)] rounded-lg p-2.5">
              <div className="text-[10px] text-[#4a5a72] mb-px uppercase tracking-wider">认可资产负债率</div>
              <div className="text-[17px] font-bold text-[#e8edf5]">{fmt.pct(company.asset_liab_ratio)}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-1.5 mt-3.5">
            <InfoRow label="公司类型" value={company.type || '—'} />
            <InfoRow label="生态分类" value={company.eco || '—'} />
            <InfoRow label="成立年份" value={company.found_year != null ? String(company.found_year) : '—'} />
            <InfoRow label="注册资本" value={company.reg_capital ? company.reg_capital + '亿' : '—'} />
            <InfoRow label="季度保险业务收入" value={fmt.num(company.income_q) + '亿'} />
            <InfoRow label="季度净利润" value={fmt.num(company.profit_q) + '亿'} valColor={(company.profit_q || 0) < 0 ? '#fc8181' : undefined} />
            <InfoRow label="规模保费同比增速" value={fmt.pct(company.growth)} />
            <InfoRow label="年化ROE" value={fmt.pct(company.roe_y)} />
            <InfoRow label="综合投资收益率" value={fmt.pct(company.invest_comp)} />
            <InfoRow label="近三年平均综合投资收益率" value={fmt.pct(company.invest_3y_comp)} />
            <InfoRow label="退保风险占比" value={fmt.pct(company.surrender_ratio)} />
            <InfoRow label="市场风险占比" value={fmt.pct(company.market_risk_ratio)} />
          </div>

          <div className="mt-3.5 text-[11px] text-[#4a5a72]">数据季度：{quarterLabel}</div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function InfoRow({ label, value, valColor }: { label: string; value: string; valColor?: string }) {
  return (
    <div className="flex justify-between items-center px-2.5 py-1.5 bg-[#111e35] rounded-md text-xs">
      <span className="text-[#4a5a72]">{label}</span>
      <span className="text-[#e8edf5] font-semibold" style={valColor ? { color: valColor } : undefined}>
        {value}
      </span>
    </div>
  );
}
