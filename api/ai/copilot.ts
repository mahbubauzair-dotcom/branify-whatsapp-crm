import { processAiCopilot } from "../../server/aiService";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const response = await processAiCopilot(req.body);
    if (response.error) {
      return res.status(400).json({ error: response.error });
    }
    return res.status(200).json({ success: true, data: response.result });
  } catch (err: any) {
    console.error("[AI Copilot] Error:", err);
    return res.status(500).json({ error: err.message || "AI Copilot failed" });
  }
}
