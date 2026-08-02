FROM node:24-alpine

WORKDIR /app

COPY docker/frontend/entrypoint.sh /usr/local/bin/woodpecker-frontend-entrypoint

RUN chmod +x /usr/local/bin/woodpecker-frontend-entrypoint

CMD ["woodpecker-frontend-entrypoint"]
