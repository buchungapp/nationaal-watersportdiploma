FROM node:21.5.0-alpine3.19 AS builder
WORKDIR /root

RUN apk add g++ python3
RUN corepack enable

COPY specifications /root/specifications
COPY apps /root/apps
COPY packages /root/packages
COPY package.json \
  pnpm-workspace.yaml \
  pnpm-lock.yaml \
  /root/

RUN pnpm initialize
RUN pnpm install --filter api-server --frozen-lockfile
RUN pnpm run --filter api-server build

RUN pnpm \
  --filter api-server \
   deploy \
  --production \
  deployed


FROM node:21.5.0-alpine3.19
WORKDIR /root
ENV NODE_ENV=production

COPY --from=builder /root/deployed /root

ENTRYPOINT [ \
  "/root/out/program.js" \
  ]
