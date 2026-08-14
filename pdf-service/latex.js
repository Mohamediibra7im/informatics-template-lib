// Builds a KACTL-style LaTeX document from a reference payload.
// Code is emitted via \lstinputlisting (snippet files) so it is NEVER parsed
// as TeX — no escaping of code, and TeX injection through code is impossible.
// Titles/subtitle are escaped; notes go through a small Markdown+math converter.

const LATEX_SPECIAL_RE = /[\\&%$#_{}~^]/g;

const UNICODE_MAP = [
  [/—/g, "---"],
  [/–/g, "--"],
  [/’/g, "'"],
  [/‘/g, "`"],
  [/“/g, "``"],
  [/”/g, "''"],
  [/…/g, "\\dots "],
  [/≤/g, "$\\le$"],
  [/≥/g, "$\\ge$"],
  [/≠/g, "$\\neq$"],
  [/→/g, "$\\to$"],
  [/←/g, "$\\leftarrow$"],
  [/∞/g, "$\\infty$"],
  [/α/g, "$\\alpha$"],
  [/β/g, "$\\beta$"],
  [/π/g, "$\\pi$"],
  [/λ/g, "$\\lambda$"],
  [/µ/g, "$\\mu$"],
  [/°/g, "$^\\circ$"],
  [/±/g, "$\\pm$"],
  [/×/g, "$\\times$"],
  [/÷/g, "$\\div$"],
  [/·/g, "$\\cdot$"],
  [/∈/g, "$\\in$"],
  [/∉/g, "$\\notin$"],
  [/⊆/g, "$\\subseteq$"],
  [/⊂/g, "$\\subset$"],
  [/∪/g, "$\\cup$"],
  [/∩/g, "$\\cap$"],
  [/∑/g, "$\\sum$"],
  [/∏/g, "$\\prod$"],
  [/√/g, "$\\sqrt$"],
  [/≈/g, "$\\approx$"],
  [/≡/g, "$\\equiv$"],
  [/⇒/g, "$\\Rightarrow$"],
  [/⇔/g, "$\\Leftrightarrow$"],
  [/⊕/g, "$\\oplus$"],
  [/⊗/g, "$\\otimes$"],
  [/✓/g, "$\\checkmark$"],
  [/✔/g, "$\\checkmark$"],
];

function esc(s) {
  let str = String(s ?? "")
    .replace(/[\u0001-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    .replace(LATEX_SPECIAL_RE, (m) => {
      switch (m) {
        case "\\": return "\\textbackslash{}";
        case "&": return "\\&";
        case "%": return "\\%";
        case "$": return "\\$";
        case "#": return "\\#";
        case "_": return "\\_";
        case "{": return "\\{";
        case "}": return "\\}";
        case "~": return "\\textasciitilde{}";
        case "^": return "\\textasciicircum{}";
        default: return m;
      }
    });
  for (const [re, rep] of UNICODE_MAP) {
    str = str.replace(re, rep);
  }
  return str;
}

// Inline formatting: protect fenced code blocks, math & code spans, escape text, apply bold/italic/strikethrough
function inline(text) {
  const raw = String(text ?? "");
  const holds = [];
  const hold = (tex) => `\x00${holds.push(tex) - 1}\x00`;

  // 1. Protect fenced code blocks (```lang ... ```)
  let s = raw.replace(/```(\w*)\r?\n([\s\S]*?)\r?\n?```/g, (_, lang, code) => {
    const l = lstLanguage(lang);
    const langOpt = l ? `[language=${l}]` : "";
    return hold(`\\begin{lstlisting}${langOpt}\n${code}\n\\end{lstlisting}`);
  });

  // 2. Protect display math, single-line inline math, and inline code
  s = s
    .replace(/\$\$([^\$]+?)\$\$/g, (_, m) => hold(`\\[${m}\\]`))
    .replace(/\$([^\s$](?:[^\$\r\n]*[^\s$])?)\$/g, (_, m) => hold(`$${m}$`))
    .replace(/`([^`]+)`/g, (_, c) => hold(`\\texttt{${esc(c)}}`));

  let t = esc(s);
  t = t.replace(/\\textasciitilde{}\\textasciitilde{}(.+?)\\textasciitilde{}\\textasciitilde{}/g, "\\sout{$1}");
  t = t.replace(/\*\*\*([^*]+)\*\*\*/g, "\\textbf{\\textit{$1}}");
  t = t.replace(/\*\*([^*]+)\*\*/g, "\\textbf{$1}");
  t = t.replace(/(^|[^*])\*([^*]+)\*(?!\*)/g, "$1\\textit{$2}");
  t = t.replace(/\x00(\d+)\x00/g, (_, i) => holds[Number(i)]);
  return t;
}

// Convert note Markdown (+ inline $math$) to LaTeX.
function mdToLatex(md) {
  const raw = String(md ?? "");
  const holds = [];
  const hold = (tex) => `\x00${holds.push(tex) - 1}\x00`;

  // 1. Protect fenced code blocks (```lang ... ```)
  let s = raw.replace(/```(\w*)\r?\n([\s\S]*?)\r?\n?```/g, (_, lang, code) => {
    const l = lstLanguage(lang);
    const langOpt = l ? `[language=${l}]` : "";
    return hold(`\\begin{lstlisting}${langOpt}\n${code}\n\\end{lstlisting}`);
  });

  // 2. Protect display math ($$...$$)
  s = s.replace(/\$\$([^\$]+?)\$\$/g, (_, m) => hold(`\\[${m}\\]`));

  const parseTableCells = (rowStr) => {
    let s = rowStr.trim();
    if (s.startsWith("|")) s = s.slice(1);
    if (s.endsWith("|")) s = s.slice(0, -1);
    return s.split("|").map((c) => c.trim());
  };

  const isSeparatorRow = (rowStr) => {
    const cells = parseTableCells(rowStr);
    return cells.length > 0 && cells.every((c) => /^:?-+:?$/.test(c));
  };

  const lines = s.split(/\r?\n/);
  const out = [];
  let inList = null; // null | "ul" | "ol" | "quote"

  const closeList = () => {
    if (inList === "ul") out.push("\\end{itemize}");
    else if (inList === "ol") out.push("\\end{enumerate}");
    else if (inList === "quote") out.push("\\end{quote}");
    inList = null;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    if (!trimmed) { closeList(); out.push(""); continue; }

    // Stashed hold on its own line (e.g. fenced code block or display math)
    if (trimmed.startsWith("\x00") && trimmed.endsWith("\x00")) {
      closeList();
      const idx = Number(trimmed.slice(1, -1));
      if (!isNaN(idx) && holds[idx] !== undefined) {
        out.push(holds[idx]);
        continue;
      }
    }

    // Horizontal rule
    if (/^(---|\*\*\*|___)$/.test(trimmed)) {
      closeList();
      out.push("\\vspace{3pt}\\hrulefill\\vspace{3pt}\\par");
      continue;
    }

    // Markdown table detection
    if (trimmed.includes("|") && i + 1 < lines.length && isSeparatorRow(lines[i + 1])) {
      closeList();
      const headerCells = parseTableCells(trimmed);
      const sepCells = parseTableCells(lines[i + 1]);

      const colAligns = sepCells.map((c) => {
        const left = c.startsWith(":");
        const right = c.endsWith(":");
        if (left && right) return "c";
        if (right) return "r";
        return "l";
      });
      while (colAligns.length < headerCells.length) colAligns.push("l");

      const tableRows = [];
      tableRows.push(headerCells.map((c) => `\\textbf{${inline(c)}}`).join(" & ") + " \\\\ \\hline");

      i += 2;
      while (i < lines.length && lines[i].trim().includes("|")) {
        const rowCells = parseTableCells(lines[i]);
        if (rowCells.length > 0) {
          tableRows.push(rowCells.map((c) => inline(c)).join(" & ") + " \\\\");
        }
        i++;
      }
      i--;

      out.push(`\\vspace{2pt}\\noindent\\begin{tabular}{${colAligns.join(" ")}}\\hline`);
      out.push(tableRows.join("\n"));
      out.push("\\hline\\end{tabular}\\vspace{2pt}");
      continue;
    }

    // Heading
    const heading = trimmed.match(/^#{1,6}\s+(.*)$/);
    if (heading) {
      closeList();
      out.push(`\\vspace{4pt}\\textbf{${inline(heading[1])}}\\par\\nopagebreak`);
      continue;
    }

    // Blockquote
    const quote = trimmed.match(/^>\s*(.*)$/);
    if (quote) {
      if (inList !== "quote") { closeList(); out.push("\\begin{quote}"); inList = "quote"; }
      out.push(inline(quote[1]) + "\\par");
      continue;
    }

    // Bullet list
    const bullet = trimmed.match(/^[-*]\s+(.*)$/);
    if (bullet) {
      if (inList !== "ul") { closeList(); out.push("\\begin{itemize}[leftmargin=1.2em,itemsep=0pt,topsep=2pt]"); inList = "ul"; }
      out.push(`\\item ${inline(bullet[1])}`);
      continue;
    }

    // Numbered list
    const num = trimmed.match(/^\d+\.\s+(.*)$/);
    if (num) {
      if (inList !== "ol") { closeList(); out.push("\\begin{enumerate}[leftmargin=1.2em,itemsep=0pt,topsep=2pt]"); inList = "ol"; }
      out.push(`\\item ${inline(num[1])}`);
      continue;
    }

    closeList();
    out.push(inline(trimmed) + "\\par");
  }
  closeList();
  let res = out.join("\n");
  res = res.replace(/\x00(\d+)\x00/g, (_, i) => holds[Number(i)] ?? "");
  return res;
}

const FONT_SIZE = { small: "\\footnotesize", medium: "\\small", large: "\\normalsize" };

// map incoming language string -> listings language (empty = plain text)
function lstLanguage(lang) {
  const l = String(lang || "").toLowerCase();
  if (["cpp", "c++", "cc", "cxx", "c"].includes(l)) return "C++";
  if (l === "python" || l === "py") return "Python";
  if (l === "java") return "Java";
  if (l === "rust" || l === "rs") return "Rust";
  if (l === "go" || l === "golang") return "GnuAs";
  return ""; // plain
}

// theme -> code color scheme. monochrome = grayscale; light/dark = colored.
// dark is accepted but mapped to a print-safe (light-bg) scheme by design.
function themeColors(theme) {
  if (theme === "monochrome") {
    return {
      kw: "0,0,0", kw2: "0,0,0", cmt: "0.45,0.45,0.45",
      str: "0.30,0.30,0.30", num: "0.30,0.30,0.30", bg: "0.96,0.96,0.97",
      bold: true,
    };
  }
  // light (and dark, print-safe) — matches the reference palette
  return {
    kw: "0.77,0.10,0.30", kw2: "0.13,0.40,0.75", cmt: "0.55,0.55,0.55",
    str: "0.10,0.55,0.35", num: "0.45,0.20,0.65", bg: "0.96,0.96,0.97",
    bold: true,
  };
}

const TYPE_KEYWORDS =
  "vector,string,map,set,multiset,unordered_map,unordered_set,deque,queue," +
  "priority_queue,stack,pair,tuple,array,ll,vll,vi,vvi,vvvi,pii,int64_t," +
  "uint64_t,size_t,uint32_t,int32_t";

function preamble(options) {
  const c = themeColors(options.theme);
  const codeSize = FONT_SIZE[options.fontSize] || FONT_SIZE.small;
  const numbers = options.showLineNumbers ? "left" : "none";
  const kwbold = c.bold ? "\\bfseries" : "";
  return `\\documentclass[a4paper,10pt]{article}
\\usepackage[T1]{fontenc}
\\usepackage[utf8]{inputenc}
\\usepackage{lmodern}
\\usepackage[margin=1.6cm]{geometry}
\\usepackage{multicol}
\\usepackage{listings}
\\usepackage{xcolor}
\\usepackage{amsmath,amssymb}
\\usepackage[normalem]{ulem}
\\usepackage{enumitem}
\\usepackage{fancyhdr}
\\usepackage{lastpage}
\\usepackage[hidelinks]{hyperref}
\\usepackage{titlesec}

\\providecommand{\\DeclareUnicodeCharacter}[2]{}
\\DeclareUnicodeCharacter{2264}{\\ensuremath{\\le}}
\\DeclareUnicodeCharacter{2265}{\\ensuremath{\\ge}}
\\DeclareUnicodeCharacter{2260}{\\ensuremath{\\neq}}
\\DeclareUnicodeCharacter{2192}{\\ensuremath{\\to}}
\\DeclareUnicodeCharacter{2190}{\\ensuremath{\\leftarrow}}
\\DeclareUnicodeCharacter{221E}{\\ensuremath{\\infty}}
\\DeclareUnicodeCharacter{2014}{---}
\\DeclareUnicodeCharacter{2013}{--}
\\DeclareUnicodeCharacter{2018}{\\textquoteleft}
\\DeclareUnicodeCharacter{2019}{\\textquoteright}
\\DeclareUnicodeCharacter{201C}{\\textquotedblleft}
\\DeclareUnicodeCharacter{201D}{\\textquotedblright}
\\DeclareUnicodeCharacter{2026}{\\dots}
\\DeclareUnicodeCharacter{03B1}{\\ensuremath{\\alpha}}
\\DeclareUnicodeCharacter{03B2}{\\ensuremath{\\beta}}
\\DeclareUnicodeCharacter{03C0}{\\ensuremath{\\pi}}
\\DeclareUnicodeCharacter{03BB}{\\ensuremath{\\lambda}}
\\DeclareUnicodeCharacter{03BC}{\\ensuremath{\\mu}}
\\DeclareUnicodeCharacter{00B1}{\\ensuremath{\\pm}}
\\DeclareUnicodeCharacter{00D7}{\\ensuremath{\\times}}
\\DeclareUnicodeCharacter{00F7}{\\ensuremath{\\div}}
\\DeclareUnicodeCharacter{00B7}{\\ensuremath{\\cdot}}
\\DeclareUnicodeCharacter{2208}{\\ensuremath{\\in}}
\\DeclareUnicodeCharacter{2209}{\\ensuremath{\\notin}}
\\DeclareUnicodeCharacter{2286}{\\ensuremath{\\subseteq}}
\\DeclareUnicodeCharacter{2282}{\\ensuremath{\\subset}}
\\DeclareUnicodeCharacter{222A}{\\ensuremath{\\cup}}
\\DeclareUnicodeCharacter{2229}{\\ensuremath{\\cap}}
\\DeclareUnicodeCharacter{2211}{\\ensuremath{\\sum}}
\\DeclareUnicodeCharacter{220F}{\\ensuremath{\\prod}}
\\DeclareUnicodeCharacter{221A}{\\ensuremath{\\sqrt}}
\\DeclareUnicodeCharacter{2248}{\\ensuremath{\\approx}}
\\DeclareUnicodeCharacter{2261}{\\ensuremath{\\equiv}}
\\DeclareUnicodeCharacter{21D2}{\\ensuremath{\\Rightarrow}}
\\DeclareUnicodeCharacter{21D4}{\\ensuremath{\\Leftrightarrow}}
\\DeclareUnicodeCharacter{2295}{\\ensuremath{\\oplus}}
\\DeclareUnicodeCharacter{2297}{\\ensuremath{\\otimes}}
\\DeclareUnicodeCharacter{2713}{\\ensuremath{\\checkmark}}
\\DeclareUnicodeCharacter{2714}{\\ensuremath{\\checkmark}}

\\definecolor{kw}{rgb}{${c.kw}}
\\definecolor{kwtwo}{rgb}{${c.kw2}}
\\definecolor{cmt}{rgb}{${c.cmt}}
\\definecolor{str}{rgb}{${c.str}}
\\definecolor{num}{rgb}{${c.num}}
\\definecolor{codebg}{rgb}{${c.bg}}

\\lstdefinestyle{ref}{
  basicstyle=\\ttfamily${codeSize},
  keywordstyle=\\color{kw}${kwbold},
  keywordstyle=[2]\\color{kwtwo},
  commentstyle=\\color{cmt}\\itshape,
  stringstyle=\\color{str},
  numberstyle=\\tiny\\color{cmt},
  numbers=${numbers},
  numbersep=5pt,
  showstringspaces=false,
  breaklines=true,
  breakatwhitespace=false,
  postbreak=\\mbox{\\textcolor{cmt}{$\\hookrightarrow$}\\space},
  columns=fullflexible,
  keepspaces=true,
  tabsize=2,
  backgroundcolor=\\color{codebg},
  frame=none,
  xleftmargin=2pt,
  aboveskip=4pt,
  belowskip=6pt,
  extendedchars=true,
  literate=
    {—}{{---}}1
    {–}{{--}}1
    {’}{{\\textquoteright}}1
    {‘}{{\\textquoteleft}}1
    {“}{{\\textquotedblleft}}1
    {”}{{\\textquotedblright}}1
    {…}{{\\dots}}1
    {≤}{{$\\le$}}1
    {≥}{{$\\ge$}}1
    {≠}{{$\\neq$}}1
    {→}{{$\\to$}}1
    {←}{{$\\leftarrow$}}1
    {∞}{{$\\infty$}}1
    {α}{{$\\alpha$}}1
    {β}{{$\\beta$}}1
    {π}{{$\\pi$}}1
    {λ}{{$\\lambda$}}1
    {µ}{{$\\mu$}}1
    {°}{{$^\\circ$}}1
    {±}{{$\\pm$}}1
    {×}{{$\\times$}}1
    {÷}{{$\\div$}}1
    {·}{{$\\cdot$}}1
    {∈}{{$\\in$}}1
    {∉}{{$\\notin$}}1
    {⊆}{{$\\subseteq$}}1
    {⊂}{{$\\subset$}}1
    {∪}{{$\\cup$}}1
    {∩}{{$\\cap$}}1
    {∑}{{$\\sum$}}1
    {∏}{{$\\prod$}}1
    {√}{{$\\sqrt$}}1
    {≈}{{$\\approx$}}1
    {≡}{{$\\equiv$}}1
    {⇒}{{$\\Rightarrow$}}1
    {⇔}{{$\\Leftrightarrow$}}1
    {⊕}{{$\\oplus$}}1
    {⊗}{{$\\otimes$}}1
    {✓}{{$\\checkmark$}}1
    {✔}{{$\\checkmark$}}1,
  morekeywords=[2]{${TYPE_KEYWORDS}},
}
\\lstset{style=ref}

% tighter section headings, KACTL feel
\\titlespacing*{\\section}{0pt}{6pt}{4pt}
\\titlespacing*{\\subsection}{0pt}{6pt}{2pt}
\\titleformat{\\section}{\\normalfont\\large\\bfseries}{\\thesection.}{0.5em}{}
\\titleformat{\\subsection}{\\normalfont\\normalsize\\bfseries}{\\thesubsection.}{0.5em}{}

\\pagestyle{fancy}
\\fancyhf{}
\\cfoot{\\small\\thepage\\ /\\ \\pageref{LastPage}}
\\renewcommand{\\headrulewidth}{0pt}
\\setcounter{secnumdepth}{2}
\\setcounter{tocdepth}{2}
`;
}

const CODE_UNICODE_MAP = [
  [/→/g, "->"],
  [/←/g, "<-"],
  [/≤/g, "<="],
  [/≥/g, ">="],
  [/≠/g, "!="],
  [/⇒/g, "=>"],
  [/⇔/g, "<=>"],
  [/—/g, "--"],
  [/–/g, "--"],
  [/…/g, "..."],
  [/°/g, "deg"],
  [/±/g, "+/-"],
  [/×/g, "*"],
  [/÷/g, "/"],
  [/·/g, "*"],
  [/∞/g, "inf"],
  [/α/g, "alpha"],
  [/β/g, "beta"],
  [/π/g, "pi"],
  [/λ/g, "lambda"],
  [/µ/g, "mu"],
  [/⊕/g, "^"],
  [/⊗/g, "*"],
  [/✓/g, "OK"],
  [/✔/g, "OK"],
  [/’/g, "'"],
  [/‘/g, "'"],
  [/“/g, '"'],
  [/”/g, '"'],
];

function sanitizeCode(code) {
  let s = String(code ?? "");
  for (const [re, rep] of CODE_UNICODE_MAP) {
    s = s.replace(re, rep);
  }
  // Strip any remaining non-ASCII characters to guarantee clean ec-lmtt8 font rendering in TeX listings
  s = s.replace(/[^\x00-\x7F\r\n\t]/g, "");
  return s;
}

// Emits body. `snippets` is filled with {name, code} for the caller to write.
function formatComplexity(comp) {
  if (!comp) return "";
  let c = String(comp).trim();
  if (!c) return "";
  if (c.startsWith("$") && c.endsWith("$")) {
    c = c.slice(1, -1);
  }
  const m = c.match(/^O\((.*)\)$/i);
  if (m) c = m[1].trim();

  c = c.replace(/—/g, "---").replace(/–/g, "--").replace(/→/g, "\\to ").replace(/←/g, "\\leftarrow ");
  c = c.replace(/_([a-zA-Z0-9])/g, "_{$1}").replace(/\^([a-zA-Z0-9])/g, "^{$1}");

  return ` $O(${c})$`;
}

function body(payload, snippets) {
  const { title, subtitle, options, sections } = payload;
  const out = [];

  // Title page — unnumbered, page counter reset so Contents == page 1
  out.push("\\begin{document}");
  out.push("\\thispagestyle{empty}");
  out.push("\\vspace*{\\fill}");
  out.push("\\begin{center}");
  out.push(`{\\Huge\\bfseries ${inline(title || "ICPC Team Reference")}\\par}`);
  if (subtitle) out.push(`\\vspace{1em}{\\large ${inline(subtitle)}\\par}`);
  out.push("\\vspace{1.5em}{\\small " + esc(payload.date || "") + "\\par}");
  out.push("\\end{center}");
  out.push("\\vspace*{\\fill}");
  out.push("\\clearpage");
  out.push("\\setcounter{page}{1}");

  if (options.showToc) {
    out.push("\\tableofcontents");
    out.push("\\clearpage");
  }

  const cols = Math.min(3, Math.max(1, Number(options.columns) || 2));
  if (cols > 1) out.push(`\\begin{multicols}{${cols}}`);

  sections.forEach((sec, si) => {
    out.push(`\\section{${inline(sec.title || "Section")}}`);
    (sec.topics || []).forEach((t, ti) => {
      const heading = inline(t.title || "Untitled") + formatComplexity(t.complexity);
      out.push(`\\subsection{${heading}}`);

      const name = `snippets/s${si}_t${ti}.txt`;
      snippets.push({ name, code: sanitizeCode(t.code || "// (no code)") });
      const lang = lstLanguage(t.language);
      const langOpt = lang ? `[language=${lang}]` : "";

      // notes above code (rendered as normal small text)
      if (t.notes && String(t.notes).trim()) {
        const renderedNotes = mdToLatex(t.notes).trim();
        if (renderedNotes) {
          out.push(`\\begingroup\\small\\setlength{\\parindent}{0pt}\n${renderedNotes}\n\\endgroup`);
        }
      }
      out.push(`\\lstinputlisting${langOpt}{${name}}`);

      if (options.pageBreakPerTemplate) out.push("\\newpage");
    });
  });

  if (cols > 1) out.push("\\end{multicols}");
  out.push("\\end{document}");
  return out.join("\n");
}

// Returns { tex, snippets:[{name, code}] }
function buildLatex(payload) {
  const options = payload.options || {};
  const snippets = [];
  const tex = preamble(options) + "\n" + body({ ...payload, options }, snippets);
  return { tex, snippets };
}

module.exports = { buildLatex, esc, mdToLatex };
