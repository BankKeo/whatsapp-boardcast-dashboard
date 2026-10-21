# syntax=docker/dockerfile:1

# ---------------------------------------------------------------------------
# Partner Club dashboard — Next.js 16 (App Router, cacheComponents).
#
# NEXT_PUBLIC_API_URL is inlined into the client bundle at build time, so it
# must be supplied as a build argument, not just a runtime environment variable:
#
#   docker build --build-arg NEXT_PUBLIC_API_URL=https://api.example.com/api/v1 .
# ---------------------------------------------------------------------------

FROM node:24-alpine AS base
RUN npm install --global pnpm@12.6.0
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# --- Dependencies (including dev deps needed for the build) ----------------
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

# --- Production build ------------------------------------------------------
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

RUN pnpm build

# --- Production dependencies only ------------------------------------------
FROM base AS prod-deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile --prod

# --- Runtime ---------------------------------------------------------------
FROM base AS runtime

ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 --ingroup nodejs nextjs

COPY --from=prod-deps --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=build --chown=nextjs:nodejs /app/.next ./.next
COPY --from=build --chown=nextjs:nodejs /app/public ./public
COPY --from=build --chown=nextjs:nodejs /app/next.config.ts ./next.config.ts
COPY --from=build --chown=nextjs:nodejs /app/package.json ./package.json

USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD wget -qO- "http://127.0.0.1:${PORT}/" >/dev/null || exit 1

CMD ["npm", "start"]
