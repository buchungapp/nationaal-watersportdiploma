FROM node:21.5.0-alpine3.19 AS builder
WORKDIR /root

COPY packages /root/packages
COPY generated /root/generated
COPY package.json \
  package-lock.json \
  resolve-links \
  /root/

RUN npm \
  --workspace nwd-api-server \
  clean-install \
  --install-strategy nested
RUN ./resolve-links node_modules


FROM node:21.5.0-alpine3.19
ENV NODE_ENV=production
WORKDIR /root

COPY --from=builder /root/node_modules /root/node_modules

ENTRYPOINT [ \
  "./node_modules/.bin/nwd-api-server" \
  ]
