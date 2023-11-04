FROM --platform=$BUILDPLATFORM node:lts AS builder

WORKDIR /opt/src
COPY ./package.json ./package-lock.json ./
RUN npm i
COPY . .
RUN npm run build

FROM caddy:2 AS runner

WORKDIR /opt/app
RUN adduser --disabled-password --uid 1000 caddy 
COPY ./docker/Caddyfile /etc/caddy/Caddyfile
COPY --from=builder /opt/src/dist/ ./
USER 1000
