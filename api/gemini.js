// Server-side proxy for Gemini generative API (Vercel serverless)
// Security: checks Origin and optional CLIENT_SECRET header before forwarding.

export default async function handler(req, res) {
  const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '*';
  const CLIENT_SECRET = process.env.CLIENT_SECRET || null;

  // Basic CORS handling (restrictable via ALLOWED_ORIGIN)
  const origin = req.headers.origin || '';
  if (ALLOWED_ORIGIN !== '*' && origin && origin !== ALLOWED_ORIGIN) {
    res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
    return res.status(403).json({ error: 'Forbidden origin' });
  }
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Client-Secret');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: 'Server not configured with GEMINI_API_KEY' });
  }

  // Optional simple token auth to prevent open proxy abuse
  if (CLIENT_SECRET) {
    const provided = req.headers['x-client-secret'] || req.body?.clientSecret;
    if (!provided || provided !== CLIENT_SECRET) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  try {
    // Support both JSON-parsed bodies (platforms that parse) and raw streams
    let body = req.body;
    if (!body || Object.keys(body).length === 0) {
      // try to read raw
      body = await new Promise((resolve, reject) => {
        let data = '';
        req.on && req.on('data', chunk => data += chunk.toString());
        req.on && req.on('end', () => {
          try { resolve(JSON.parse(data || '{}')); } catch (e) { resolve({}); }
        });
        req.on && req.on('error', err => reject(err));
      });
    }

    const userText = body.userText || body.text || '';
    const systemInstruction = body.systemInstruction || "あなたは親切な案内人です。簡潔に説明してください。";

    const r = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': process.env.GEMINI_API_KEY
      },
      body: JSON.stringify({
        contents: [
          { role: 'user', parts: [{ text: userText }] }
        ],
        systemInstruction: { parts: [{ text: systemInstruction }] },
        generationConfig: { maxOutputTokens: 2048, temperature: 0.7 }
      })
    });

    const data = await r.json();
    // Forward Gemini response (and status) back to client.
    res.status(r.status).json(data);
  } catch (err) {
    console.error('Proxy Exception', err);
    res.status(500).json({ error: 'Proxy exception', detail: String(err) });
  }
}
