FROM node:22-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@10.6.3 --activate

FROM base AS build
WORKDIR /app
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json .npmrc ./
COPY packages/config/package.json packages/config/package.json
COPY packages/openfga/package.json packages/openfga/package.json
COPY packages/sdk/package.json packages/sdk/package.json
COPY services/sync-service/package.json services/sync-service/package.json
RUN pnpm install --frozen-lockfile

COPY tsconfig.base.json tsconfig.json ./
COPY packages/ packages/
COPY services/sync-service/ services/sync-service/
RUN pnpm --filter @actbound/openfga build \
 && pnpm --filter @actbound/sdk build \
 && pnpm --filter @actbound/sync-service build

FROM base AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/pnpm-lock.yaml /app/pnpm-workspace.yaml /app/package.json /app/.npmrc ./
COPY --from=build /app/packages/config/package.json packages/config/package.json
COPY --from=build /app/packages/openfga/package.json packages/openfga/package.json
COPY --from=build /app/packages/openfga/dist/ packages/openfga/dist/
COPY --from=build /app/packages/sdk/package.json packages/sdk/package.json
COPY --from=build /app/packages/sdk/dist/ packages/sdk/dist/
COPY --from=build /app/services/sync-service/package.json services/sync-service/package.json
COPY --from=build /app/services/sync-service/dist/ services/sync-service/dist/
RUN pnpm install --frozen-lockfile --prod

EXPOSE 3003
USER node
CMD ["node", "services/sync-service/dist/main.js"]
