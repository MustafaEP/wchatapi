FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY src ./src

VOLUME ["/app/auth_info"]

EXPOSE 3000

CMD ["node", "src/index.js"]
