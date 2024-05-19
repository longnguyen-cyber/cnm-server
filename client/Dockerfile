FROM node:18-alpine AS builder
# Add a work directory
ENV NODE_ENV production

WORKDIR /app
# Cache and Install dependencies
COPY package.json .
COPY package-lock.json .


RUN npm install --force --production
# Copy app files
COPY . .
# Build the app
RUN npm run build

FROM caddy:2.4.5-alpine AS production
# Bundle static assets with caddy
COPY --from=builder /app/build /usr/share/caddy
COPY Caddyfile /etc/caddy/Caddyfile


# Expose port
EXPOSE 80
CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile"]