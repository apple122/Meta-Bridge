import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

// Declare Deno to prevent TypeScript errors in the editor (since this is a Deno environment)
declare const Deno: any;

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const FINNHUB_API_KEY = Deno.env.get("FINNHUB_API_KEY") ?? "";
const EMAILJS_SERVICE_ID = Deno.env.get("EMAILJS_SERVICE_ID") ?? "";
const EMAILJS_PUBLIC_KEY = Deno.env.get("EMAILJS_PUBLIC_KEY") ?? "";
const EMAILJS_PRIVATE_KEY = Deno.env.get("EMAILJS_PRIVATE_KEY") ?? "";
const EMAILJS_TEMPLATE_WIN_ID = Deno.env.get("EMAILJS_TEMPLATE_WIN_ID") ?? "";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const TRANSLATIONS: Record<string, any> = {
  th: {
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
    order_id: "เลขที่บิล / Order ID",
    greeting: "สวัสดีครับคุณ"
  },
  en: {
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
    order_id: "Order ID",
    greeting: "Hello"
  }
};

async function fetchPrice(symbol: string): Promise<number | null> {
  const cryptoSymbols = ["BTC", "ETH", "USDT", "BNB", "SOL", "DOGE"];
  if (cryptoSymbols.includes(symbol)) {
    if (symbol === "USDT") return 1.0;
    try {
      const response = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}USDT`);
      const data = await response.json();
      return parseFloat(data.price);
    } catch {
      return null;
    }
  } else if (symbol === "GOLD") {
    try {
      const response = await fetch(`https://api.gold-api.com/price/XAU`);
      const data = await response.json();
      return data.price;
    } catch {
      return null;
    }
  } else {
    if (!FINNHUB_API_KEY) return null;
    try {
      const response = await fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`);
      if (!response.ok) return null;
      const data = await response.json();
      return data.c > 0 ? data.c : null;
    } catch {
      return null;
    }
  }
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  async function sendWinEmail(trade: any, profile: any) {
    const email = profile?.email;
    if (!email) {
      console.error(`Cannot send email: No email provided`);
      return;
    }
  
    const userName = profile?.first_name 
      ? `${profile.first_name} ${profile.last_name || ''}`.trim() 
      : 'Trader';
    
    // Support multi-language if available
    const lang = profile?.language || 'en';
    const t = TRANSLATIONS[lang] || TRANSLATIONS['en'];

    const amount = Number(trade.amount);
    const payoutPercent = Number(trade.payout_percent);
    const payout = amount + (amount * payoutPercent) / 100;
    const orderId = trade.id.slice(-4).toUpperCase();
    
    const formattedPayout = `$${payout.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    const formattedStake = `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    const formattedProfit = `$${(payout - amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    const directionLabel = trade.type === 'up' ? t.up : t.down;
    
    const detailLine = `${t.trade_details}\n` +
      `• ${t.order_id}: #${orderId}\n` + 
      `• ${t.asset}: ${trade.asset_symbol}\n` + 
      `• ${t.direction}: ${directionLabel}\n` + 
      `• ${t.duration}: ${t.min || "-"} นาที\n` + 
      `• ${t.payout_rate}: ${payoutPercent}%\n` + 
      `• ${t.stake}: ${formattedStake}\n` + 
      `• ${t.net_profit}: ${formattedProfit}`;
  
    const bodyPrefix = `📌 ${t.order_id}: #${orderId}\n`;
  
    const payload = {
      service_id: EMAILJS_SERVICE_ID,
      template_id: EMAILJS_TEMPLATE_WIN_ID,
      user_id: EMAILJS_PUBLIC_KEY,
      accessToken: EMAILJS_PRIVATE_KEY, // REQUIRED for backend HTTP requests
      template_params: {
        to_email: email,
        to_name: userName,
        passcode: formattedPayout,
        ticket_id: `#${orderId}`,
        time: `${new Date().toLocaleString(lang === 'th' ? 'th-TH' : 'en-US')}`,
        email_subject: `${t.win_subject} (ID: #${orderId})`,
        email_greeting: t.greeting,
        email_body: `${bodyPrefix}${t.win_body}\n\n${detailLine}`,
        email_otp_label: t.win_label,
        email_expiry: t.win_warning,
        email_warning: '— Meta Bridge Team',
        email_title: t.win_title,
        email_credited: t.credited_note,
        email_footer_brand: t.footer_brand,
        email_footer_auto: t.footer_auto
      }
    };
  
    try {
      console.log(`Sending payload to EmailJS for ${email}...`);
      const res = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const errText = await res.text();
        console.error(`EmailJS failed for ${orderId}:`, errText);
      } else {
        console.log(`✅ Win email successfully sent for trade ${orderId} (to ${email})`);
      }
    } catch (err) {
      console.error(`🚨 Error sending win email for ${trade?.id}:`, err);
    }
  }

  try {
    const now = Date.now();
    console.log(`[${new Date().toISOString()}] Starting trade resolution...`);
    // 1. Fetch pending trades that have expired
    const { data: expiredTrades, error: fetchErr } = await supabase
      .from("binary_trades")
      .select("*")
      .eq("status", "pending")
      .lte("expiry_time", now);
      
    if (fetchErr) throw fetchErr;
    
    if (!expiredTrades || expiredTrades.length === 0) {
      return new Response(JSON.stringify({ message: "No expired trades to process." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`FOUND ${expiredTrades.length} expired trades. Processing...`);
    let processedCount = 0;

    for (const trade of expiredTrades) {
      const currentPrice = await fetchPrice(trade.asset_symbol);
      
      if (currentPrice === null) {
        const expiredMinutes = (now - Number(trade.expiry_time)) / 60000;
        if (expiredMinutes > 5) {
          console.log(`Trade ${trade.id} has been expired for ${Math.round(expiredMinutes)} min but price is still null. Refunding to protect user funds.`);
          const { data: refundRes, error: refundErr } = await supabase.rpc('refund_binary_trade', {
            p_trade_id: trade.id
          });
          if (refundErr) console.error(`Failed to refund trade ${trade.id}:`, refundErr);
          else console.log(`✅ Trade ${trade.id} refunded successfully.`);
        } else {
          console.warn(`Could not fetch price for ${trade.asset_symbol}, will retry in next cycle.`);
        }
        continue;
      }
      
      let won = false;
      if (trade.type === "up" && currentPrice > trade.entry_price) won = true;
      if (trade.type === "down" && currentPrice < trade.entry_price) won = true;

      const payout = won
        ? trade.amount + (trade.amount * trade.payout_percent) / 100
        : 0;
      const tradeStatus = won ? "won" : "lost";

      // 2. Call RPC to settle securely
      const { data: rpcRes, error: rpcErr } = await supabase.rpc('resolve_binary_trade', {
        p_trade_id: trade.id,
        p_new_status: tradeStatus,
        p_result_price: currentPrice,
        p_payout_amount: payout
      });

      if (rpcErr || !rpcRes?.success) {
        console.error(`Failed to resolve trade ${trade.id}:`, rpcErr || rpcRes);
        continue;
      }

      processedCount++;

      // 3. Send email if Won
      if (won) {
        console.log(`Trade ${trade.id} WON! Preparing to send email...`);
        const { data: profile, error: profileErr } = await supabase
          .from("profiles")
          .select("email, first_name, last_name, id")  // Removed non-existent language column
          .eq("id", trade.user_id)
          .single();
          
        if (profileErr) console.warn(`Profile fetch error/warning: ${profileErr.message}`);
          
        let targetProfile = profile;
        if (!targetProfile?.email) {
            console.log(`Profile email missing, checking auth data...`);
            // Also need to fetch user auth email if missing
            const { data: authData, error: authErr } = await supabase.auth.admin.getUserById(trade.user_id);
            if (authErr) console.error(`Auth data fetch error: ${authErr.message}`);
            
            if (authData?.user) {
              targetProfile = { ...targetProfile, email: authData.user.email };
            }
        }
        
        if (targetProfile?.email) {
          console.log(`Found email address: ${targetProfile.email}. Sending to EmailJS...`);
          await sendWinEmail(trade, targetProfile);
        } else {
          console.error(`Cannot send email for ${trade.id}: No email address found for user ${trade.user_id}`);
        }
      } else {
        console.log(`Trade ${trade.id} LOST. Skipping email.`);
      }
    }

    console.log(`Done. Successfully processed ${processedCount} trades.`);

    return new Response(
      JSON.stringify({ message: `Successfully processed ${processedCount} trades.` }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Edge function fatal error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
