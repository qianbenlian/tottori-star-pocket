// Server-side proxy for Gemini generative API
// Designed for Vercel / Netlify / Cloudflare Workers (Node.js style)

export default async function handler(req, res) {
  // Basic CORS handling for static site hosted on Vercel (allow same origin)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: 'Server not configured with GEMINI_API_KEY' });
  }

  try {
    const body = await new Promise((resolve, reject) => {
      let data = '';
      req.on('data', chunk => data += chunk);
      req.on('end', () => resolve(JSON.parse(data || '{}')));
      req.on('error', err => reject(err));
    });

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
