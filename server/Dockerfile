FROM node:20-slim

WORKDIR /app

# Install OpenSSL & CA Certificates
RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

# Install dependencies and Prisma client
COPY package*.json ./
COPY prisma ./prisma/

RUN npm install
RUN npx prisma generate

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Expose port
ENV PORT=5000
EXPOSE 5000

# Push DB migrations at startup and launch server
CMD ["sh", "-c", "npx prisma db push && npm start"]
