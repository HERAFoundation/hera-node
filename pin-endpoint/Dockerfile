FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json ./
RUN npm install --production

FROM node:22-alpine
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json index.ts ./
EXPOSE 3000
CMD ["npx", "tsx", "index.ts"]
