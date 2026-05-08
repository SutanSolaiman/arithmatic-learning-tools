const APPS_SCRIPT_BACKEND_URL =
  "https://script.google.com/macros/s/AKfycbz_YJD5lp6ZphAm9-NNbJtRCjuOav6VQ933oxMvTrIfO8P3j4W7j_T068OA8B4Ml4VI/exec";

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      return res.status(200).json({
        ok: true,
        route: "/api/learning-tools",
        message: "Vercel API route is online. This version sends actions to Apps Script using GET bridge.",
        backendUrl: APPS_SCRIPT_BACKEND_URL
      });
    }

    if (req.method !== "POST") {
      return res.status(405).json({
        ok: false,
        error: "Method not allowed. Use POST from frontend to Vercel."
      });
    }

    const requestBody = req.body || {};
    const encodedRequest = Buffer
      .from(JSON.stringify(requestBody), "utf8")
      .toString("base64url");

    const url =
      APPS_SCRIPT_BACKEND_URL +
      "?bridge=1&request=" +
      encodeURIComponent(encodedRequest);

    const appsScriptResponse = await fetch(url, {
      method: "GET",
      redirect: "follow"
    });

    const rawText = await appsScriptResponse.text();

    let data;

    try {
      data = JSON.parse(rawText);
    } catch (err) {
      return res.status(502).json({
        ok: false,
        error: [
          "Apps Script returned non-JSON response through GET bridge.",
          "",
          "Status: " + appsScriptResponse.status,
          "Final URL: " + appsScriptResponse.url,
          "",
          "Request sent:",
          JSON.stringify(requestBody),
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
