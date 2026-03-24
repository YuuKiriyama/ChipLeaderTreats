/**
 * Vercel Serverless Function — fetches short-lived TURN credentials from Metered.
 * Env (set in Vercel project settings):
 *   METERED_API_KEY   — from Metered dashboard (API Keys)
 *   METERED_APP_DOMAIN — e.g. chipleadertreats.metered.live (no https://)
 */

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.METERED_API_KEY;
  const domain = process.env.METERED_APP_DOMAIN;

  if (!apiKey || !domain) {
    return res.status(500).json({
      error: 'Server misconfiguration',
      hint: 'Set METERED_API_KEY and METERED_APP_DOMAIN in Vercel environment variables.',
    });
  }

  const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/$/, '');
  const url = `https://${cleanDomain}/api/v1/turn/credentials?apiKey=${encodeURIComponent(apiKey)}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      const text = await response.text();
      console.error('Metered API error:', response.status, text);
      return res.status(502).json({ error: 'Failed to fetch TURN credentials from Metered' });
    }

    const data = await response.json();
    const iceServers = Array.isArray(data) ? data : data.iceServers;
    if (!Array.isArray(iceServers) || iceServers.length === 0) {
      console.error('Unexpected Metered response:', data);
      return res.status(502).json({ error: 'Invalid TURN credentials response' });
    }

    return res.status(200).json({ iceServers });
  } catch (err) {
    console.error('turn-credentials fetch failed:', err);
    return res.status(502).json({ error: 'Upstream request failed' });
  }
};
