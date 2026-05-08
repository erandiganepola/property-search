# syntax=docker/dockerfile:1.6

FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/build ./build

# Choreo build (Checkov CKV_DOCKER_3) requires a non-root user with UID >= 10000.
RUN adduser -D -u 10014 choreouser && chown -R 10014:10014 /app
USER 10014

EXPOSE 3001

# PORT, ASGARDEO_BASE_URL, CORS_ORIGIN are read from the container env at runtime.
CMD ["node", "build/index.js"]
