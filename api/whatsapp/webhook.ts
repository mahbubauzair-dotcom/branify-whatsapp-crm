export default function handler(req: any, res: any) {
  try {
    // ============================================================
    // 1. META WEBHOOK VERIFICATION (GET)
    // ============================================================
    if (req.method === "GET") {
      let mode = req.query?.["hub.mode"] || req.query?.hub_mode;
      let token = req.query?.["hub.verify_token"] || req.query?.hub_verify_token;
      let challenge = req.query?.["hub.challenge"] || req.query?.hub_challenge;

      // Fallback query string parser if req.query is not populated by platform
      if (!mode || !token || !challenge) {
        try {
          const urlString = req.url || "";
          const host = req.headers?.host || "localhost";
          const fullUrl = new URL(urlString.startsWith("http") ? urlString : `http://${host}${urlString}`);
          mode = mode || fullUrl.searchParams.get("hub.mode") || fullUrl.searchParams.get("hub_mode");
          token = token || fullUrl.searchParams.get("hub.verify_token") || fullUrl.searchParams.get("hub_verify_token");
          challenge = challenge || fullUrl.searchParams.get("hub.challenge") || fullUrl.searchParams.get("hub_challenge");
        } catch (urlErr) {
          // ignore
        }
      }

      // Read server-side environment variable
      const expectedToken = process.env.META_VERIFY_TOKEN || "branify_crm_webhook_secret_2026";

      if (mode === "subscribe" && token && expectedToken && token === expectedToken) {
        res.statusCode = 200;
        res.setHeader("Content-Type", "text/plain; charset=utf-8");
        if (typeof res.send === "function") {
          return res.send(String(challenge));
        }
        return res.end(String(challenge));
      }

      res.statusCode = 403;
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      if (typeof res.send === "function") {
        return res.send("Forbidden");
      }
      return res.end("Forbidden");
    }

    // ============================================================
    // 2. INCOMING WEBHOOK EVENTS (POST)
    // ============================================================
    if (req.method === "POST") {
      res.statusCode = 200;
      if (typeof res.send === "function") {
        return res.send("EVENT_RECEIVED");
      }
      return res.end("EVENT_RECEIVED");
    }

    res.statusCode = 405;
    return res.end("Method Not Allowed");
  } catch (error: any) {
    res.statusCode = 500;
    return res.end("Internal Server Error");
  }
}
