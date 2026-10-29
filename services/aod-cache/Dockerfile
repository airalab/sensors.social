FROM node:24.22.0-alpine3.24

WORKDIR /app
ENV NODE_ENV=production \
    PORT=3081 \
    CACHE_DIR=/data/cache

COPY package.json *.mjs ./
RUN mkdir -p /data/cache && chown node:node /data/cache

USER node
VOLUME /data/cache

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:' + process.env.PORT + '/health').then((r) => process.exit(r.ok ? 0 : 1), () => process.exit(1))"

CMD ["node", "server.mjs"]
