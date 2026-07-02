FROM node:21.5.0-alpine3.19 AS builder
WORKDIR /root

RUN apk add g++ python3
RUN corepack enable

COPY specifications /root/specifications
COPY apps /root/apps
COPY packages /root/packages
COPY scripts /root/scripts
COPY package.json \
  pnpm-workspace.yaml \
  pnpm-lock.yaml \
  /root/

RUN pnpm initialize
RUN pnpm install --filter @nawadi/api-server --frozen-lockfile
RUN pnpm run --filter @nawadi/api-server build

RUN pnpm \
  --filter @nawadi/api-server \
   deploy \
  --production \
  deployed


FROM node:21.5.0-alpine3.19
WORKDIR /root
ENV NODE_ENV=production

COPY --from=builder /root/deployed /root

ENTRYPOINT [ \
  "sh", \
  "-c", \
  "exec node /root/out/program.js server --port \"${PORT:?PORT is required}\" --pg-uri \"${PGURI:?PGURI is required}\" --supabase-url \"${SUPABASE_URL:?SUPABASE_URL is required}\" --supabase-service-role-key \"${SUPABASE_SERVICE_ROLE_KEY:?SUPABASE_SERVICE_ROLE_KEY is required}\"" \
  ]
