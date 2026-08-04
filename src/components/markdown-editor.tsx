"use client";

import { useState, useRef, useCallback } from "react";
import {
  Bold, Italic, Code, Code2, List, ListOrdered, Link as LinkIcon,
  Heading1, Heading2, Quote, Minus, Eye, Pencil, Sigma,
} from "lucide-react";
import katex from "katex";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
}

function renderMathBlock(latex: string): string {
  try {
    return katex.renderToString(latex.trim(), {
      displayMode: true,
      throwOnError: false,
      trust: true,
    });
  } catch {
    return `<span class="text-error">[math error]</span>`;
  }
}

function renderMathInline(latex: string): string {
  try {
    return katex.renderToString(latex.trim(), {
      displayMode: false,
      throwOnError: false,
      trust: true,
    });
  } catch {
    return `<span class="text-error">[math error]</span>`;
  }
}

export function MarkdownEditor({ value, onChange, placeholder, minHeight = "200px" }: MarkdownEditorProps) {
  const [preview, setPreview] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const wrap = useCallback((before: string, after: string) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = value.substring(start, end);
    const replacement = before + (selected || "text") + after;
    const newValue = value.substring(0, start) + replacement + value.substring(end);
    onChange(newValue);
    setTimeout(() => {
      ta.focus();
      const cursorPos = start + before.length + (selected ? selected.length : 4);
      ta.setSelectionRange(
        selected ? start + before.length : start + before.length,
        selected ? start + before.length + selected.length : cursorPos
      );
    }, 0);
  }, [value, onChange]);

  const insertLine = useCallback((prefix: string) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const lineStart = value.lastIndexOf("\n", start - 1) + 1;
    const newValue = value.substring(0, lineStart) + prefix + value.substring(lineStart);
    onChange(newValue);
    setTimeout(() => {
      ta.focus();
      ta.setSelectionRange(lineStart + prefix.length, lineStart + prefix.length);
    }, 0);
  }, [value, onChange]);

  const insertMath = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = value.substring(start, end);
    const mathBlock = `\n$$\n${selected || "E = mc^2"}\n$$\n`;
    const newValue = value.substring(0, start) + mathBlock + value.substring(end);
    onChange(newValue);
    setTimeout(() => {
      ta.focus();
      if (selected) {
        ta.setSelectionRange(start + 4, start + 4 + selected.length);
      } else {
        ta.setSelectionRange(start + 4, start + 4 + 10);
      }
    }, 0);
  }, [value, onChange]);

  const formatCodeBlock = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = value.substring(start, end);
    const codeBlock = `\`\`\`\n${selected || "code"}\n\`\`\``;
    const newValue = value.substring(0, start) + codeBlock + value.substring(end);
    onChange(newValue);
    setTimeout(() => {
      ta.focus();
      const pos = start + 4 + (selected ? selected.length : 4) + 1;
      ta.setSelectionRange(pos, pos);
    }, 0);
  }, [value, onChange]);

  const tools = [
    { icon: Heading1, action: () => insertLine("# "), title: "Heading 1" },
    { icon: Heading2, action: () => insertLine("## "), title: "Heading 2" },
    { icon: null, action: null, title: "" },
    { icon: Bold, action: () => wrap("**", "**"), title: "Bold" },
    { icon: Italic, action: () => wrap("*", "*"), title: "Italic" },
    { icon: Code, action: () => wrap("`", "`"), title: "Inline Code" },
    { icon: null, action: null, title: "" },
    { icon: List, action: () => insertLine("- "), title: "Bullet List" },
    { icon: ListOrdered, action: () => insertLine("1. "), title: "Numbered List" },
    { icon: Quote, action: () => insertLine("> "), title: "Blockquote" },
    { icon: Minus, action: () => insertLine("---\n"), title: "Horizontal Rule" },
    { icon: LinkIcon, action: () => wrap("[", "](url)"), title: "Link" },
    { icon: null, action: null, title: "" },
    { icon: Code2, action: formatCodeBlock, title: "Code Block (```)" },
    { icon: Sigma, action: insertMath, title: "Math Formula ($$...$$)" },
  ];

  return (
    <div className="border border-border">
      {/* Toolbar */}
      <div className="flex items-center gap-0 border-b border-border bg-muted/30 px-1 py-1 flex-wrap">
        {/* eslint-disable-next-line react-hooks/refs -- ref is only read inside action click handlers, not during render */}
        {tools.map((tool, i) => {
          if (!tool.icon) {
            return <div key={i} className="w-px h-4 bg-border mx-1" />;
          }
          const Icon = tool.icon;
          return (
            <button
              key={i}
              type="button"
              onClick={tool.action!}
              title={tool.title}
              className="flex items-center justify-center h-7 w-7 text-muted-foreground/60 hover:text-primary hover:bg-primary/10 transition-colors"
            >
              <Icon className="h-3.5 w-3.5" />
            </button>
          );
        })}
        <div className="flex-1" />
        <button
          type="button"
          onClick={() => setPreview(!preview)}
          className="flex items-center gap-1.5 h-7 px-2 text-[10px] text-muted-foreground/60 hover:text-primary hover:bg-primary/10 transition-colors uppercase tracking-wider"
        >
          {preview ? <Pencil className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
          {preview ? "Edit" : "Preview"}
        </button>
      </div>

      {/* Editor / Preview */}
      {preview ? (
        <div
          className="p-3 text-sm text-foreground/80 prose prose-sm max-w-none min-h-[200px] font-mono"
          style={{ minHeight }}
          dangerouslySetInnerHTML={{ __html: renderMarkdown(value) }}
        />
      ) : (
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || "Write markdown notes... Use $$ for math formulas"}
          className="w-full p-3 text-sm bg-transparent text-foreground/80 resize-none outline-none font-mono placeholder:text-muted-foreground/30"
          style={{ minHeight }}
        />
      )}
    </div>
  );
}

