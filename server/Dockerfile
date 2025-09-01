FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
RUN npx prisma generate
COPY src ./src
EXPOSE 3001
CMD ["npm","start"]
