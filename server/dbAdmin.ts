import { createClient, SupabaseClient } from "@supabase/supabase-js";

let adminClient: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (!adminClient) {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://dxyqcypsssbopgbsqlfv.supabase.co";
    // Prefer service role key for webhook ingest if set, otherwise fallback to publishable key
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 
      process.env.VITE_SUPABASE_ANON_KEY || 
      process.env.VITE_SUPABASE_PUBLISHABLE_KEY || 
      "sb_publishable_btxaDAzN1MEBJtVYV-q-AA_BLAC21JP";

    adminClient = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }
  return adminClient;
}

export async function getDefaultWorkspaceId(): Promise<string | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("workspaces")
    .select("id")
    .eq("slug", "branify")
    .limit(1)
    .single();

  if (error || !data) {
    // If not found, try getting the first workspace
    const { data: fallback } = await supabase
      .from("workspaces")
      .select("id")
      .limit(1)
      .single();
    return fallback?.id || null;
  }
  return data.id;
}

export async function handleIncomingWhatsAppWebhookMessage(msg: {
  metaMessageId: string;
  from: string; // phone number (e.g. 923321029333)
  customerName?: string;
  timestamp: string;
  type: string;
  text?: string;
  mediaUrl?: string;
  mediaMimeType?: string;
  mediaFilename?: string;
}) {
  const supabase = getSupabaseAdmin();
  const workspaceId = await getDefaultWorkspaceId();

  if (!workspaceId) {
    console.error("No workspace found for incoming webhook message");
    return;
  }

  const cleanWaId = msg.from.replace(/\D/g, "");

  // 1. Check Idempotency - does meta_message_id already exist?
  const { data: existingMsg } = await supabase
    .from("messages")
    .select("id")
    .eq("meta_message_id", msg.metaMessageId)
    .limit(1)
    .maybeSingle();

  if (existingMsg) {
    console.log(`[Idempotency] Message ${msg.metaMessageId} already processed. Skipping.`);
    return;
  }

  // 2. Find or Create Contact
  let contactId: string;
  const { data: existingContact } = await supabase
    .from("contacts")
    .select("id, marketing_opt_in")
    .eq("workspace_id", workspaceId)
    .eq("wa_id", cleanWaId)
    .maybeSingle();

  const isOptOutKeyword = msg.text && ["STOP", "UNSUBSCRIBE", "CANCEL", "QUIT", "OPT OUT", "OPTOUT"].includes(msg.text.trim().toUpperCase());

  if (existingContact) {
    contactId = existingContact.id;
    if (isOptOutKeyword && existingContact.marketing_opt_in) {
      await supabase
        .from("contacts")
        .update({
          marketing_opt_in: false,
          opt_out_at: new Date().toISOString(),
        })
        .eq("id", contactId);
    }
  } else {
    // Create new contact - marketing_opt_in strictly defaults to false
    const { data: newContact, error: contactErr } = await supabase
      .from("contacts")
      .insert({
        workspace_id: workspaceId,
        wa_id: cleanWaId,
        name: msg.customerName || `Customer (+${cleanWaId})`,
        marketing_opt_in: false,
        notes: "Created automatically via WhatsApp inbound message.",
      })
      .select("id")
      .single();

    if (contactErr || !newContact) {
      console.error("Error creating contact from inbound message:", contactErr);
      return;
    }
    contactId = newContact.id;
  }

  // 3. Find or Create Conversation
  let conversationId: string;
  const { data: existingConv } = await supabase
    .from("conversations")
    .select("id, unread_count")
    .eq("workspace_id", workspaceId)
    .eq("contact_id", contactId)
    .maybeSingle();

  if (existingConv) {
    conversationId = existingConv.id;
    await supabase
      .from("conversations")
      .update({
        last_message_at: new Date().toISOString(),
        unread_count: (existingConv.unread_count || 0) + 1,
        status: "open",
      })
      .eq("id", conversationId);
  } else {
    const { data: newConv, error: convErr } = await supabase
      .from("conversations")
      .insert({
        workspace_id: workspaceId,
        contact_id: contactId,
        status: "open",
        priority: "normal",
        unread_count: 1,
        last_message_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (convErr || !newConv) {
      console.error("Error creating conversation for contact:", convErr);
      return;
    }
    conversationId = newConv.id;
  }

  // 4. Insert Message
  const { error: msgErr } = await supabase
    .from("messages")
    .insert({
      workspace_id: workspaceId,
      conversation_id: conversationId,
      meta_message_id: msg.metaMessageId,
      sender_type: "customer",
      message_type: msg.type || "text",
      body: msg.text || null,
      media_url: msg.mediaUrl || null,
      media_mime_type: msg.mediaMimeType || null,
      media_filename: msg.mediaFilename || null,
      status: "delivered",
    });

  if (msgErr) {
    console.error("Error saving incoming message to database:", msgErr);
  } else {
    console.log(`[WhatsApp Inbound] Successfully saved message ${msg.metaMessageId} from ${cleanWaId}`);
  }
}

export async function handleWhatsAppStatusUpdate(statusObj: {
  metaMessageId: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  timestamp?: string;
  errors?: any;
}) {
  const supabase = getSupabaseAdmin();

  const updatePayload: any = {
    status: statusObj.status,
  };

  if (statusObj.errors) {
    updatePayload.error_details = statusObj.errors;
  }

  const { error } = await supabase
    .from("messages")
    .update(updatePayload)
    .eq("meta_message_id", statusObj.metaMessageId);

  if (error) {
    console.error(`Error updating message status for ${statusObj.metaMessageId}:`, error);
  } else {
    console.log(`[WhatsApp Status] Updated ${statusObj.metaMessageId} -> ${statusObj.status}`);
  }
}
