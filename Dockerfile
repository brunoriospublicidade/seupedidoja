# Base image
FROM node:20-slim AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm install

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Run build to generate dist folder (frontend)
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4001

# Create uploads directory
RUN mkdir -p uploads

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.ts ./
COPY --from=builder /app/src ./src
COPY --from=builder /app/tsconfig.json ./
COPY --from=builder /app/drizzle.config.ts ./

# Install tsx globally just in case, but let's try to run directly
RUN npm install -g tsx

EXPOSE 4001

# Temporarily disabled db:push to bypass drizzle-kit interaction issues
# CMD ["sh", "-c", "npm run db:push && tsx server.ts"]
CMD ["tsx", "server.ts"]
