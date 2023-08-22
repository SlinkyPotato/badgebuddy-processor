FROM node:20.3.1-alpine
LABEL description="Node processor for Badge Buddy"

RUN corepack enable

WORKDIR /app
COPY pnpm-lock.yaml /app/
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm fetch --frozen-lockfile
COPY . /app/

RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --offline --frozen-lockfile

RUN pnpm build
RUN pnpm test

COPY CHANGELOG.md /app/dist/
COPY LICENSE.md /app/dist/
COPY README.md /app/dist/

RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --offline --prod --frozen-lockfile

CMD ["pnpm", "start:prod"]
