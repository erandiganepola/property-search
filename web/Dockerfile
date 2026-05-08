# syntax=docker/dockerfile:1.6

# ---- build stage ----
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# ---- runtime stage: serve dist/ via `serve` ----
FROM node:20-alpine
WORKDIR /app
RUN npm install -g serve@14
COPY --from=build /app/dist ./dist

# Choreo build (Checkov CKV_DOCKER_3) requires a non-root user with UID >= 10000.
RUN adduser -D -u 10014 choreouser \
    && chown -R 10014:10014 /app
USER 10014

EXPOSE 8080

# Runtime config is read from /config.js, which the deployment host can mount
# into /app/dist/config.js to override the empty stub baked from public/config.js.
CMD ["serve", "-s", "dist", "-l", "8080"]
