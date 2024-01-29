FROM node:21.5.0-alpine3.19 AS builder
WORKDIR /root

RUN corepack enable

COPY packages /root/packages
COPY generated /root/generated
COPY package.json \
  pnpm-workspace.yaml \
  pnpm-lock.yaml \
  /root/

RUN pnpm install \
  --filter nwd-api-server \
  --frozen-lockfile

RUN pnpm deploy \
  --filter nwd-api-server \
  --frozen-lockfile \
  --production \
  deployed


FROM node:21.5.0-alpine3.19
WORKDIR /root
ENV NODE_ENV=production

COPY --from=builder /root/deployed /root

ENTRYPOINT [ \
  "/root/bin/nwd-api-server" \
  ]
