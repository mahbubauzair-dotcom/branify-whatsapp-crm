import { createClient } from "@supabase/supabase-js";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { conversationId, contactWaId, body, type = "text", template } = req.body || {};

    if (!contactWaId || (!body && !template)) {
      return res.status(400).json({ error: "Recipient phone number and message body or template are required." });
    }

    const accessToken = (process.env.WHATSAPP_TOKEN || process.env.META_ACCESS_TOKEN)?.trim() ||
      "EAAZA8aiSODZCYBSe0bwYfrq0pFj2VgRCMmIDHFpKsAZA0tc2qM9PR7gEZBcG5j10ZCLxO6SZAfSl9ZAcVbDirlYUPiZBey0Rrk2m5evdv79B7e8WUvkiESK1NI8H2S1qoZCNGkaYJl4DEsc8MLuA9GdUZAC0af1CnyphekveowpzIPxK40x7sHq23UlpbZBeB383AZDZD";
    const phoneNumberId = (process.env.WHATSAPP_PHONE_NUMBER_ID || process.env.META_PHONE_NUMBER_ID)?.trim() || "1284140121445758";
    const apiVersion = process.env.META_GRAPH_API_VERSION || "v21.0";

    // Clean recipient phone number (strip + and spaces)
    const cleanTo = String(contactWaId).replace(/\D/g, "");

    const bodyPayload: any = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: cleanTo,
      type: type,
    };

    if (type === "text" && body) {
      bodyPayload.text = { body };
    } else if (type === "template" && template) {
      bodyPayload.template = template;
    }

    let metaMessageId: string | null = null;
    let sendStatus: "sent" | "failed" = "sent";
    let metaError: string | null = null;
    let rawMetaResponse: any = null;

    try {
      const metaUrl = `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`;
      const metaRes = await fetch(metaUrl, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bodyPayload),
      });

      rawMetaResponse = await metaRes.json();

      if (!metaRes.ok) {
        sendStatus = "failed";
        metaError = rawMetaResponse?.error?.message || `Meta API Error (${metaRes.status})`;
      } else {
        metaMessageId = rawMetaResponse?.messages?.[0]?.id || null;
      }
    } catch (netErr: any) {
      sendStatus = "failed";
      metaError = netErr.message || "Failed to reach Meta WhatsApp Cloud API.";
    }

    // Save message to Supabase
    let savedMsg: any = null;
    try {
      const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://dxyqcypsssbopgbsqlfv.supabase.co";
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 
        process.env.VITE_SUPABASE_ANON_KEY || 
        process.env.VITE_SUPABASE_PUBLISHABLE_KEY || 
        "sb_publishable_btxaDAzN1MEBJtVYV-q-AA_BLAC21JP";

      const supabase = createClient(supabaseUrl, supabaseKey, {
        auth: { persistSession: false, autoRefreshToken: false }
      });

      const { data: ws } = await supabase
        .from("workspaces")
        .select("id")
        .eq("slug", "branify")
        .limit(1)
        .single();

      const workspaceId = ws?.id;

      if (workspaceId && conversationId) {
        const { data: inserted } = await supabase
          .from("messages")
          .insert({
            workspace_id: workspaceId,
            conversation_id: conversationId,
            meta_message_id: metaMessageId,
            sender_type: "agent",
            message_type: type,
            body: body || (template ? `[Template: ${template.name}]` : ""),
            status: sendStatus,
            error_details: metaError ? { error: metaError, raw: rawMetaResponse } : null,
          })
          .select()
          .single();

        savedMsg = inserted;

        await supabase
          .from("conversations")
          .update({ last_message_at: new Date().toISOString() })
          .eq("id", conversationId);
      }
    } catch (dbErr) {
      console.warn("Supabase record insert warning:", dbErr);
    }

    if (sendStatus === "failed") {
      return res.status(502).json({
        error: metaError,
        details: rawMetaResponse,
        message: savedMsg,
      });
    }

    return res.status(200).json({
      success: true,
      metaMessageId,
      message: savedMsg,
      raw: rawMetaResponse,
    });
  } catch (err: any) {
    console.error("[Send Handler Error]:", err);
    return res.status(500).json({ error: err.message || "Failed to process message send." });
  }
}
