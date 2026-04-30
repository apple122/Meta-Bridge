import React, { useEffect, useRef, memo, useState } from 'react';
import { Skeleton } from '../shared/Skeleton';

interface TradingViewChartProps {
  symbol: string;
  interval?: string;
}

const TradingViewChart: React.FC<TradingViewChartProps> = ({ symbol, interval = "1" }) => {
  const container = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!container.current) return;
    setIsLoaded(false);

    // Clean up previous widget
    const widgetContainer = container.current.querySelector('.tradingview-widget-container__widget');
    if (widgetContainer) {
      widgetContainer.innerHTML = '';
    }

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;

    // Map internal symbols to TradingView symbols
    const tvSymbol = symbol === 'GOLD' ? 'OANDA:XAUUSD' : 
                     symbol === 'BTC' ? 'BINANCE:BTCUSDT' :
                     symbol === 'ETH' ? 'BINANCE:ETHUSDT' :
                     symbol === 'CART' ? 'NASDAQ:CART' :
                     symbol === 'NVDA' ? 'NASDAQ:NVDA' :
                     symbol === 'AAPL' ? 'NASDAQ:AAPL' :
                     `NASDAQ:${symbol}`;

    script.innerHTML = JSON.stringify({
      "autosize": true,
      "symbol": tvSymbol,
      "interval": interval,
      "timezone": "Etc/UTC",
      "theme": "dark",
      "style": "1",
      "locale": "en",
      "enable_publishing": false,
      "hide_top_toolbar": false,
      "allow_symbol_change": false,
      "calendar": false,
      "hide_volume": false,
      "support_host": "https://www.tradingview.com"
    });

    script.onload = () => {
      // Small delay to let the widget start rendering before removing skeleton
      setTimeout(() => setIsLoaded(true), 1500);
    };

    if (widgetContainer) {
      widgetContainer.appendChild(script);
    }
  }, [symbol, interval]);

  return (
    <div className="tradingview-widget-container h-full w-full rounded-2xl overflow-hidden border border-white/5 shadow-2xl relative" ref={container}>
      {!isLoaded && (
        <div className="absolute inset-0 z-10 bg-slate-950 overflow-hidden">
          {/* Main Shimmer Background */}
          <Skeleton className="w-full h-full rounded-none opacity-40" />
          
          {/* Mock Chart Elements */}
          <div className="absolute inset-0 p-4 md:p-6 flex flex-col justify-between pointer-events-none">
            {/* Grid Lines */}
            <div className="absolute inset-0 grid grid-cols-6 grid-rows-6 opacity-10">
              {[...Array(36)].map((_, i) => (
                <div key={i} className="border-[0.5px] border-white/20" />
              ))}
            </div>

            {/* Mock Chart Line SVG */}
            <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
              <svg className="w-full h-full opacity-20" viewBox="0 0 1000 400" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.5" />
                    <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path
                  d="M0,200 L50,180 L100,220 L150,190 L200,250 L250,210 L300,280 L350,230 L400,260 L450,200 L500,240 L550,180 L600,210 L650,150 L700,190 L750,140 L800,170 L850,120 L900,150 L950,100 L1000,130 L1000,400 L0,400 Z"
                  fill="url(#chartGradient)"
                  className="animate-pulse"
                />
                <path
                  d="M0,200 L50,180 L100,220 L150,190 L200,250 L250,210 L300,280 L350,230 L400,260 L450,200 L500,240 L550,180 L600,210 L650,150 L700,190 L750,140 L800,170 L850,120 L900,150 L950,100 L1000,130"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-primary animate-pulse"
                  strokeDasharray="1000"
                  strokeDashoffset="1000"
                  style={{ animation: 'chartLine 2s ease-out forwards' }}
                />
              </svg>
            </div>

            {/* Price Labels Mockup */}
            <div className="absolute right-2 top-0 bottom-0 flex flex-col justify-around py-4 opacity-20">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} variant="text" width={40} height={10} />
              ))}
            </div>

            {/* Time Labels Mockup */}
            <div className="absolute bottom-2 left-0 right-0 flex justify-around px-12 opacity-20">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} variant="text" width={30} height={8} />
              ))}
            </div>

            {/* Center Loading Indicator */}
            <div className="relative z-20 flex flex-col items-center gap-4 m-auto">
              <div className="w-12 h-12 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
              <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] animate-pulse">Loading Market Data...</p>
            </div>
          </div>
        </div>
      )}
      <div className="tradingview-widget-container__widget h-full w-full"></div>
    </div>
  );
};

export default memo(TradingViewChart);
