# syntax=docker/dockerfile:1.7

FROM node:20-alpine AS production

ENV NODE_ENV=production \
    PORT=3000

WORKDIR /app

COPY package.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --omit=dev --no-audit --no-fund && \
    npm cache clean --force

COPY --chown=node:node src/ ./src/

USER node
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || 3001) + '/api/health').then((response) => { if (!response.ok) process.exit(1) }).catch(() => process.exit(1))"

STOPSIGNAL SIGTERM
CMD ["node", "src/index.js"]
