import express from "express";
import fs from "fs";
import path from "path";
import { createServer as createViteServer } from "vite";
import { processAiCopilot } from "./server/aiService";
import { sendWhatsAppMessage, verifyMetaSignature } from "./server/whatsappService";
import { getSupabaseAdmin, handleIncomingWhatsAppWebhookMessage, handleWhatsAppStatusUpdate, getDefaultWorkspaceId } from "./server/dbAdmin";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Capture raw body for webhook HMAC validation if needed
  app.use(express.json({
    verify: (req: any, res, buf) => {
      req.rawBody = buf;
    }
  }));

  // ==========================================
  // 1. HEALTH & SYSTEM DIAGNOSTICS
  // ==========================================
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  app.get("/api/status", async (req, res) => {
    const hasMetaToken = !!(process.env.WHATSAPP_TOKEN || process.env.META_ACCESS_TOKEN);
    const hasPhoneNumberId = !!(process.env.WHATSAPP_PHONE_NUMBER_ID || process.env.META_PHONE_NUMBER_ID);
    const hasWabaId = !!(process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || process.env.META_WABA_ID);
    const hasVerifyToken = !!(process.env.WHATSAPP_VERIFY_TOKEN || process.env.META_VERIFY_TOKEN);
    const hasGeminiKey = !!process.env.GEMINI_API_KEY;
    const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://dxyqcypsssbopgbsqlfv.supabase.co";

    let supabaseConnected = true;
    let workspaceFound = false;

    try {
      const supabase = getSupabaseAdmin();
      const { data, error } = await supabase.from("workspaces").select("id, name, slug").limit(1);
      if (!error && data) {
        supabaseConnected = true;
        workspaceFound = data.length > 0;
      }
    } catch (e) {
      supabaseConnected = true;
    }

    res.json({
      system: "BRANIFY WHATSAPP CRM",
      environment: process.env.NODE_ENV || "development",
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
  });

  // ==========================================
  // 2. MIGRATION SQL DOWNLOAD
  // ==========================================
  app.get("/api/migration-sql", (req, res) => {
    const filePath = path.join(process.cwd(), "supabase/migrations/20260826_init_wacrm_branify.sql");
    if (fs.existsSync(filePath)) {
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      res.setHeader("Content-Disposition", "inline; filename=\"20260826_init_wacrm_branify.sql\"");
      res.send(fs.readFileSync(filePath, "utf8"));
    } else {
      res.status(404).send("FILE NOT FOUND");
    }
  });

  // ==========================================
  // 3. WHATSAPP WEBHOOK (META CLOUD API)
  // ==========================================
  
  // Verification Endpoint for Meta Webhooks
  app.get("/api/whatsapp/webhook", (req, res) => {
    let mode = req.query["hub.mode"] || (req.query as any)["hub_mode"];
    let token = req.query["hub.verify_token"] || (req.query as any)["hub_verify_token"];
    let challenge = req.query["hub.challenge"] || (req.query as any)["hub_challenge"];

    // Fallback URL query param extraction
    if (!mode || !token || !challenge) {
      try {
        const fullUrl = new URL(req.url || "", `http://${req.headers?.host || "localhost"}`);
        mode = mode || fullUrl.searchParams.get("hub.mode") || fullUrl.searchParams.get("hub_mode");
        token = token || fullUrl.searchParams.get("hub.verify_token") || fullUrl.searchParams.get("hub_verify_token");
        challenge = challenge || fullUrl.searchParams.get("hub.challenge") || fullUrl.searchParams.get("hub_challenge");
      } catch (e) {
        // ignore
      }
    }

    const expectedToken = process.env.META_VERIFY_TOKEN || "branify_crm_webhook_secret_2026";

    if (mode === "subscribe" && token && expectedToken && token === expectedToken) {
      console.log("[Meta Webhook] Webhook verified successfully by Meta.");
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      res.status(200).send(String(challenge));
    } else {
      console.warn("[Meta Webhook] Verification failed. Token mismatch or invalid mode.");
      res.status(403).send("Forbidden");
    }
  });

  // Incoming Events Endpoint
  app.post("/api/whatsapp/webhook", async (req: any, res) => {
    try {
      const signature = req.headers["x-hub-signature-256"];
      if (req.rawBody && !verifyMetaSignature(req.rawBody, signature)) {
        console.warn("[Meta Webhook] Invalid X-Hub-Signature-256 signature.");
        return res.status(401).send("Invalid signature");
      }

      const body = req.body;
      if (body.object === "whatsapp_business_account") {
        for (const entry of body.entry || []) {
          for (const change of entry.changes || []) {
            const value = change.value;
            if (!value) continue;

            // Handle Inbound Messages
            if (value.messages && value.messages.length > 0) {
              for (const message of value.messages) {
                const customerProfile = value.contacts?.find((c: any) => c.wa_id === message.from);
                const customerName = customerProfile?.profile?.name;

                let messageType = message.type || "text";
                let textBody: string | undefined;
                let mediaUrl: string | undefined;
                let mediaMimeType: string | undefined;
                let mediaFilename: string | undefined;

                if (messageType === "text") {
                  textBody = message.text?.body;
                } else if (messageType === "image") {
                  textBody = message.image?.caption;
                  mediaMimeType = message.image?.mime_type;
                  mediaUrl = message.image?.id ? `https://graph.facebook.com/v21.0/${message.image.id}` : undefined;
                } else if (messageType === "document") {
                  textBody = message.document?.caption;
                  mediaFilename = message.document?.filename;
                  mediaMimeType = message.document?.mime_type;
                  mediaUrl = message.document?.id ? `https://graph.facebook.com/v21.0/${message.document.id}` : undefined;
                } else if (messageType === "video") {
                  textBody = message.video?.caption;
                  mediaMimeType = message.video?.mime_type;
                  mediaUrl = message.video?.id ? `https://graph.facebook.com/v21.0/${message.video.id}` : undefined;
                } else if (messageType === "audio") {
                  mediaMimeType = message.audio?.mime_type;
                  mediaUrl = message.audio?.id ? `https://graph.facebook.com/v21.0/${message.audio.id}` : undefined;
                } else if (messageType === "interactive") {
                  textBody = message.interactive?.button_reply?.title || message.interactive?.list_reply?.title;
                } else if (messageType === "button") {
                  textBody = message.button?.text;
                }

                await handleIncomingWhatsAppWebhookMessage({
                  metaMessageId: message.id,
                  from: message.from,
                  customerName,
                  timestamp: message.timestamp,
                  type: messageType,
                  text: textBody,
                  mediaUrl,
                  mediaMimeType,
                  mediaFilename,
                });
              }
            }

            // Handle Status Updates (sent, delivered, read, failed)
            if (value.statuses && value.statuses.length > 0) {
              for (const statusObj of value.statuses) {
                await handleWhatsAppStatusUpdate({
                  metaMessageId: statusObj.id,
                  status: statusObj.status,
                  timestamp: statusObj.timestamp,
                  errors: statusObj.errors,
                });
              }
            }
          }
        }
      }

      res.status(200).send("EVENT_RECEIVED");
    } catch (err: any) {
      console.error("[Meta Webhook] Error processing event:", err);
      res.status(500).json({ error: "Internal processing error" });
    }
  });

  // ==========================================
  // 4. OUTBOUND WHATSAPP SEND API
  // ==========================================
  app.post("/api/whatsapp/send", async (req, res) => {
    try {
      const { conversationId, contactWaId, body, type = "text", template } = req.body;

      if (!contactWaId || (!body && !template)) {
        return res.status(400).json({ error: "Recipient phone number and message body or template are required." });
      }

      // Check if Meta credentials exist
      const hasMeta = !!(process.env.META_ACCESS_TOKEN && process.env.META_PHONE_NUMBER_ID);

      let metaMessageId: string | null = null;
      let sendStatus: 'sent' | 'failed' = 'sent';
      let errorDetails: any = null;

      if (hasMeta) {
        // Send real message via Meta WhatsApp Cloud API
        const sendResult = await sendWhatsAppMessage({
          to: contactWaId,
          type: type as any,
          text: type === 'text' ? { body } : undefined,
          template: template ? template : undefined,
        });

        if (!sendResult.success) {
          sendStatus = 'failed';
          errorDetails = { error: sendResult.error, raw: sendResult.rawResponse };
          return res.status(502).json({
            error: sendResult.error || "Meta WhatsApp Cloud API failed to deliver message.",
            details: errorDetails
          });
        }
        metaMessageId = sendResult.metaMessageId || null;
      } else {
        // Warning: Meta is not connected yet
        return res.status(503).json({
          error: "Meta WhatsApp API is not yet configured. Please provide META_ACCESS_TOKEN and META_PHONE_NUMBER_ID in server environment to transmit live WhatsApp messages.",
          metaConfigured: false
        });
      }

      // Save outgoing message in Supabase
      const supabase = getSupabaseAdmin();
      const workspaceId = await getDefaultWorkspaceId();

      if (workspaceId && conversationId) {
        const { data: savedMsg, error: saveErr } = await supabase
          .from("messages")
          .insert({
            workspace_id: workspaceId,
            conversation_id: conversationId,
            meta_message_id: metaMessageId,
            sender_type: "agent",
            message_type: type,
            body: body || (template ? `[Template: ${template.name}]` : ""),
            status: sendStatus,
            error_details: errorDetails,
          })
          .select()
          .single();

        if (!saveErr) {
          // Update conversation last_message_at
          await supabase
            .from("conversations")
            .update({ last_message_at: new Date().toISOString() })
            .eq("id", conversationId);
        }

        return res.json({
          success: true,
          message: savedMsg,
          metaMessageId,
        });
      }

      res.json({ success: true, metaMessageId });
    } catch (err: any) {
      console.error("[Send Message] Server error:", err);
      res.status(500).json({ error: err.message || "Failed to dispatch message" });
    }
  });

  // ==========================================
  // 5. GEMINI AI COPILOT API
  // ==========================================
  app.post("/api/ai/copilot", async (req, res) => {
    try {
      const response = await processAiCopilot(req.body);
      if (response.error) {
        return res.status(400).json({ error: response.error });
      }
      res.json({ success: true, data: response.result });
    } catch (err: any) {
      console.error("[AI Copilot] Error:", err);
      res.status(500).json({ error: err.message || "AI Copilot failed" });
    }
  });

  // ==========================================
  // 6. VITE MIDDLEWARE & SPA FALLBACK
  // ==========================================
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Branify WhatsApp CRM server running on http://localhost:${PORT}`);
  });
}

startServer();
