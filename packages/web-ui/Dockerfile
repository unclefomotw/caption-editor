# Frontend Dockerfile for Next.js application (root context build)
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy root workspace files for dependency resolution
COPY package*.json ./
COPY packages/web-ui/package.json ./packages/web-ui/
COPY packages/common-types/package.json ./packages/common-types/

# Install all workspace dependencies using root lock file
RUN npm ci

# Copy common-types source (needed for workspace linking)
COPY packages/common-types/ ./packages/common-types/

# Copy web-ui source code
COPY packages/web-ui/ ./packages/web-ui/

# Set working directory to the frontend package
WORKDIR /app/packages/web-ui

# Expose port
EXPOSE 3000

# Development command (with hot reload)
CMD ["npm", "run", "dev"]
