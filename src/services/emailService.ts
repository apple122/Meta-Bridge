import emailjs from '@emailjs/browser';
import { supabase } from '../lib/supabase';

/**
 * SERVICE: Email Service
 * Handles sending OTPs and Win notifications via EmailJS.
 * Now supports dynamic configuration from Supabase database.
 */

// Fallbacks from .env
const FB_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID || 'service_svw562h';
const FB_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || 'ZAVZJUcl_O9sey-Da';
const FB_TEMPLATE_WIN = import.meta.env.VITE_EMAILJS_TEMPLATE_WIN || 'template_dmuhb44';
const FB_TEMPLATE_OTP = import.meta.env.VITE_EMAILJS_TEMPLATE_OTP || 'template_k27navk';

interface SendOptions {
  email: string;
  code: string;
  userName?: string;
  lang?: "th" | "en";
  type?: 'verification' | 'reset' | 'change_email';
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

/**
 * Helper to fetch latest EmailJS settings from Supabase
 */
const getEmailSettings = async () => {
  try {
    const { data } = await supabase
      .from('global_settings')
      .select('emailjs_public_key, emailjs_service_id, emailjs_template_otp, emailjs_template_win')
      .eq('id', 'main')
      .single();
    
    return {
      publicKey: data?.emailjs_public_key || FB_PUBLIC_KEY,
      serviceId: data?.emailjs_service_id || FB_SERVICE_ID,
      templateOtp: data?.emailjs_template_otp || FB_TEMPLATE_OTP,
      templateWin: data?.emailjs_template_win || FB_TEMPLATE_WIN
    };
  } catch (err) {
    console.warn('[EmailService] Failed to fetch DB settings, using fallbacks:', err);
    return {
      publicKey: FB_PUBLIC_KEY,
      serviceId: FB_SERVICE_ID,
      templateOtp: FB_TEMPLATE_OTP,
      templateWin: FB_TEMPLATE_WIN
    };
  }
};

export const emailService = {
  /**
   * Sends a 6-digit OTP using EmailJS.
   */
  sendOTP: async ({ email, code, lang = "en", userName }: SendOptions): Promise<{ success: boolean; error?: string; data?: any }> => {
    try {
      const settings = await getEmailSettings();
      console.log(`[EmailService] Sending EmailJS OTP for ${email}`);
      const isTh = lang === 'th';
      
      const result = await emailjs.send(
        settings.serviceId,
        settings.templateOtp,
        {
          to_email: email,
          to_name: userName || email.split('@')[0],
          passcode: code,
          email_title: isTh ? "รหัสยืนยันตัวตน" : "Verification Code",
          email_subject: isTh ? "ยืนยันบัญชีของคุณ" : "Verify your account",
          email_greeting: isTh ? "สวัสดี" : "Hi",
          email_body: isTh 
            ? "กรุณาใช้รหัสต่อไปนี้เพื่อยืนยันตัวตนในระบบ Meta Bridge" 
            : "Please use the following code to verify your identity on Meta Bridge.",
          email_otp_label: isTh ? "รหัสยืนยัน (OTP)" : "Verification Code",
          email_expiry: isTh ? "มีอายุการใช้งาน" : "Valid for",
          time: isTh ? "10 นาที" : "10 minutes",
          email_warning: isTh 
            ? "หากคุณไม่ได้ทำรายการนี้ กรุณาเพิกเฉยต่ออีเมลฉบับนี้" 
            : "If you didn't request this, please ignore this email.",
          email_footer_brand: "Meta Bridge",
          email_footer_auto: isTh ? "ข้อความอัตโนมัติ กรุณาอย่าตอบกลับ" : "Automated message, please do not reply."
        },
        settings.publicKey
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
  sendWinNotification: async (options: NotifyWinNotificationOptions): Promise<{ success: boolean; error?: string; data?: any }> => {
    const { email, userName, payout, assetSymbol, lang = "en" } = options;
    try {
      const settings = await getEmailSettings();
      console.log(`[EmailService] Sending EmailJS Win Notification for ${email}`);
      const isTh = lang === 'th';
      
      const result = await emailjs.send(
        settings.serviceId,
        settings.templateWin,
        {
          to_email: email,
          to_name: userName,
          passcode: payout.toLocaleString(),
          email_title: isTh ? "คุณชนะแล้ว!" : "YOU WON!",
          email_subject: isTh ? "ยินดีด้วยกับกำไรของคุณ!" : "Congratulations on your profit!",
          email_greeting: isTh ? "ขอแสดงความยินดี" : "Congratulations",
          email_body: isTh 
            ? `การเทรด ${assetSymbol} ของคุณประสบความสำเร็จ!` 
            : `Your trade for ${assetSymbol} was successful!`,
          email_otp_label: isTh ? "กำไรที่ได้รับ" : "PROFIT EARNED",
          email_credited: isTh ? "เติมเข้ากระเป๋าเงินแล้ว" : "Credited to your balance",
          email_expiry: isTh ? "สินทรัพย์ที่เทรด" : "Asset Traded",
          time: assetSymbol,
          email_warning: isTh 
            ? "คุณสามารถเริ่มเทรดต่อได้ทันทีเพื่อรับกำไรที่มากขึ้น" 
            : "You can start trading again now to earn more profits.",
          email_footer_brand: "Meta Bridge",
          email_footer_auto: isTh ? "ข้อความอัตโนมัติ กรุณาอย่าตอบกลับ" : "Automated message, please do not reply."
        },
        settings.publicKey
      );
      return { success: true, data: result };
    } catch (err: any) {
      console.error(`[EmailService] EmailJS Win Failed:`, err);
      return { success: false, error: err.text || err.message };
    }
  },

  sendDepositNotification: async (_options: any) => ({ success: false, error: "Not implemented" }),
  sendWithdrawNotification: async (_options: any) => ({ success: false, error: "Not implemented" })
};

type NotifyWinNotificationOptions = NotifyWinOptions;
