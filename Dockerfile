FROM node:24-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# Placeholders so module-level env checks pass during build; real values are Fly secrets at runtime.
RUN JWT_SECRET=build-only ADMIN_PASSWORD=build-only npm run build

FROM node:24-slim
WORKDIR /app
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
