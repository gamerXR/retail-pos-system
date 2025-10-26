# This is a placeholder Dockerfile
# The actual Docker image should be built using: encore build docker

# Encore.ts provides a built-in command to create production Docker images:
# Run: encore build docker retail-pos-backend:latest

# The generated image will be optimized and include:
# - Compiled TypeScript backend code
# - All dependencies
# - Encore runtime
# - Proper health checks
# - Database migration support

# To build:
# 1. Install Encore CLI: curl -L https://encore.dev/install.sh | bash
# 2. Run: encore build docker retail-pos-backend:latest
# 3. Tag: docker tag retail-pos-backend:latest your-registry/retail-pos-backend:latest
# 4. Push: docker push your-registry/retail-pos-backend:latest

FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 8080

CMD ["npm", "start"]
