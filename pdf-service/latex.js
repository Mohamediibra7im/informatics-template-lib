// Builds a KACTL-style LaTeX document from a reference payload.
// Code is emitted via \lstinputlisting (snippet files) so it is NEVER parsed
// as TeX — no escaping of code, and TeX injection through code is impossible.
// Only metadata (titles, subtitle, notes) is escaped.

const LATEX_SPECIALS = [
  [/\\/g, "\\textbackslash{}"],
  [/&/g, "\\&"],
  [/%/g, "\\%"],
  [/\$/g, "\\$"],
  [/#/g, "\\#"],
  [/_/g, "\\_"],
  [/\{/g, "\\{"],
  [/\}/g, "\\}"],
  [/~/g, "\\textasciitilde{}"],
  [/\^/g, "\\textasciicircum{}"],
];

function esc(s) {
  let out = String(s ?? "");
  for (const [re, rep] of LATEX_SPECIALS) out = out.replace(re, rep);
  return out;
}

const FONT_SIZE = { small: "\\footnotesize", medium: "\\small", large: "\\normalsize" };

// map incoming language string -> listings language (empty = plain text)
function lstLanguage(lang) {
  const l = String(lang || "").toLowerCase();
  if (["cpp", "c++", "cc", "cxx", "c"].includes(l)) return "C++";
  if (l === "python" || l === "py") return "Python";
  if (l === "java") return "Java";
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
\\usepackage{fancyhdr}
\\usepackage{lastpage}
\\usepackage[hidelinks]{hyperref}
\\usepackage{titlesec}

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

// Emits body. `snippets` is filled with {name, code} for the caller to write.
function body(payload, snippets) {
  const { title, subtitle, options, sections } = payload;
  const out = [];

  // Title page — unnumbered, page counter reset so Contents == page 1
  out.push("\\begin{document}");
  out.push("\\thispagestyle{empty}");
  out.push("\\vspace*{\\fill}");
  out.push("\\begin{center}");
  out.push(`{\\Huge\\bfseries ${esc(title || "ICPC Team Reference")}\\par}`);
  if (subtitle) out.push(`\\vspace{1em}{\\large ${esc(subtitle)}\\par}`);
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
    out.push(`\\section{${esc(sec.title || "Section")}}`);
    (sec.topics || []).forEach((t, ti) => {
      let heading = esc(t.title || "Untitled");
      if (t.complexity) heading += ` $O(${esc(t.complexity)})$`;
      if (options.showCodeHashes && t.hash) heading += ` \\texttt{\\small[${esc(t.hash)}]}`;
      out.push(`\\subsection{${heading}}`);

      const name = `snippets/s${si}_t${ti}.txt`;
      snippets.push({ name, code: t.code || "// (no code)" });
      const lang = lstLanguage(t.language);
      const langOpt = lang ? `[language=${lang}]` : "";
      out.push(`\\lstinputlisting${langOpt}{${name}}`);

      if (t.notes) {
        out.push(`{\\small\\itshape\\color{cmt} ${esc(t.notes)}\\par}`);
      }
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

module.exports = { buildLatex, esc };
