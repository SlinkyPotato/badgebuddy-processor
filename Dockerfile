ARG NODE_VERSION

FROM node:${NODE_VERSION}-alpine AS base
LABEL description="Node processor for badge-buddy-processor"

RUN corepack enable

WORKDIR /app
COPY pnpm-lock.yaml /app/
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm fetch --frozen-lockfile
COPY . /app/

FROM base AS prod-deps
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --frozen-lockfile

FROM base AS build
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
RUN pnpm build

FROM base
COPY --from=prod-deps /app/node_modules /app/node_modules
COPY --from=build /app/dist /app/dist

COPY CHANGELOG.md /app/dist/
COPY LICENSE.md /app/dist/
COPY README.md /app/dist/

CMD ["pnpm", "start:prod"]
