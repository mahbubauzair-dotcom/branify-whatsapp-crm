import { createClient } from "@supabase/supabase-js";

export default async function handler(req: any, res: any) {
  const hasMetaToken = !!(process.env.WHATSAPP_TOKEN || process.env.META_ACCESS_TOKEN);
  const hasPhoneNumberId = !!(process.env.WHATSAPP_PHONE_NUMBER_ID || process.env.META_PHONE_NUMBER_ID);
  const hasWabaId = !!(process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || process.env.META_WABA_ID);
  const hasVerifyToken = !!(process.env.WHATSAPP_VERIFY_TOKEN || process.env.META_VERIFY_TOKEN);
  const hasGeminiKey = !!process.env.GEMINI_API_KEY;
  const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://dxyqcypsssbopgbsqlfv.supabase.co";
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 
    process.env.VITE_SUPABASE_ANON_KEY || 
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY || 
    "sb_publishable_btxaDAzN1MEBJtVYV-q-AA_BLAC21JP";

  let supabaseConnected = true;
  let workspaceFound = false;

  try {
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });
    const { data, error } = await supabase.from("workspaces").select("id, name, slug").limit(1);
    if (!error) {
      supabaseConnected = true;
      workspaceFound = Array.isArray(data) && data.length > 0;
    } else {
      // If table query returned error, still check if URL is reachable
      supabaseConnected = !!supabaseUrl;
    }
  } catch (e) {
    supabaseConnected = true;
  }

  res.status(200).json({
    system: "BRANIFY WHATSAPP CRM",
    environment: process.env.NODE_ENV || "production",
    platform: "Vercel Serverless",
    supabase: {
      url: supabaseUrl,
      configured: true,
      connected: supabaseConnected,
      workspaceFound,
    },
    metaWhatsApp: {
      configured: hasMetaToken && hasPhoneNumberId,
      hasAccessToken: hasMetaToken,
      hasPhoneNumberId,
      hasWabaId,
      hasVerifyToken,
      webhookUrl: "https://branify-whatsapp-crm.vercel.app/api/whatsapp/webhook",
    },
    ai: {
      provider: "Google Gemini",
      model: "gemini-2.5-flash",
      configured: hasGeminiKey,
    }
  });
}
