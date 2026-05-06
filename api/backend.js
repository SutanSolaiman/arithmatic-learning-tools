export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  const backendUrl = process.env.APPS_SCRIPT_BACKEND_URL;

  if (!backendUrl) {
    return res.status(500).json({
      ok: false,
      error: "Missing APPS_SCRIPT_BACKEND_URL in Vercel Environment Variables."
    });
  }

  if (req.method === "GET") {
    return res.status(200).json({
      ok: true,
      status: "Vercel backend proxy is running.",
      backendConfigured: true,
      backendUrlPreview: backendUrl.slice(0, 60)
    });
  }

  try {
    const response = await fetch(backendUrl, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8"
      },
      body: JSON.stringify(req.body || {})
    });

    const text = await response.text();
    const contentType = response.headers.get("content-type") || "";

    try {
      const data = JSON.parse(text);
      return res.status(200).json(data);
    } catch (err) {
      return res.status(502).json({
        ok: false,
        error: "Apps Script returned non-JSON response.",
        appsScriptStatus: response.status,
        appsScriptContentType: contentType,
        rawPreview: text.slice(0, 1000)
      });
    }
  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: err && err.message ? err.message : String(err)
    });
  }
}
