FROM node:20-bookworm-slim

WORKDIR /app

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci

COPY prisma ./prisma
RUN npx prisma generate --schema prisma/schema.prisma

COPY tsconfig.json ./
COPY prisma.config.js ./
COPY prisma.config.ts ./
COPY src ./src

RUN npm run build

EXPOSE 4000

CMD ["node", "dist/index.js"]
