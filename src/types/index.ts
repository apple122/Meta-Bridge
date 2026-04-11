export interface Profile {
  id: string;
  username: string;
  full_name: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  balance: number;
  is_admin: boolean;
  code: string;
  email: string;
  password?: string;
  address?: string;
  kyc_status?: string;
  bank_network?: string;
  bank_account?: string;
  bank_name?: string;
  otp_code?: string;
  otp_expires_at?: string;
  is_verified?: boolean;
}

export interface GlobalSettings {
  id?: string;
  contact_phone: string;
  contact_line: string;
  contact_telegram: string;
}

export type TransactionType = "buy" | "sell" | "deposit" | "withdraw" | "win" | "loss";

export interface Transaction {
  id: string;
  type: TransactionType;
  asset: string;
  amount: number;
  price: number;
  total: number;
  timestamp: string;
  status: "success" | "pending" | "failed";
  binary_type?: "up" | "down";
  binary_result?: "win" | "loss";
  trade_id?: string;
  smart_id?: string;
}

export interface BinaryTrade {
  id: string;
  type: "up" | "down";
  assetSymbol: string;
  amount: number;
  entryPrice: number;
  payoutPercent: number;
  startTime: number;
  expiryTime: number;
  status: "active" | "won" | "lost";
}

export type ModalType = "deposit" | "withdraw" | "staking" | null;
