FROM node:20-bookworm-slim

WORKDIR /app

# Use pnpm compatible with lockfile version 6
RUN corepack enable && corepack prepare pnpm@8.15.9 --activate

# Copy workspace manifests
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy application and shared workspace packages
COPY apps ./apps
COPY packages ./packages

# Install workspace dependencies
# RUN pnpm install --frozen-lockfile
RUN pnpm install --no-frozen-lockfile

# Build the Next.js application
RUN pnpm --filter ./apps/web build

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

EXPOSE 3000

CMD ["pnpm", "--filter", "./apps/web", "start"]
