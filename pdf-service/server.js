// PDF service: POST /generate {payload} -> application/pdf, GET /health.
// Builds a .tex from the payload, compiles with tectonic (shell-escape off),
// streams the PDF back. Stateless; each request uses its own temp dir.

const http = require("http");
const crypto = require("crypto");
const fs = require("fs/promises");
const os = require("os");
const path = require("path");
const { spawn } = require("child_process");
const { buildLatex } = require("./latex");

const PORT = process.env.PORT || 8080;
// Bind loopback only by default — on a VPS this must not face the internet.
const HOST = process.env.HOST || "127.0.0.1";
const MAX_BODY = 8 * 1024 * 1024; // 8 MB payload cap
// Shared secret. When set, /generate requires "Authorization: Bearer <token>".
// Required for public hosting (Fly/Railway); optional for loopback/dev.
const TOKEN = process.env.PDF_SERVICE_TOKEN || "";

// constant-time bearer check; returns true when TOKEN unset (local/dev)
function authorized(req) {
  if (!TOKEN) return true;
  const header = req.headers["authorization"] || "";
  const got = header.startsWith("Bearer ") ? header.slice(7) : "";
  const a = Buffer.from(got);
  const b = Buffer.from(TOKEN);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on("data", (c) => {
      size += c.length;
      if (size > MAX_BODY) {
        reject(new Error("payload too large"));
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

function validate(p) {
  if (!p || typeof p !== "object") return "invalid payload";
  if (!Array.isArray(p.sections)) return "sections must be an array";
  const total = p.sections.reduce((n, s) => n + ((s.topics || []).length), 0);
  if (total === 0) return "no topics to render";
  return null;
}

function runTectonic(dir) {
  return new Promise((resolve, reject) => {
    // tectonic: offline (cached), no shell-escape (default). Untrusted TeX safe.
    const proc = spawn("tectonic", ["main.tex", "--outdir", dir, "--chatter", "minimal"], {
      cwd: dir,
      env: { ...process.env },
    });
    let stderr = "";
    proc.stderr.on("data", (d) => (stderr += d.toString()));
    proc.stdout.on("data", () => {});
    proc.on("error", reject);
    proc.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(stderr.split("\n").slice(-20).join("\n")));
    });
  });
}

async function generate(payload) {
  const err = validate(payload);
  if (err) return { status: 400, error: err };

  const { tex, snippets } = buildLatex(payload);
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "ref-"));
  try {
    await fs.mkdir(path.join(dir, "snippets"), { recursive: true });
    await fs.writeFile(path.join(dir, "main.tex"), tex, "utf8");
    await Promise.all(
      snippets.map((s) => fs.writeFile(path.join(dir, s.name), s.code, "utf8"))
    );
    await runTectonic(dir);
    const pdf = await fs.readFile(path.join(dir, "main.pdf"));
    return { status: 200, pdf };
  } catch (e) {
    // last lines of the tectonic log only — no internal paths to the client
    console.error("compile failed:", e.message);
    return { status: 500, error: "LaTeX compilation failed", details: e.message };
  } finally {
    fs.rm(dir, { recursive: true, force: true }).catch(() => {});
  }
}

const server = http.createServer(async (req, res) => {
  if (req.method === "GET" && req.url === "/health") {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("ok");
    return;
  }
  if (req.method === "POST" && req.url === "/generate") {
    if (!authorized(req)) {
      res.writeHead(401, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "unauthorized" }));
      return;
    }
    try {
      const raw = await readBody(req);
      const payload = JSON.parse(raw);
      const result = await generate(payload);
      if (result.status === 200) {
        res.writeHead(200, {
          "Content-Type": "application/pdf",
          "Content-Length": result.pdf.length,
        });
        res.end(result.pdf);
      } else {
        res.writeHead(result.status, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: result.error, details: result.details }));
      }
    } catch (e) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "bad request" }));
    }
    return;
  }
  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "not found" }));
});

server.listen(PORT, HOST, () => console.log(`pdf-service listening on ${HOST}:${PORT}`));
