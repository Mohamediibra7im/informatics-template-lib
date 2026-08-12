import React from "react";

/**
 * Syntax colorizer for C++/Python code in ICPC TRD PDF previews.
 */
export function highlightCodeLine(line: string): React.ReactNode {
  if (!line) return "\u00A0";

  // If whole line is a comment
  if (line.trim().startsWith("//") || line.trim().startsWith("///")) {
    return <span className="text-gray-500 italic font-mono">{line}</span>;
  }

  // Tokenize line with regex
  const tokens: React.ReactNode[] = [];
  let keyIdx = 0;

  const CXX_KEYWORDS = new Set([
    "const", "int", "void", "for", "if", "else", "while", "do", "struct", "class",
    "template", "typename", "return", "using", "namespace", "public", "private",
    "protected", "typedef", "inline", "explicit", "#define", "#include", "#pragma",
    "auto", "operator", "const_cast", "static_cast", "reinterpret_cast", "bool",
    "char", "long", "short", "double", "float", "unsigned", "signed", "true", "false",
    "nullptr", "NULL"
  ]);

  const TYPE_NAMES = new Set([
    "vector", "string", "map", "set", "multiset", "deque", "queue", "stack", "pair",
    "ll", "vll", "vi", "vvi", "vvvi", "pii", "int64_t", "uint64_t", "size_t", "uint32_t"
  ]);

  const regex = /(\/\/[^\n]*|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\b[A-Za-z_][A-Za-z0-9_]*\b|\b0x[0-9a-fA-F]+\b|\b\d+(?:\.\d+)?(?:e[+-]?\d+)?\b|[^\sA-Za-z0-9_]+|\s+)/g;

  let match;
  while ((match = regex.exec(line)) !== null) {
    const token = match[0];

    if (token.startsWith("//")) {
      tokens.push(<span key={keyIdx++} className="text-gray-400 italic font-mono">{token}</span>);
    } else if (token.startsWith('"') || token.startsWith("'")) {
      tokens.push(<span key={keyIdx++} className="text-emerald-600 font-mono">{token}</span>);
    } else if (CXX_KEYWORDS.has(token)) {
      tokens.push(<span key={keyIdx++} className="text-rose-600 font-bold font-mono">{token}</span>);
    } else if (TYPE_NAMES.has(token) || /^[A-Z][A-Za-z0-9_]*$/.test(token)) {
      tokens.push(<span key={keyIdx++} className="text-blue-600 font-semibold font-mono">{token}</span>);
    } else if (/^\d/.test(token) || token.startsWith("0x")) {
      tokens.push(<span key={keyIdx++} className="text-purple-600 font-mono">{token}</span>);
    } else {
      tokens.push(<span key={keyIdx++} className="font-mono">{token}</span>);
    }
  }

  return tokens.length > 0 ? tokens : line;
}
