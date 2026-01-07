# Build stage
FROM node:20-alpine AS builder

# Accept build arguments
ARG VITE_API_BASE_URL
ARG VITE_API_STRAPI_URL
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_N8N_WEBHOOK_URL

WORKDIR /app
COPY package*.json ./

# Install all dependencies (including devDependencies needed for build)
RUN npm ci

COPY . .

# Set environment variables for Vite build
ENV NODE_ENV=production
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_API_STRAPI_URL=$VITE_API_STRAPI_URL
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
ENV VITE_N8N_WEBHOOK_URL=$VITE_N8N_WEBHOOK_URL

# Build with production mode
RUN npm run build

# Serve static with nginx
FROM nginx:1.27-alpine
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx config for React Router support
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
