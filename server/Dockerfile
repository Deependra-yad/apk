FROM node:20-alpine

WORKDIR /app

# Install dependencies and build tools
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

CMD ["npm", "start"]
