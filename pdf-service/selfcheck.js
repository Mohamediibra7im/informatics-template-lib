// Self-check: build .tex from a sample payload, compile, assert %PDF out.
// Run: node selfcheck.js   (requires tectonic on PATH)

const fs = require("fs/promises");
const os = require("os");
const path = require("path");
const assert = require("assert");
const { buildLatex } = require("./latex");
const { spawn } = require("child_process");

const SAMPLE = {
  title: "ICPC Team Reference",
  subtitle: "Self Check Team",
  date: "2026-08-11",
  options: {
    columns: 2, fontSize: "small", showToc: true, showLineNumbers: true,
    showCodeHashes: true, pageBreakPerTemplate: false, theme: "light",
  },
  sections: [
    {
      title: "Data Structures",
      topics: [
        {
          title: "Fenwick Tree", complexity: "\\log n", hash: "A1B2", language: "cpp",
          code: "struct BIT {\n  vector<int> t;\n  // add & to test escaping in code path\n  void upd(int i,int v){ for(;i<t.size();i+=i&-i) t[i]+=v; }\n};",
          notes: "Point update, prefix query. Special chars: 50% & $x$.",
        },
        { title: "Union Find", language: "cpp", code: "int f[N];\nint find(int x){return f[x]==x?x:f[x]=find(f[x]);}" },
      ],
    },
    { title: "Math", topics: [{ title: "gcd", language: "cpp", code: "ll gcd(ll a,ll b){return b?gcd(b,a%b):a;}" }] },
  ],
};

async function main() {
  const { tex, snippets } = buildLatex(SAMPLE);
  assert(tex.includes("\\begin{document}"), "tex missing document");
  assert(tex.includes("\\lstinputlisting"), "tex missing listings");
  assert(snippets.length === 3, `expected 3 snippets, got ${snippets.length}`);
  console.log("latex build ok:", snippets.length, "snippets");

  // Compile only if tectonic present
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "selfcheck-"));
  await fs.mkdir(path.join(dir, "snippets"), { recursive: true });
  await fs.writeFile(path.join(dir, "main.tex"), tex);
  await Promise.all(snippets.map((s) => fs.writeFile(path.join(dir, s.name), s.code)));

  await new Promise((resolve, reject) => {
    const p = spawn("tectonic", ["main.tex", "--outdir", dir, "--chatter", "minimal"], { cwd: dir });
    let err = "";
    p.stderr.on("data", (d) => (err += d));
    p.on("error", (e) => reject(new Error("tectonic not found: " + e.message)));
    p.on("close", (c) => (c === 0 ? resolve() : reject(new Error(err))));
  });

  const pdf = await fs.readFile(path.join(dir, "main.pdf"));
  assert(pdf.length > 1000, "pdf too small");
  assert(pdf.slice(0, 5).toString() === "%PDF-", "not a PDF");
  console.log("compile ok:", pdf.length, "bytes");
  await fs.rm(dir, { recursive: true, force: true });
  console.log("SELFCHECK PASSED");
}

main().catch((e) => { console.error("SELFCHECK FAILED:", e.message); process.exit(1); });
