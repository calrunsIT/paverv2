FROM node:20-alpine AS builder

WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install

COPY client/ client/
COPY server/ server/
RUN npm run build

FROM node:20-alpine

WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --omit=dev

COPY server/ server/
COPY --from=builder /app/client/dist client/dist

RUN mkdir -p /data

ENV PORT=3001
ENV DB_PATH=/data/paver.db
EXPOSE 3001

CMD ["node", "server/index.js"]
