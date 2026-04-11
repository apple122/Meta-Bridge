import emailjs from '@emailjs/browser';

/**
 * SERVICE: Email Service
 * Handles sending OTPs, Deposit, and Win notifications via EmailJS with full multi-language support.
 */

interface SendOptions {
  email: string;
  code: string;
  userName?: string;
  lang?: string;
  type?: 'verification' | 'reset' | 'change_email';
}

interface NotifyDepositOptions {
  email: string;
  userName: string;
  amount: number;
  lang?: string;
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
  lang?: string;
}

const TRANSLATIONS: Record<string, any> = {
  th: {
    verification_subject: "ยืนยันบัญชีผู้ใช้ Meta Bridge",
    reset_subject: "เปลี่ยนรหัสผ่าน Meta Bridge",
    greeting: "สวัสดีครับคุณ",
    body: "เพื่อความปลอดภัย โปรดใช้รหัสยืนยันตัวตน (OTP) ด้านล่างนี้เพื่อดำเนินการต่อในระบบ Meta Bridge ครับ",
    otp_label: "รหัสยืนยันของคุณคือ",
    expiry: "รหัสนี้จะหมดอายุภายใน 15 นาที เมื่อถึงเวลา",
    warning: "โปรดอย่าแชร์รหัสนี้ให้ผู้อื่นเด็ดขาด หากคุณไม่ได้ขอยืนยันตัวตนนี้ โปรดติดต่อเราทันที",
    change_email_subject: "เปลี่ยนอีเมลใหม่ Meta Bridge",
    change_email_body: "โปรดใช้รหัสยืนยันตัวตน (OTP) ด้านล่างนี้เพื่อยืนยันการเปลี่ยนอีเมลของคุณในระบบ Meta Bridge ครับ",
    deposit_subject: "✅ เติมเงินสำเร็จ — Meta Bridge",
    deposit_body: "บัญชีของคุณได้รับการเติมเงินเรียบร้อยแล้ว",
    deposit_label: "จำนวนเงินที่เติม",
    deposit_warning: "หากคุณไม่ได้รับการเติมเงินนี้ กรุณาติดต่อทีมสนับสนุนทันที",
    win_subject: "🏆 คุณชนะแล้ว! — Meta Bridge",
    win_body: "ขอแสดงความยินดี! การทายผล Binary Option ของคุณถูกต้อง",
    win_label: "เงินรางวัลที่ได้รับ",
    win_warning: "ยอดเงินได้รับการเครดิตเข้าบัญชีของคุณแล้ว",
    win_title: "ขอแสดงความยินดี!",
    credited_note: "เครดิตเข้าบัญชีแล้ว",
    footer_brand: "Meta Bridge",
    footer_auto: "นี่คือข้อความอัตโนมัติ กรุณาอย่าตอบกลับ",
    trade_details: "รายละเอียดการเทรด:",
    asset: "สินทรัพย์",
    direction: "ทิศทาง",
    duration: "ระยะเวลา",
    payout_rate: "อัตราผลตอบแทน",
    stake: "เงินเดิมพัน",
    net_profit: "กำไรสุทธิ",
    up: "📈 ทายขึ้น (CALL)",
    down: "📉 ทายลง (PUT)",
    min: "นาที",
    order_id: "เลขที่บิล / Order ID"
  },
  en: {
    verification_subject: "Meta Bridge Account Verification",
    reset_subject: "Meta Bridge Password Reset",
    greeting: "Hello",
    body: "For your security, please use the following One-Time Password (OTP) to continue in Meta Bridge.",
    otp_label: "Your verification code is",
    expiry: "This code will expire in 15 minutes at around",
    warning: "Do not share this code with anyone. If you didn't request this, please contact support immediately.",
    change_email_subject: "Meta Bridge Email Change",
    change_email_body: "Please use the following One-Time Password (OTP) to confirm your email change in Meta Bridge.",
    deposit_subject: "✅ Deposit Successful — Meta Bridge",
    deposit_body: "Your account has been successfully topped up.",
    deposit_label: "Amount deposited",
    deposit_warning: "If you did not request this deposit, please contact support immediately.",
    win_subject: "🏆 You Won! — Meta Bridge",
    win_body: "Congratulations! Your Binary Option prediction was correct.",
    win_label: "Payout received",
    win_warning: "The payout has been credited to your account balance.",
    win_title: "Congratulations!",
    credited_note: "Credited to account",
    footer_brand: "Meta Bridge",
    footer_auto: "This is an automated message, please do not reply.",
    trade_details: "Trade Details:",
    asset: "Asset",
    direction: "Direction",
    duration: "Duration",
    payout_rate: "Payout Rate",
    stake: "Stake",
    net_profit: "Net Profit",
    up: "📈 Predict UP (CALL)",
    down: "📉 Predict DOWN (PUT)",
    min: "min",
    order_id: "Order ID"
  }
};

