# pdf-service: Node + tectonic (single-binary LaTeX engine).
# Deploy on Cloud Run / Fly / Railway. Stateless, no app env needed.
FROM node:20-bookworm-slim

# tectonic runtime deps + CA certs (first compile fetches packages, then cached)
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates curl \
 && rm -rf /var/lib/apt/lists/*

# Install tectonic (single static binary)
RUN curl -fsSL https://github.com/tectonic-typesetting/tectonic/releases/download/tectonic%400.15.0/tectonic-0.15.0-x86_64-unknown-linux-musl.tar.gz \
    | tar -xz -C /usr/local/bin tectonic \
 && chmod +x /usr/local/bin/tectonic \
 && tectonic --version

WORKDIR /app
COPY package.json ./
COPY server.js latex.js selfcheck.js ./

# Warm the tectonic package cache into the image so runtime compiles are
# offline & fast. Runs the self-check as a build-time smoke test.
RUN node selfcheck.js

# non-root
RUN useradd -m appuser && chown -R appuser /app
USER appuser

ENV PORT=8080
# Container is fronted by the platform proxy (Fly/Railway) — bind all interfaces.
# Auth is enforced via PDF_SERVICE_TOKEN (set as a platform secret).
ENV HOST=0.0.0.0
EXPOSE 8080
CMD ["node", "server.js"]
