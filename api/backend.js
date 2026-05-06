
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
      backendConfigured: true
    });
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      ok: false,
      error: "Method not allowed."
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

    let data;
    try {
      data = JSON.parse(text);
    } catch (err) {
      data = {
        ok: false,
        error: "Apps Script returned non-JSON response.",
        raw: text
      };
    }

    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: err && err.message ? err.message : String(err)
    });
  }
}
