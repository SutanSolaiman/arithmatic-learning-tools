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
    const bodyText = JSON.stringify(req.body || {});

    let response = await fetch(backendUrl, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8"
      },
      body: bodyText,
      redirect: "manual"
    });

    if (response.status === 301 || response.status === 302 || response.status === 303 || response.status === 307 || response.status === 308) {
      const redirectUrl = response.headers.get("location");

      if (!redirectUrl) {
        return res.status(502).json({
          ok: false,
          error: "Apps Script redirected but no Location header was found."
        });
      }

      response = await fetch(redirectUrl, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain;charset=utf-8"
        },
        body: bodyText
      });
    }

    const text = await response.text();

    try {
      const data = JSON.parse(text);
      return res.status(200).json(data);
    } catch (err) {
      return res.status(502).json({
        ok: false,
        error: "Apps Script returned non-JSON response.",
        appsScriptStatus: response.status,
        appsScriptContentType: response.headers.get("content-type"),
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
