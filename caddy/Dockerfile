FROM caddy:builder AS builder

RUN xcaddy build \
  --with github.com/caddy-dns/godaddy \
  --with github.com/aksdb/caddy-cgi/v2

FROM caddy:latest

COPY --from=builder /usr/bin/caddy /usr/bin/caddy

CMD ["caddy", "run"]
