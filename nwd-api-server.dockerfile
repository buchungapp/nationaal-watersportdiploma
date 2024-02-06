FROM node:21.5.0-alpine3.19 AS builder
WORKDIR /root

RUN apk add make g++ python3
RUN corepack enable

COPY specifications /root/specifications
COPY packages /root/packages
COPY package.json \
  pnpm-workspace.yaml \
  pnpm-lock.yaml \
  Makefile \
  /root/

RUN make

RUN pnpm \
  --filter nwd-api-server \
   deploy \
  --production \
  deployed


FROM node:21.5.0-alpine3.19
WORKDIR /root
ENV NODE_ENV=production

COPY --from=builder /root/deployed /root

ENTRYPOINT [ \
  "/root/bin/nwd-api-server" \
  ]
