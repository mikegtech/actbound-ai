FROM node:22-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@10.6.3 --activate

FROM base AS build
WORKDIR /app
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json .npmrc ./
COPY packages/config/package.json packages/config/package.json
COPY packages/authorization/package.json packages/authorization/package.json
COPY packages/sdk/package.json packages/sdk/package.json
COPY packages/ui/package.json packages/ui/package.json
COPY apps/web/package.json apps/web/package.json
RUN pnpm install --frozen-lockfile

COPY tsconfig.base.json tsconfig.json ./
COPY packages/ packages/
COPY apps/web/ apps/web/
ARG VITE_ORCHESTRATOR_API_URL=http://localhost:3001
ARG VITE_AUTH0_DOMAIN
ARG VITE_AUTH0_CLIENT_ID
ARG VITE_AUTH0_AUDIENCE=https://api.actbound.ai
ENV VITE_ORCHESTRATOR_API_URL=$VITE_ORCHESTRATOR_API_URL
ENV VITE_AUTH0_DOMAIN=$VITE_AUTH0_DOMAIN
ENV VITE_AUTH0_CLIENT_ID=$VITE_AUTH0_CLIENT_ID
ENV VITE_AUTH0_AUDIENCE=$VITE_AUTH0_AUDIENCE
RUN pnpm --filter @actbound/web build

FROM nginx:alpine AS runtime
COPY --from=build /app/apps/web/dist/ /usr/share/nginx/html/
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
