import { supabase } from '../lib/supabase';

/**
 * SERVICE: Email Service
 * Handles sending OTPs, Deposit, and Win notifications via Resend (via Supabase Edge Functions).
 */

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
   * Invokes the backend Edge Function to send an email.
   */
  invokeSendEmail: async (to: string, type: string, data: any, lang: string = "en"): Promise<{ success: boolean; error?: string; data?: any }> => {
    try {
      const { data: resData, error } = await supabase.functions.invoke("send-email", {
        body: { to, type, data, lang },
      });
      
      if (error) {
        console.error(`[EmailService] Edge Function Error (${type}):`, error);
        let errorMsg = "Failed to send email via Supabase.";
        if (typeof error === 'object' && error !== null) {
          errorMsg = (error as any).message || JSON.stringify(error);
        }
        return { success: false, error: errorMsg };
      }

      // If the edge function itself returns an error body
      if (resData && resData.error) {
        return { success: false, error: resData.error };
      }

      console.log(`[EmailService] Success response from Brevo:`, resData);
      return { success: true, data: resData };
    } catch (err: any) {
      console.error(`[EmailService] Invocation Failed (${type}):`, err);
      return { success: false, error: err.message || "Unknown connection error" };
    }
  },

  /**
   * Sends a 6-digit OTP using Resend.
   */
  sendOTP: async ({ email, code, lang = "en", type = "verification", userName }: SendOptions): Promise<{ success: boolean; error?: string; data?: any }> => {
    console.log(`[EmailService] Requesting Brevo OTP (${type}) for ${email}`);
    return emailService.invokeSendEmail(email, "otp", { code, type, userName }, lang);
  },

  /**
   * Sends a deposit confirmation notification email.
   */
  sendDepositNotification: async ({ email, amount, lang = "en", userName }: NotifyDepositOptions): Promise<{ success: boolean; error?: string; data?: any }> => {
    console.log(`[EmailService] Requesting Brevo Deposit for ${email}`);
    return emailService.invokeSendEmail(email, "deposit", { amount, userName }, lang);
  },

  /**
   * Sends a withdrawal confirmation notification email.
   */
  sendWithdrawNotification: async ({ email, amount, lang = "en", userName }: NotifyWithdrawOptions): Promise<{ success: boolean; error?: string; data?: any }> => {
    console.log(`[EmailService] Requesting Brevo Withdrawal for ${email}`);
    return emailService.invokeSendEmail(email, "withdraw", { amount, userName }, lang);
  },

  /**
   * Sends a win celebration notification email.
   */
  sendWinNotification: async (options: NotifyWinOptions): Promise<{ success: boolean; error?: string; data?: any }> => {
    const { email, lang = "en" } = options;
    console.log(`[EmailService] Requesting Brevo Win for ${email}`);
    return emailService.invokeSendEmail(email, "win", options, lang);
  }
};