function renderMarkdown(md: string): string {
  if (!md.trim()) return '<p class="text-muted-foreground/40">Nothing to preview</p>';

  // Extract and replace math blocks first to protect them from other transforms
  const mathBlocks: string[] = [];
  let processed = md.replace(/\$\$\n?([\s\S]*?)\n?\$\$/g, (_, latex) => {
    const placeholder = `%%MATH_BLOCK_${mathBlocks.length}%%`;
    mathBlocks.push(renderMathBlock(latex));
    return placeholder;
  });

  // Extract inline math
  const inlineMath: string[] = [];
  processed = processed.replace(/\$([^\$\n]+?)\$/g, (_, latex) => {
    const placeholder = `%%INLINE_MATH_${inlineMath.length}%%`;
    inlineMath.push(renderMathInline(latex));
    return placeholder;
  });

  // Extract and convert tables (before other transforms to avoid interference)
  const tables: string[] = [];
  processed = processed.replace(/^\|(.+)\|\n\|[-:| ]+\|\n(\|.+\|\n?)*/gm, (match) => {
    const idx = tables.length;
    const rows = match.trim().split('\n');
    const headers = rows[0].split('|').filter(c => c.trim()).map(c => c.trim());
    const aligns = rows[1].split('|').filter(c => c.trim()).map(c => {
      if (/^:.*:$/.test(c)) return 'center';
      if (/:$/.test(c)) return 'right';
      return 'left';
    });
    const dataRows = rows.slice(2).filter(r => r.trim()).map(r => r.split('|').filter(c => c.trim()).map(c => c.trim()));
    let html = '<div class="my-4 overflow-x-auto"><table class="w-full text-xs border-collapse border border-border">';
    html += '<thead><tr>';
    headers.forEach((h, i) => {
      html += `<th class="border border-border px-3 py-1.5 bg-muted/30 font-bold text-left" style="text-align:${aligns[i] || 'left'}">${h}</th>`;
    });
    html += '</tr></thead><tbody>';
    dataRows.forEach(row => {
      if (row.length) {
        html += '<tr>';
        row.forEach((c, i) => {
          html += `<td class="border border-border px-3 py-1" style="text-align:${aligns[i] || 'left'}">${c}</td>`;
        });
        html += '</tr>';
      }
    });
    html += '</tbody></table></div>';
    tables.push(html);
    return `%%TABLE_${idx}%%`;
  });

  // Markdown transforms
  let html = processed
    // Code blocks
    .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre class="bg-muted/50 border border-border p-3 my-2 text-xs overflow-x-auto"><code>$2</code></pre>')
    // Headings
    .replace(/^### (.+)$/gm, '<h3 class="text-sm font-bold mt-4 mb-2 text-foreground">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-base font-bold mt-5 mb-2 text-foreground">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-lg font-bold mt-6 mb-3 text-foreground">$1</h1>')
    // Bold & italic
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code class="bg-muted/50 border border-border px-1 py-0.5 text-xs text-primary">$1</code>')
    // Blockquote
    .replace(/^> (.+)$/gm, '<blockquote class="border-l-2 border-primary/40 pl-3 my-2 text-muted-foreground/70 italic">$1</blockquote>')
    // Horizontal rule
    .replace(/^---$/gm, '<hr class="border-border my-4" />')
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-primary underline underline-offset-2 hover:text-primary/80">$1</a>')
    // Unordered list items
    .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc text-sm">$1</li>')
    // Ordered list items
    .replace(/^\d+\. (.+)$/gm, '<li class="ml-4 list-decimal text-sm">$1</li>')
    // Paragraphs
    .replace(/\n\n/g, '</p><p class="my-2 text-sm">')
    // Line breaks
    .replace(/\n/g, '<br />');

  html = '<p class="my-2 text-sm">' + html + '</p>';

  // Restore math blocks
  mathBlocks.forEach((math, i) => {
    html = html.replace(`%%MATH_BLOCK_${i}%%`, `<div class="my-4 text-center overflow-x-auto">${math}</div>`);
  });

  // Restore inline math
  inlineMath.forEach((math, i) => {
    html = html.replace(`%%INLINE_MATH_${i}%%`, `<span class="inline-block align-middle">${math}</span>`);
  });

  // Restore tables
  tables.forEach((tbl, i) => {
    html = html.replace(`%%TABLE_${i}%%`, tbl);
  });

  return html;
}
