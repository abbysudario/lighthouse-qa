# Playwright provides a browser-ready base image
FROM mcr.microsoft.com/playwright:v1.58.2-jammy

WORKDIR /app

# Install deps first (better caching)
COPY package*.json ./
RUN npm ci

# Copy the rest of the repo
COPY . .

# Default env (override at runtime)
ENV CI=true

# Run tests by default
CMD ["npm", "test"]