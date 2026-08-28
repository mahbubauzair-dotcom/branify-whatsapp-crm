import crypto from "crypto";

export interface OutboundMessagePayload {
  to: string; // Recipient WhatsApp phone number in E.164 without plus sign or with plus sign
  type: 'text' | 'template' | 'image' | 'document' | 'video';
  text?: { body: string };
  template?: {
    name: string;
    language: { code: string };
    components?: any[];
  };
  image?: { link: string; caption?: string };
  document?: { link: string; caption?: string; filename?: string };
}

export function verifyMetaSignature(payload: string | Buffer, signatureHeader: string | undefined): boolean {
  const appSecret = process.env.META_APP_SECRET;
  if (!appSecret) {
    // If not configured in dev, pass with warning
    return true;
  }
  if (!signatureHeader) {
    return false;
  }

  const parts = signatureHeader.split("sha256=");
  if (parts.length !== 2) return false;
  const signature = parts[1];

  const expectedSignature = crypto
    .createHmac("sha256", appSecret)
    .update(payload)
    .digest("hex");

  return crypto.timingSafeEqual(Buffer.from(signature, "utf-8"), Buffer.from(expectedSignature, "utf-8"));
}

export async function sendWhatsAppMessage(payload: OutboundMessagePayload): Promise<{
  success: boolean;
  metaMessageId?: string;
  error?: string;
  rawResponse?: any;
}> {
  const accessToken = (process.env.WHATSAPP_TOKEN || process.env.META_ACCESS_TOKEN)?.trim() ||
    "EAAZA8aiSODZCYBSe0bwYfrq0pFj2VgRCMmIDHFpKsAZA0tc2qM9PR7gEZBcG5j10ZCLxO6SZAfSl9ZAcVbDirlYUPiZBey0Rrk2m5evdv79B7e8WUvkiESK1NI8H2S1qoZCNGkaYJl4DEsc8MLuA9GdUZAC0af1CnyphekveowpzIPxK40x7sHq23UlpbZBeB383AZDZD";
  const phoneNumberId = (process.env.WHATSAPP_PHONE_NUMBER_ID || process.env.META_PHONE_NUMBER_ID)?.trim() || "1284140121445758";
  const apiVersion = process.env.META_GRAPH_API_VERSION || 'v21.0';

  if (!accessToken || !phoneNumberId) {
    return {
      success: false,
      error: "Meta WhatsApp credentials (WHATSAPP_TOKEN / META_ACCESS_TOKEN or WHATSAPP_PHONE_NUMBER_ID / META_PHONE_NUMBER_ID) are not configured on the server."
    };
  }

  // Clean phone number (strip + and whitespace)
  const cleanTo = payload.to.replace(/\D/g, "");

  const bodyPayload: any = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: cleanTo,
    type: payload.type,
  };

  if (payload.type === "text" && payload.text) {
    bodyPayload.text = payload.text;
  } else if (payload.type === "template" && payload.template) {
    bodyPayload.template = payload.template;
  } else if (payload.type === "image" && payload.image) {
    bodyPayload.image = payload.image;
  } else if (payload.type === "document" && payload.document) {
    bodyPayload.document = payload.document;
  }

  try {
    const url = `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(bodyPayload),
    });

    const data = await response.json();

    if (!response.ok) {
      const errorMsg = data?.error?.message || `Meta API Error (${response.status})`;
      console.error("Meta WhatsApp Send Error:", data);
      return {
        success: false,
        error: errorMsg,
        rawResponse: data
      };
    }

    const metaMessageId = data?.messages?.[0]?.id;
    return {
      success: true,
      metaMessageId,
      rawResponse: data
    };
  } catch (err: any) {
    console.error("Meta WhatsApp Network Error:", err);
    return {
      success: false,
      error: err.message || "Failed to communicate with Meta WhatsApp Cloud API."
    };
  }
}
