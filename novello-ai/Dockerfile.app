FROM node:20-slim

WORKDIR /app

# Enable pnpm
RUN corepack enable

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

EXPOSE 3000

# Keep it simple for UAT, run the dev server so we don't need a full production build
CMD ["pnpm", "dev"]
