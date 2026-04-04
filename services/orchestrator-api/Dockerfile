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
COPY services/orchestrator-api/package.json services/orchestrator-api/package.json
RUN pnpm install --frozen-lockfile

COPY tsconfig.base.json tsconfig.json ./
COPY packages/ packages/
COPY services/orchestrator-api/ services/orchestrator-api/
RUN pnpm --filter @actbound/authorization build \
 && pnpm --filter @actbound/sdk build \
 && pnpm --filter @actbound/orchestrator-api build

FROM base AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/pnpm-lock.yaml /app/pnpm-workspace.yaml /app/package.json /app/.npmrc ./
COPY --from=build /app/packages/config/package.json packages/config/package.json
COPY --from=build /app/packages/authorization/package.json packages/authorization/package.json
COPY --from=build /app/packages/authorization/dist/ packages/authorization/dist/
COPY --from=build /app/packages/sdk/package.json packages/sdk/package.json
COPY --from=build /app/packages/sdk/dist/ packages/sdk/dist/
COPY --from=build /app/packages/ui/package.json packages/ui/package.json
COPY --from=build /app/services/orchestrator-api/package.json services/orchestrator-api/package.json
COPY --from=build /app/services/orchestrator-api/dist/ services/orchestrator-api/dist/
RUN pnpm install --frozen-lockfile --prod

EXPOSE 3001
USER node
CMD ["node", "services/orchestrator-api/dist/main.js"]
