const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = Number(process.env.PORT || 3000);
const FLARESOLVERR_URL = process.env.FLARESOLVERR_URL || "http://127.0.0.1:8191/v1";
const RAFFLES_API_URL = process.env.RAFFLES_API_URL || "https://be.mighty.ph/api/v1/raffles";

function send(res, status, body, contentType = "application/json; charset=utf-8") {
  res.writeHead(status, {
    "Content-Type": contentType,
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff"
  });
  res.end(contentType.startsWith("application/json") ? JSON.stringify(body) : body);
}

async function getRaffles() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 70000);

  try {
    const fsResponse = await fetch(FLARESOLVERR_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cmd: "request.get",
        url: RAFFLES_API_URL,
        maxTimeout: 60000
      }),
      signal: controller.signal
    });

    if (!fsResponse.ok) {
      throw new Error(`FlareSolverr HTTP ${fsResponse.status}`);
    }

    const fsJson = await fsResponse.json();
    if (fsJson.status !== "ok" || !fsJson.solution) {
      throw new Error(fsJson.message || "FlareSolverr did not return a solution");
    }

    const solution = fsJson.solution;
    if (solution.status && solution.status >= 400) {
      throw new Error(`Mighty.ph API returned HTTP ${solution.status}`);
    }

    let data;
    try {
      data = JSON.parse(solution.response);
    } catch {
      throw new Error(
        "Mighty.ph did not return JSON. It may have returned a challenge/login page instead."
      );
    }

    // Dashboard expects { data: [...] }, with each item containing
    // id, name, description, and prize.quantity.
    if (Array.isArray(data)) data = { data };
    if (!data || !Array.isArray(data.data)) {
      throw new Error("API response shape was unexpected; expected a data array.");
    }

    return data;
  } finally {
    clearTimeout(timeout);
  }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);

  if (req.method === "GET" && url.pathname === "/api/raffles") {
    try {
      const data = await getRaffles();
      return send(res, 200, data);
    } catch (err) {
      console.error("[/api/raffles]", err.message);
      return send(res, 502, {
        error: true,
        message: err.message || "Unable to retrieve raffle data"
      });
    }
  }

  if (req.method === "GET" && (url.pathname === "/" || url.pathname === "/index.html")) {
    const file = path.join(__dirname, "index.html");
    fs.readFile(file, (err, contents) => {
      if (err) return send(res, 500, { error: true, message: "Could not read index.html" });
      return send(res, 200, contents.toString("utf8"), "text/html; charset=utf-8");
    });
    return;
  }

  if (req.method === "GET" && url.pathname === "/health") {
    return send(res, 200, { status: "ok", flaresolverr: FLARESOLVERR_URL });
  }

  return send(res, 404, { error: true, message: "Not found" });
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`Mighty.ph Raffle Monitor: http://localhost:${PORT}`);
  console.log(`FlareSolverr endpoint: ${FLARESOLVERR_URL}`);
  console.log(`Raffles API: ${RAFFLES_API_URL}`);
});
