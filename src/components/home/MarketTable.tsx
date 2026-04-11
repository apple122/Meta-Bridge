import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, TrendingDown, ChevronDown, Filter } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { getAssetCategory } from "../../utils/trade";

interface MarketTableProps {
  stocks: any[];
  t: (key: string) => string;
}

export const MarketTable: React.FC<MarketTableProps> = ({ stocks, t }) => {
  const [activeCategory, setActiveCategory] = React.useState<string>("all");
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredStocks =
    activeCategory === "all"
      ? stocks
      : stocks.filter((s) => getAssetCategory(s.symbol) === activeCategory);

  const categories = ["all", "crypto", "stock", "commodity"];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card overflow-hidden p-0"
    >
      <div className="p-6 border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h3 className="text-xl font-black text-white uppercase tracking-tight">
          {t("activityLedger")}
        </h3>

        {/* Custom Category Dropdown */}
        <div className="relative w-full sm:w-auto" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-full sm:w-auto flex items-center justify-between sm:justify-start gap-3 px-5 py-2.5 bg-slate-900 border border-white/10 rounded-xl text-xs font-black text-white uppercase tracking-widest hover:border-primary/50 transition-all shadow-xl active:scale-95"
          >
            <div className="flex items-center gap-2">
              <Filter size={14} className="text-primary" />
              <span className="text-left">{t(activeCategory)}</span>
            </div>
            <ChevronDown
              size={16}
              className={`text-slate-500 transition-transform duration-300 ${isDropdownOpen ? "rotate-180" : ""}`}
            />
          </button>

          <AnimatePresence>
            {isDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 5, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 top-full z-[100] mt-2 w-full sm:w-56 glass-card bg-slate-900/90 border-white/10 shadow-2xl p-2"
              >
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      setActiveCategory(cat);
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                      activeCategory === cat
                        ? "bg-primary text-white"
                        : "text-slate-400 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    {t(cat)}
                    {activeCategory === cat && (
                      <div className="w-1.5 h-1.5 rounded-full bg-white shadow-lg shadow-white" />
                    )}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-white/5 text-slate-500 text-[10px] font-black uppercase tracking-widest border-b border-white/5">
            <tr>
              <th className="px-6 py-4">{t("allAssets")}</th>
              <th className="px-6 py-4 text-right">{t("latestPrice")}</th>
              <th className="px-6 py-4 text-right">{t("change24h")}</th>
              <th className="px-6 py-4 text-right hidden md:table-cell">
                Market Cap
              </th>
              <th className="px-6 py-4 text-right hidden lg:table-cell">
                Volume
              </th>
              <th className="px-6 py-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filteredStocks.map((stock) => (
              <tr
                key={stock.id}
                onClick={() =>
                  navigate("/trade", { state: { symbol: stock.symbol } })
                }
                className="hover:bg-white/[0.02] transition-colors group"
              >
                <td className="px-6 py-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                      {stock.icon}
                    </div>
                    <div>
                      <p className="text-white font-bold group-hover:text-primary transition-colors">
                        {stock.name}
                      </p>
                      <p className="text-slate-500 text-xs">{stock.symbol}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-5 text-right font-mono font-bold text-white">
                  $
                  {stock.price.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </td>
                <td
                  className={`px-6 py-5 text-right font-bold text-sm ${stock.change >= 0 ? "text-green-500" : "text-red-500"}`}
                >
                  <span className="flex items-center justify-end gap-1">
                    {stock.change >= 0 ? (
                      <TrendingUp size={14} />
                    ) : (
                      <TrendingDown size={14} />
                    )}
                    {Math.abs(stock.change).toFixed(2)}%
                  </span>
                </td>
                <td className="px-6 py-5 text-right font-mono text-xs text-slate-400 hidden md:table-cell">
                  ${(Math.random() * 500 + 10).toFixed(1)}B
                </td>
                <td className="px-6 py-5 text-right font-mono text-xs text-slate-400 hidden lg:table-cell">
                  ${(Math.random() * 50 + 1).toFixed(1)}M
                </td>
                <td className="px-6 py-5 text-right">
                  <button className="px-4 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-bold hover:bg-primary hover:text-white transition-all">
                    TRADE
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
};
