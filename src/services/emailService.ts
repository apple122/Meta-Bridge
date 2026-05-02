import emailjs from '@emailjs/browser';

/**
 * SERVICE: Email Service
 * Handles sending OTPs and Win notifications via EmailJS.
 */

const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID || 'service_svw562h';
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || 'ZAVZJUcl_O9sey-Da';
const TEMPLATE_WIN = import.meta.env.VITE_EMAILJS_TEMPLATE_WIN || 'template_dmuhb44';
const TEMPLATE_OTP = import.meta.env.VITE_EMAILJS_TEMPLATE_OTP || 'template_k27navk';

interface SendOptions {
  email: string;
  code: string;
  userName?: string;
  lang?: "th" | "en";
  type?: 'verification' | 'reset' | 'change_email';
}

interface NotifyDepositOptions {
  email: string;
  userName: string;
  amount: number;
  lang?: "th" | "en";
}

interface NotifyWithdrawOptions {
  email: string;
  userName: string;
  amount: number;
  lang?: "th" | "en";
}

interface NotifyWinOptions {
  email: string;
  userName: string;
  amount: number;
  payout: number;
  assetSymbol: string;
  orderId?: string;
  direction?: 'up' | 'down';
  durationMinutes?: number;
  payoutPercent?: number;
  lang?: "th" | "en";
}

export const emailService = {
  /**
   * Sends a 6-digit OTP using EmailJS.
   */
  sendOTP: async ({ email, code, lang = "en", type = "verification", userName }: SendOptions): Promise<{ success: boolean; error?: string; data?: any }> => {
    try {
      console.log(`[EmailService] Sending EmailJS OTP for ${email}`);
      const result = await emailjs.send(
        SERVICE_ID,
        TEMPLATE_OTP,
        {
          to_email: email,
          user_name: userName || email.split('@')[0],
          otp_code: code,
          type: type,
          lang: lang
        },
        PUBLIC_KEY
      );
      return { success: true, data: result };
    } catch (err: any) {
      console.error(`[EmailService] EmailJS OTP Failed:`, err);
      return { success: false, error: err.text || err.message };
    }
  },

  /**
   * Sends a win celebration notification email using EmailJS.
   */
  sendWinNotification: async (options: NotifyWinOptions): Promise<{ success: boolean; error?: string; data?: any }> => {
    const { email, userName, amount, payout, assetSymbol, lang = "en" } = options;
    try {
      console.log(`[EmailService] Sending EmailJS Win Notification for ${email}`);
      const result = await emailjs.send(
        SERVICE_ID,
        TEMPLATE_WIN,
        {
          to_email: email,
          user_name: userName,
          amount: amount.toLocaleString(),
          payout: payout.toLocaleString(),
          asset_symbol: assetSymbol,
          lang: lang
        },
        PUBLIC_KEY
      );
      return { success: true, data: result };
    } catch (err: any) {
      console.error(`[EmailService] EmailJS Win Failed:`, err);
      return { success: false, error: err.text || err.message };
    }
  },

  /**
   * Sends a deposit confirmation (Placeholder if template not provided).
   */
  sendDepositNotification: async (_options: NotifyDepositOptions): Promise<{ success: boolean; error?: string; data?: any }> => {
    console.warn(`[EmailService] Deposit notification not yet implemented for EmailJS. Missing template.`);
    return { success: false, error: "Deposit template not configured" };
  },

  /**
   * Sends a withdrawal confirmation (Placeholder if template not provided).
   */
  sendWithdrawNotification: async (_options: NotifyWithdrawOptions): Promise<{ success: boolean; error?: string; data?: any }> => {
    console.warn(`[EmailService] Withdrawal notification not yet implemented for EmailJS. Missing template.`);
    return { success: false, error: "Withdrawal template not configured" };
  }
};
