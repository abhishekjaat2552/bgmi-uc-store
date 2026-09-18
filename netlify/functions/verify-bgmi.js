exports.handler = async function (event) {
  try {
    if (event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ success: false, error: "Method not allowed" })
      };
    }

    const body = JSON.parse(event.body || "{}");
    const uid = String(body.uid || "").trim();

    if (!/^\d+$/.test(uid)) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          success: false,
          error: "Invalid BGMI Player ID"
        })
      };
    }

    const devUid = process.env.HL_DEV_UID;
    const apiKey = process.env.HL_API_KEY;

    if (!devUid || !apiKey) {
      return {
        statusCode: 500,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          success: false,
          error: "Verification service is not configured"
        })
      };
    }

    const url = new URL(
      "https://apis.hlgamingofficial.com/main/games/bgmi/validation/api"
    );

    url.searchParams.set("sectionName", "verify-bgmi");
    url.searchParams.set("useruid", devUid);
    url.searchParams.set("api", apiKey);
    url.searchParams.set("uid", uid);

    const response = await fetch(url.toString());
    const text = await response.text();

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }

    if (!response.ok) {
      return {
        statusCode: response.status,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          success: false,
          error: "BGMI verification failed",
          provider: data
        })
      };
    }

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store"
      },
      body: JSON.stringify({
        success: true,
        uid: uid,
        provider: data
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        success: false,
        error: "Server error"
      })
    };
  }
};
