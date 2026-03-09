FROM node:20-alpine AS builder

RUN apk add --no-cache openssl

WORKDIR /app
COPY package.json package-lock.json* ./
COPY prisma/ prisma/
RUN npm install
RUN npx prisma generate

COPY src/ src/
COPY tsconfig.json ./
RUN npm run build

FROM node:20-alpine

RUN apk add --no-cache openssl

WORKDIR /app
COPY package.json package-lock.json* ./
COPY prisma/ prisma/
RUN npm install --omit=dev
RUN npx prisma generate

COPY --from=builder /app/dist dist/
COPY templates/ templates/

RUN mkdir -p /data /app/previews

ENV PORT=4500
ENV DATABASE_URL="file:/data/paver.db"
EXPOSE 4500

CMD ["sh", "-c", "npx prisma db push --skip-generate && node dist/server.js"]
