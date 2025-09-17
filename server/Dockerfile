# Server/Dockerfile
FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the server code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Apply schema changes before starting server
CMD npx prisma db push && npm start

EXPOSE 8080
