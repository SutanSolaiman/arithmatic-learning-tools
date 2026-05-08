export default async function handler(req, res) {
  try {
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
        route: "/api/learning-tools",
        message: "Vercel API route is online. Use POST for Learning Tools actions.",
        backendUrlConfigured: true,
        backendUrlStart: backendUrl.substring(0, 100),
        testPayload: {
          action: "generateArithmeticAssessmentPack",
          payload: {
            title: "Applied Quantitative Learning Program",
            employeeIdPrefix: "EMP",
            totalEmployees: 2,
            totalDays: 2,
            dayNumbers: "1,2",
            difficulty: 3,
            zDigits: 3,
            operationMode: "mix"
          }
        }
      });
    }

    if (req.method !== "POST") {
      return res.status(405).json({
        ok: false,
        error: "Method not allowed. Use POST."
      });
    }

    const sentBody = JSON.stringify(req.body || {});

    const appsScriptResponse = await fetch(backendUrl, {
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
          "Apps Script status: " +
          appsScriptResponse.status +
          "\nContent-Type: " +
          contentType +
          "\nFinal URL: " +
          appsScriptResponse.url +
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
