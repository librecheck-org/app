FROM node:lts AS builder

WORKDIR /opt/src
COPY ./package.json ./package-lock.json ./
RUN npm i
COPY . .
RUN npm run build

FROM caddy:2 AS runner

COPY ./docker/Caddyfile /etc/caddy/Caddyfile
COPY --from=builder /opt/src/dist/ /opt/app/
