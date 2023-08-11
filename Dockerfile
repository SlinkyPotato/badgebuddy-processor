FROM node:20.3.1-alpine

LABEL description="Node processor for Badge Buddy"

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@8.6.10

# Bundle app source
COPY . .

# Fetch dep from virtual store
RUN pnpm fetch

# Install app dependencies
RUN pnpm install --frozen-lockfile

# Build the app
RUN pnpm build

# Move docs to dist
RUN mv CHANGELOG.md ./dist/
RUN mv LICENSE.md ./dist/
RUN mv README.md ./dist/

# Remove dev dependencies
RUN pnpm install --prod

CMD ["pnpm", "start:prod"]
