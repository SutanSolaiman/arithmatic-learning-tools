const APPS_SCRIPT_BACKEND_URL =
  "https://script.google.com/macros/s/AKfycbxeHjL44E0O80T0XNV6EWNa2h83sDRT1Jeb3IXyNPmq81FczGKqlC6NK5D8vUclwSrY/exec";

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      return res.status(200).json({
        ok: true,
        route: "/api/learning-tools",
        message: "Vercel API route is online.",
        backendUrl: APPS_SCRIPT_BACKEND_URL,
        expected: "POST requests will be forwarded to Apps Script."
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
    const contentType = appsScriptResponse.headers.get("content-type") || "";

    let data;

    try {
      data = JSON.parse(rawText);
    } catch (err) {
      return res.status(502).json({
        ok: false,
        error:
          "Apps Script returned non-JSON response.\n\n" +
          "Status: " +
          appsScriptResponse.status +
          "\nContent-Type: " +
          contentType +
          "\nFinal URL: " +
          appsScriptResponse.url +
          "\n\nSent body:\n" +
          sentBody +
          "\n\nRAW RESPONSE START:\n" +
          rawText.substring(0, 3000),
        appsScriptStatus: appsScriptResponse.status,
        appsScriptStatusText: appsScriptResponse.statusText,
        appsScriptContentType: contentType,
        appsScriptFinalUrl: appsScriptResponse.url,
        sentBody: sentBody,
        rawResponseStart: rawText.substring(0, 3000)
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
