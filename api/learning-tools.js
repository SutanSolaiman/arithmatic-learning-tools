const APPS_SCRIPT_BACKEND_URL =
  "https://script.google.com/macros/s/AKfycbz_YJD5lp6ZphAm9-NNbJtRCjuOav6VQ933oxMvTrIfO8P3j4W7j_T068OA8B4Ml4VI/exec";

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      return res.status(200).json({
        ok: true,
        route: "/api/learning-tools",
        message: "This is the NEW hardcoded Vercel API route.",
        backendUrl: APPS_SCRIPT_BACKEND_URL
      });
    }

    if (req.method !== "POST") {
      return res.status(405).json({
        ok: false,
        error: "Method not allowed. Use POST."
      });
    }

    const sentBody = JSON.stringify(req.body || {});

    const appsScriptResponse = await fetch(APPS_SCRIPT_BACKEND_URL, {
      method: "POST",
      redirect: "follow",
      headers: {
        "Content-Type": "text/plain;charset=utf-8"
      },
      body: sentBody
    });

    const rawText = await appsScriptResponse.text();

    let data;

    try {
      data = JSON.parse(rawText);
    } catch (err) {
      return res.status(502).json({
        ok: false,
        error: [
          "Apps Script returned non-JSON response.",
          "",
          "This request was sent to:",
          APPS_SCRIPT_BACKEND_URL,
          "",
          "Apps Script final URL:",
          appsScriptResponse.url,
          "",
          "Apps Script status:",
          String(appsScriptResponse.status),
          "",
          "Sent body:",
          sentBody,
          "",
          "Raw response starts:",
          rawText.substring(0, 3000)
        ].join("\n")
      });
    }

    return res.status(200).json(data);

  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: err && err.message ? err.message : String(err),
      stack: err && err.stack ? String(err.stack) : ""
    });
  }
}
