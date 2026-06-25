import { Link, useLocation } from 'react-router';

interface NavbarProps {
  curQ: string;
  quarters: Array<{ id: string; label: string }>;
  onQuarterChange: (qid: string) => void;
}

const navItems = [
  { path: '/', label: '当季仪表盘' },
  { path: '/trend', label: '历史纵览' },
  { path: '/table', label: '完整数据' },
  { path: '/about', label: '关于 & 更新' },
];

export default function Navbar({ curQ, quarters, onQuarterChange }: NavbarProps) {
  const location = useLocation();

  return (
    <nav className="sticky top-0 z-[1000] bg-[rgba(8,13,26,0.94)] backdrop-blur-[20px] border-b border-[rgba(99,179,237,0.12)] h-[54px] flex items-center px-5 gap-3">
      <Link to="/" className="flex items-center gap-2.5 no-underline flex-shrink-0">
        <img
          src="/logo.png"
          className="h-[38px] w-auto flex-shrink-0 opacity-95 hover:opacity-100 hover:brightness-125"
          style={{ filter: 'drop-shadow(0 0 6px rgba(99,179,237,0.4))' }}
          alt="险企透视"
        />
        <div className="flex flex-col leading-tight gap-px">
          <span className="text-[15px] font-extrabold text-[#e8edf5] whitespace-nowrap tracking-wide">
            险企透视
          </span>
          <span className="text-[11px] font-medium text-[#8899b4] whitespace-nowrap">
            偿付能力数据分析平台
          </span>
        </div>
      </Link>

      <div className="flex-1" />

      {/* Quarter Selector */}
      <div className="flex items-center bg-[rgba(99,179,237,0.07)] border border-[rgba(99,179,237,0.3)] rounded-lg px-3.5 h-8 gap-1.5 transition-all hover:bg-[rgba(99,179,237,0.12)] hover:border-[rgba(99,179,237,0.5)]">
        <select
          value={curQ}
          onChange={(e) => onQuarterChange(e.target.value)}
          className="bg-transparent border-none text-[#4fd1c5] text-xs font-semibold font-[inherit] cursor-pointer outline-none appearance-none pr-4"
        >
          {[...quarters].reverse().map((q) => (
            <option key={q.id} value={q.id} className="bg-[#0d1528] text-[#e8edf5] text-sm">
              {q.label}
            </option>
          ))}
        </select>
        <span className="text-[#4fd1c5] text-[9px] pointer-events-none -ml-3.5 opacity-70">▼</span>
      </div>

      {/* Nav Tabs */}
      <div className="flex gap-0.5 bg-[rgba(255,255,255,0.04)] border border-[rgba(99,179,237,0.12)] rounded-lg p-[3px]">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`px-3.5 py-[5px] rounded-md text-[13px] font-medium font-[inherit] cursor-pointer transition-all whitespace-none no-underline ${
                isActive
                  ? 'bg-[#63b3ed] text-[#080d1a] font-bold'
                  : 'bg-transparent text-[#8899b4] hover:text-[#e8edf5] hover:bg-[rgba(255,255,255,0.06)]'
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
