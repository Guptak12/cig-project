FROM node:22-alpine AS base
RUN npm install -g turbo

# ─── Prune stage — extract only API workspace files ────────────────────────────
FROM base AS pruner
WORKDIR /app
COPY . .
RUN turbo prune @cig/api --docker

# ─── Dependencies ──────────────────────────────────────────────────────────────
FROM base AS deps
WORKDIR /app
COPY --from=pruner /app/out/json/ .
RUN npm install

# ─── Build ─────────────────────────────────────────────────────────────────────
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=pruner /app/out/full/ .
RUN turbo run build --filter=@cig/api

# ─── Runtime ───────────────────────────────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages

EXPOSE 4000
CMD ["node", "dist/index.js"]
