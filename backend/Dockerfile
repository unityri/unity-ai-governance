# Base image
FROM node:16-bullseye AS development

# Update and install dependencies
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-liberation \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Confirm installation
RUN chromium --version

# Set working directory
WORKDIR /usr/src/app

ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy application code
COPY . .

# Expose application port
EXPOSE 3006

# ✅ Increase Node.js heap memory to 6GB
ENV NODE_OPTIONS="--max-old-space-size=6144"
ENV PUPPETEER_EXECUTABLE_PATH="/usr/bin/chromium"

# Start the app
CMD ["npm", "start"]
