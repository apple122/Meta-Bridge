import React, { useEffect, useRef, memo } from 'react';

interface TradingViewChartProps {
  symbol: string;
  interval?: string;
}

const TradingViewChart: React.FC<TradingViewChartProps> = ({ symbol, interval = "1" }) => {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!container.current) return;

    // Clean up previous widget
    container.current.innerHTML = '';

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

    container.current.appendChild(script);
  }, [symbol, interval]);

  return (
    <div className="tradingview-widget-container h-full w-full rounded-2xl overflow-hidden border border-white/5 shadow-2xl" ref={container}>
      <div className="tradingview-widget-container__widget h-full w-full"></div>
    </div>
  );
};

export default memo(TradingViewChart);
