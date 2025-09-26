FROM caddy:builder AS builder

RUN xcaddy build \
  --with github.com/caddy-dns/cloudflare \
  --with github.com/aksdb/caddy-cgi/v2

FROM caddy:latest

COPY --from=builder /usr/bin/caddy /usr/bin/caddy

# Install bun and yq
RUN apk add --no-cache curl yq && \
    curl -fsSL https://bun.sh/install | bash && \
    ln -s /root/.bun/bin/bun /usr/local/bin/bun

CMD ["caddy", "run"]
