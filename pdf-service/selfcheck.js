// Self-check: build .tex from a sample payload, compile, assert %PDF out.
// Run: node selfcheck.js   (requires tectonic on PATH)

const fs = require("fs/promises");
const os = require("os");
const path = require("path");
const assert = require("assert");
const { buildLatex, mdToLatex } = require("./latex");
const { spawn } = require("child_process");

// --- mdToLatex unit checks (the note parser is the non-trivial logic) ---
{
  // math backslashes survive, not mangled to \{}Sigma
  const m = mdToLatex("children up to $\\Sigma$ nodes");
  assert(m.includes("$\\Sigma$"), `math not preserved: ${m}`);
  assert(!m.includes("\\{}Sigma"), `math got escaped: ${m}`);
  // heading -> bold, not literal ##
  assert(mdToLatex("## How It Works").includes("\\textbf{"), "heading not bold");
  assert(!mdToLatex("## How It Works").includes("\\#\\#"), "heading left literal");
  // bullets -> itemize
  assert(mdToLatex("- a\n- b").includes("\\begin{itemize}"), "bullets not list");
  // inline code -> texttt, literal underscores inside
  assert(mdToLatex("`a_b`").includes("\\texttt{a\\_b}"), "inline code wrong");
  // bold + a real number nearby must not collide with placeholders
  const n = mdToLatex("up to **26** children and $s$ chars");
  assert(n.includes("\\textbf{26}") && n.includes("$s$"), `collision: ${n}`);
  console.log("mdToLatex checks ok");
}

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
          notes: "## Overview\nPoint update, prefix query. Special chars: 50% & $x$.\n\n## Complexity\n- All ops $O(\\log n)$\n- Space $O(n)$ with up to **26** children",
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
