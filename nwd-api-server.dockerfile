FROM node:21.5.0-alpine3.19 AS builder

RUN apk add tar jq

WORKDIR /root

COPY packages /root/packages
COPY generated /root/generated
COPY package.json package-lock.json /root/

RUN npm clean-install --unsafe-perm
RUN npm pack --workspace nwd-api-server --unsafe-perm


FROM node:21.5.0-alpine3.19

ENV NODE_ENV=production

COPY --from=builder /root/nwd-api-server-0.0.0.tgz /root/nwd-api-server-0.0.0.tgz

RUN npm install --global /root/nwd-api-server-0.0.0.tgz

RUN rm /root/nwd-api-server-0.0.0.tgz

WORKDIR /root

# Define our entry point that the container is to call when ran.
ENTRYPOINT [ "nwd-api-server" ]
