export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({
        ok: false,
        error: "Method not allowed. Use POST."
      });
    }

    const backendUrl = process.env.APPS_SCRIPT_BACKEND_URL;

    if (!backendUrl) {
      return res.status(500).json({
        ok: false,
        error: "Missing Vercel environment variable: APPS_SCRIPT_BACKEND_URL"
      });
    }

    const appsScriptResponse = await fetch(backendUrl, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8"
      },
      body: JSON.stringify(req.body || {})
    });

    const rawText = await appsScriptResponse.text();

    let data;

    try {
      data = JSON.parse(rawText);
    } catch (err) {
      return res.status(502).json({
        ok: false,
        error: "Apps Script returned non-JSON response.",
        appsScriptStatus: appsScriptResponse.status,
        rawResponseStart: rawText.substring(0, 1000)
      });
    }

    return res.status(200).json(data);

  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: err && err.message ? err.message : String(err)
    });
  }
}
