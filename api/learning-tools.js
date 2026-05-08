const APPS_SCRIPT_BACKEND_URL =
  "https://script.google.com/macros/s/AKfycbz_YJD5lp6ZphAm9-NNbJtRCjuOav6VQ933oxMvTrIfO8P3j4W7j_T068OA8B4Ml4VI/exec";

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      return res.status(200).json({
        ok: true,
        route: "/api/learning-tools",
        message: "Vercel API route is online. Small actions use GET bridge. PDF upload uses POST proxy.",
        backendUrl: APPS_SCRIPT_BACKEND_URL
      });
    }

    if (req.method !== "POST") {
      return res.status(405).json({
        ok: false,
        error: "Method not allowed. Use POST."
      });
    }

    const requestBody = req.body || {};
    const action = String(requestBody.action || "").trim();

    if (!action) {
      return res.status(400).json({
        ok: false,
        error: "Missing action."
      });
    }

    if (action === "processGradePdfUpload") {
      return await forwardLargePdfPostToAppsScript_(res, requestBody);
    }

    return await forwardSmallActionViaGetBridge_(res, requestBody);

  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: err && err.message ? err.message : String(err),
      stack: err && err.stack ? String(err.stack) : ""
    });
  }
}

async function forwardSmallActionViaGetBridge_(res, requestBody) {
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
        "Request action:",
        String(requestBody.action || ""),
        "",
        "Raw response starts:",
        rawText.substring(0, 3000)
      ].join("\n")
    });
  }

  return res.status(200).json(data);
}

async function forwardLargePdfPostToAppsScript_(res, requestBody) {
  const sentBody = JSON.stringify(requestBody);

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
      error: [
        "Apps Script returned non-JSON response through PDF POST proxy.",
        "",
        "Status: " + appsScriptResponse.status,
        "Content-Type: " + contentType,
        "Final URL: " + appsScriptResponse.url,
        "",
        "Payload action:",
        String(requestBody.action || ""),
        "",
        "Payload base64 length:",
        String(
          requestBody &&
          requestBody.payload &&
          requestBody.payload.base64Data
            ? requestBody.payload.base64Data.length
            : 0
        ),
        "",
        "Raw response starts:",
        rawText.substring(0, 3000)
      ].join("\n"),
      appsScriptStatus: appsScriptResponse.status,
      appsScriptContentType: contentType,
      appsScriptFinalUrl: appsScriptResponse.url,
      rawResponseStart: rawText.substring(0, 3000)
    });
  }

  return res.status(200).json(data);
}
