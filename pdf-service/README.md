# pdf-service

LaTeX (tectonic) renderer for ICPC Team Reference PDFs. Mirrors the reference
site's architecture: a standalone container the Next.js app calls over HTTP.

## Endpoints

- `POST /generate` — body is the reference payload (see below), returns
  `application/pdf`. `400` on invalid payload, `500` on compile failure.
- `GET /health` — returns `ok`.

## Payload

```jsonc
{
  "title": "ICPC Team Reference",
  "subtitle": "Team / University",
  "date": "2026-08-11",
  "options": {
    "columns": 2,                    // 1 | 2 | 3
    "fontSize": "small",             // small | medium | large
    "showToc": true,
    "showLineNumbers": true,
    "showCodeHashes": true,
    "pageBreakPerTemplate": false,
    "theme": "light"                 // monochrome | light | dark
  },
  "sections": [
    {
      "title": "Data Structures",
      "topics": [
        { "title": "Fenwick", "complexity": "\\log n", "hash": "A1B2",
          "language": "cpp", "code": "...", "notes": "..." }
      ]
    }
  ]
}
```

Code is written to per-snippet files and included with `\lstinputlisting`, so
code is **never** parsed as TeX (no escaping, no injection). Only metadata is
escaped.

## Run locally

```bash
# needs tectonic on PATH (https://tectonic-typesetting.github.io)
npm run selfcheck   # builds + compiles a sample, asserts %PDF
npm start           # listen on :8080
```

## Deploy (Cloud Run example)

```bash
gcloud run deploy pdf-service --source . --region me-central1 --allow-unauthenticated
```

Then set `PDF_SERVICE_URL=https://<service-url>` in the Next.js app env.
