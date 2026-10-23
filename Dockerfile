
FROM node:20.20.2-bookworm-slim

WORKDIR /app

RUN corepack enable \
    && corepack prepare pnpm@8.15.9 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps ./apps
COPY packages ./packages

RUN pnpm install --no-frozen-lockfile --reporter=append-only --foreground-scripts
# RUN pnpm install --no-frozen-lockfile

RUN pnpm --filter ./apps/web build
RUN pnpm --filter @blog-agent/worker build

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

EXPOSE 3000

CMD ["pnpm", "--filter", "./apps/web", "start"]
