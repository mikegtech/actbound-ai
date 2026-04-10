FROM node:20-alpine AS builder
WORKDIR /app

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@10.6.3 --activate

# Copy the entire monorepo
COPY . .

# Capture build arguments for Vite
ARG VITE_ORCHESTRATOR_API_URL
ARG VITE_AUTH0_DOMAIN
ARG VITE_AUTH0_CLIENT_ID
ARG VITE_AUTH0_AUDIENCE

# Map arguments to environment variables so Vite embeds them during build
ENV VITE_ORCHESTRATOR_API_URL=$VITE_ORCHESTRATOR_API_URL
ENV VITE_AUTH0_DOMAIN=$VITE_AUTH0_DOMAIN
ENV VITE_AUTH0_CLIENT_ID=$VITE_AUTH0_CLIENT_ID
ENV VITE_AUTH0_AUDIENCE=$VITE_AUTH0_AUDIENCE

# Install all dependencies across the workspace
RUN pnpm install --frozen-lockfile

# Build the frontend SPA
RUN pnpm --filter ./apps/web build

# Create the final lightweight static server image
FROM nginx:alpine

# Copy the build output from the builder stage
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

# Establish a fallback SPA route configuration for NGINX
RUN echo 'server { \
    listen       80; \
    server_name  localhost; \
    location / { \
        root   /usr/share/nginx/html; \
        index  index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
    error_page   500 502 503 504  /50x.html; \
    location = /50x.html { \
        root   /usr/share/nginx/html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
