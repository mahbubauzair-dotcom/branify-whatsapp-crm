import { GoogleGenAI } from "@google/genai";

let aiInstance: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  if (!aiInstance) {
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
}

export interface CopilotRequest {
  action: 'suggest_reply' | 'summarize_conversation' | 'qualify_lead' | 'generate_followup';
  conversationHistory: Array<{
    sender: 'customer' | 'agent' | 'system';
    text: string;
    timestamp?: string;
  }>;
  contactName?: string;
  contactCompany?: string;
  knowledgeBase?: Array<{ category: string; title: string; content: string }>;
}

export async function processAiCopilot(req: CopilotRequest): Promise<{ result: any; error?: string }> {
  const ai = getAiClient();
  if (!ai) {
    return {
      result: null,
      error: "Gemini API key is not configured in server environment."
    };
  }

  const kbContext = req.knowledgeBase && req.knowledgeBase.length > 0
    ? req.knowledgeBase.map(k => `[${k.category.toUpperCase()}] ${k.title}:\n${k.content}`).join("\n\n")
    : "No internal knowledge base articles provided yet.";

  const historyText = req.conversationHistory
    .map(m => `${m.sender.toUpperCase()}: ${m.text}`)
    .join("\n");

  const systemInstructions = `You are the Branify WhatsApp AI Assistant.
Branify is an elite digital eCommerce and brand growth agency (Website: https://branify.store/, WhatsApp: @branify002).
CRITICAL GROUNDING RULES:
1. ONLY use the provided Knowledge Base for facts regarding prices, services, delivery time, return/refund policies, and guarantees.
2. NEVER invent fake prices, delivery promises, or refund policies.
3. Be professional, polite, concise, and helpful suitable for WhatsApp business chats.
4. Keep WhatsApp messages clean, readable, and under 3-4 short paragraphs maximum.`;

  try {
    if (req.action === 'suggest_reply') {
      const prompt = `Conversation history between Branify and customer (${req.contactName || 'Customer'}):
${historyText}

Verified Branify Knowledge Base:
${kbContext}

Task: Draft 2 distinct, highly relevant, and professional WhatsApp reply options for the agent to review and send.
Option 1: Friendly and direct.
Option 2: Detailed and solution-oriented.

Format your output strictly as a JSON object with this shape:
{
  "options": [
    { "title": "Direct Reply", "text": "..." },
    { "title": "Detailed Reply", "text": "..." }
  ],
  "reasoning": "Short 1-sentence note explaining the suggested angle"
}`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          systemInstruction: systemInstructions,
          responseMimeType: "application/json",
          temperature: 0.3,
        }
      });

      const parsed = JSON.parse(response.text || "{}");
      return { result: parsed };
    }

    if (req.action === 'summarize_conversation') {
      const prompt = `Summarize this customer WhatsApp conversation into key points:
${historyText}

Provide output strictly as a JSON object:
{
  "summary": "Concise 2-3 sentence overview of the conversation",
  "keyTopics": ["topic 1", "topic 2"],
  "customerSentiment": "positive" | "neutral" | "frustrated" | "curious",
  "recommendedAction": "Immediate next step recommended"
}`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          systemInstruction: systemInstructions,
          responseMimeType: "application/json",
          temperature: 0.2,
        }
      });

      const parsed = JSON.parse(response.text || "{}");
      return { result: parsed };
    }

    if (req.action === 'qualify_lead') {
      const prompt = `Analyze this conversation to qualify the lead for Branify CRM:
${historyText}

Format output strictly as a JSON object:
{
  "leadScore": 75, // integer 0-100
  "intent": "High Intent Purchase / Inquiry / Support / Partnership",
  "budgetIndicator": "Low / Medium / High / Unknown",
  "suggestedTags": ["VIP Customer", "New Inquiry", "High Value"],
  "qualificationNotes": "Brief reasoning"
}`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          systemInstruction: systemInstructions,
          responseMimeType: "application/json",
          temperature: 0.2,
        }
      });

      const parsed = JSON.parse(response.text || "{}");
      return { result: parsed };
    }

    if (req.action === 'generate_followup') {
      const prompt = `Generate a smart follow-up task recommendation based on this chat:
${historyText}

Format output strictly as a JSON object:
{
  "title": "Follow up with customer regarding proposal",
  "suggestedDaysFromNow": 1, // e.g. 1, 2, or 3
  "priority": "normal" | "high" | "urgent",
  "notes": "Action details to discuss"
}`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          systemInstruction: systemInstructions,
          responseMimeType: "application/json",
          temperature: 0.2,
        }
      });

      const parsed = JSON.parse(response.text || "{}");
      return { result: parsed };
    }

    return { result: null, error: "Unsupported AI action" };
  } catch (err: any) {
    console.error("Gemini AI Copilot Error:", err);
    return { result: null, error: err.message || "Failed to process AI request" };
  }
}
