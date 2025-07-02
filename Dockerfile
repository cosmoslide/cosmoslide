# Development Dockerfile
FROM node:22-alpine

# Install dependencies for better compatibility and PostgreSQL client
RUN apk add --no-cache python3 make g++ postgresql-client

WORKDIR /app

# Copy package files and local packages
COPY package*.json yarn.lock ./
COPY packages ./packages

# Install dependencies
RUN yarn install

# Copy application files
COPY . .

# Expose port
EXPOSE 3000

# Start development server with hot reloading
CMD ["yarn", "start:dev"]