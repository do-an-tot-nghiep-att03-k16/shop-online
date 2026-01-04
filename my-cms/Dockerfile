FROM node:20-alpine
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (needed for build)
RUN npm ci

# Copy source code and scripts
COPY . .

# Ensure scripts directory exists (needed for sync functionality)
RUN test -d scripts || mkdir -p scripts

# Build Strapi
ENV NODE_ENV=production
RUN npm run build

# Remove devDependencies to reduce image size
RUN npm prune --production

EXPOSE 1337
CMD ["npm", "run", "start"]