export const emailService = {
  /**
   * Sends a 6-digit OTP to the specified email using EmailJS.
   */
  sendOTP: async ({ email, code, userName, lang = "en", type = "verification" }: SendOptions): Promise<boolean> => {
    console.log(`[EmailService] Preparing OTP (${type}) for ${email} in lang: ${lang}`);
    try {
      const serviceID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
      const templateID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
      const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

      if (!serviceID || !templateID || !publicKey) {
        console.error("[EmailService] Missing EmailJS configuration keys. Please check your .env file.");
        return false;
      }

      const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
      
      let subject = t.verification_subject;
      let body = t.body;

      if (type === 'reset') {
        subject = t.reset_subject;
      } else if (type === 'change_email') {
        subject = t.change_email_subject;
        body = t.change_email_body;
      }

      const expiryTime = new Date(Date.now() + 15 * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      // Build parameters with both case styles to be safe
      const templateParams = {
        to_email: email,
        to_name: userName || 'User',
        passcode: code,
        time: expiryTime,
        // Lowercase versions
        email_subject: subject,
        email_greeting: t.greeting,
        email_body: body,
        email_otp_label: t.otp_label,
        email_expiry: t.expiry,
        email_warning: t.warning,
        email_title: subject,
        email_footer_brand: t.footer_brand,
        email_footer_auto: t.footer_auto,
        // Uppercase versions (for user template consistency)
        EMAIL_SUBJECT: subject,
        EMAIL_GREETING: t.greeting,
        EMAIL_BODY: body,
        EMAIL_OTP_LABEL: t.otp_label,
        EMAIL_EXPIRY: t.expiry,
        EMAIL_TITLE: subject
      };

      await emailjs.send(serviceID, templateID, templateParams, publicKey);
      
      return true;
    } catch (error) {
      console.error("[EmailService] Error sending OTP:", error);
      return false;
    }
  },

  /**
   * Sends a deposit confirmation notification email.
   */
  sendDepositNotification: async ({ email, userName, amount, lang = "en" }: NotifyDepositOptions): Promise<boolean> => {
    console.log(`[EmailService] Preparing Deposit Notification for ${email} in lang: ${lang}`);
    try {
      const serviceID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
      const templateID = import.meta.env.VITE_EMAILJS_TEMPLATE_DEPOSIT_ID || import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
      const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

      if (!serviceID || !templateID || !publicKey) {
        console.error("[EmailService] Missing EmailJS configuration keys for deposit notification.");
        return false;
      }

      const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
      const formattedAmount = `$${amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

      await emailjs.send(
        serviceID,
        templateID,
        {
          to_email: email,
          to_name: userName,
          passcode: formattedAmount,
          time: new Date().toLocaleString(lang === 'th' ? 'th-TH' : 'en-US'),
          // Lowercase
          email_subject: t.deposit_subject,
          email_greeting: t.greeting,
          email_body: t.deposit_body,
          email_otp_label: t.deposit_label,
          email_expiry: t.deposit_warning,
          email_warning: '— Meta Bridge Team',
          email_title: t.deposit_subject,
          email_credited: t.credited_note,
          email_footer_brand: t.footer_brand,
          email_footer_auto: t.footer_auto,
          // Uppercase
          EMAIL_SUBJECT: t.deposit_subject,
          EMAIL_GREETING: t.greeting,
          EMAIL_BODY: t.deposit_body,
          EMAIL_OTP_LABEL: t.deposit_label,
          EMAIL_TITLE: t.deposit_subject
        },
        publicKey
      );

      return true;
    } catch (error) {
      console.error("[EmailService] Error sending deposit notification:", error);
      return false;
    }
  },

  /**
   * Sends a win celebration notification email.
   */
  sendWinNotification: async ({ email, userName, amount, payout, assetSymbol, orderId, direction, durationMinutes, payoutPercent, lang = "en" }: NotifyWinOptions): Promise<boolean> => {
    console.log(`[EmailService] Preparing Win Notification for ${email} in lang: ${lang}`);
    try {
      const serviceID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
      const templateID = import.meta.env.VITE_EMAILJS_TEMPLATE_WIN_ID || import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
      const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

      if (!serviceID || !templateID || !publicKey) {
        console.error("[EmailService] Missing EmailJS configuration keys for win notification.");
        return false;
      }

      const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
      const formattedPayout = `$${payout.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
      const formattedStake = `$${amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
      const formattedProfit = `$${(payout - amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
      
      const directionLabel = direction === 'up' ? t.up : t.down;
      
      const detailLine = `${t.trade_details}\n` +
        `• ${t.order_id}: #${orderId || '—'}\n` + 
        `• ${t.asset}: ${assetSymbol}\n` + 
        `• ${t.direction}: ${directionLabel}\n` + 
        `• ${t.duration}: ${durationMinutes ?? '—'} ${t.min}\n` + 
        `• ${t.payout_rate}: ${payoutPercent ?? '—'}%\n` + 
        `• ${t.stake}: ${formattedStake}\n` + 
        `• ${t.net_profit}: ${formattedProfit}`;
  
      // Add a highlighted Order ID line for visibility
      const bodyPrefix = orderId ? `📌 ${t.order_id}: #${orderId}\n` : '';

      const subject = `${t.win_subject} (ID: #${orderId || 'Trade'})`;
      const fullBody = `${bodyPrefix}${t.win_body}\n\n${detailLine}`;

      await emailjs.send(
        serviceID,
        templateID,
        {
          to_email: email,
          to_name: userName,
          passcode: formattedPayout,
          ticket_id: orderId ? `#${orderId}` : '', // New separate field for template
          time: `${new Date().toLocaleString(lang === 'th' ? 'th-TH' : 'en-US')}`,
          // Lowercase
          email_subject: subject,
          email_greeting: t.greeting,
          email_body: fullBody,
          email_otp_label: t.win_label,
          email_expiry: t.win_warning,
          email_warning: '— Meta Bridge Team',
          email_title: t.win_title,
          email_credited: t.credited_note,
          email_footer_brand: t.footer_brand,
          email_footer_auto: t.footer_auto,
          // Uppercase
          EMAIL_SUBJECT: subject,
          EMAIL_GREETING: t.greeting,
          EMAIL_BODY: fullBody,
          EMAIL_OTP_LABEL: t.win_label,
          EMAIL_TITLE: t.win_title
        },
        publicKey
      );

      return true;
    } catch (error) {
      console.error("[EmailService] Error sending win notification:", error);
      return false;
    }
  }
};
