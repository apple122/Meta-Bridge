/**
 * Trading Logic Utility Functions
 */

export const getAssetCategory = (symbol: string): string => {
  const cryptoAssets = ["BTC", "ETH", "USDT", "BNB", "SOL", "DOGE"];
  const commodityAssets = ["GOLD", "SILVER"];
  
  if (cryptoAssets.includes(symbol)) return "crypto";
  if (commodityAssets.includes(symbol)) return "commodity";
  return "stock";
};

export const getInitialTradeSymbol = (locationState: any): string => {
  if (locationState?.symbol) {
    localStorage.setItem("lastTradeSymbol", locationState.symbol);
    return locationState.symbol;
  }
  return localStorage.getItem("lastTradeSymbol") || "BTC";
};

export const calculateProfit = (amount: number, payoutPercent: number): number => {
  return amount * (payoutPercent / 100);
};

export const getTransactionTypeLabel = (type: string, hasAsset: boolean = true): string => {
  if (!hasAsset) return type.toUpperCase();
  
  switch (type) {
    case 'deposit': return 'WIN';
    case 'withdraw': return 'LOSS';
    case 'buy': return 'BUY';
    case 'sell': return 'SELL';
    default: return type.toUpperCase();
  }
};
