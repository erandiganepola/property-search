# syntax=docker/dockerfile:1.6

# ---- build stage ----
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .

# Vite inlines VITE_* values at build time. We bake recognisable placeholders
# so the runtime entrypoint can sed-replace them with per-environment values
# from the container env, without rebuilding the image.
ENV VITE_ASGARDEO_CLIENT_ID=__VITE_ASGARDEO_CLIENT_ID__ \
    VITE_ASGARDEO_BASE_URL=__VITE_ASGARDEO_BASE_URL__ \
    VITE_ASGARDEO_SIGN_IN_REDIRECT_URL=__VITE_ASGARDEO_SIGN_IN_REDIRECT_URL__ \
    VITE_ASGARDEO_SIGN_OUT_REDIRECT_URL=__VITE_ASGARDEO_SIGN_OUT_REDIRECT_URL__ \
    VITE_AGENT_SERVICE_URL=__VITE_AGENT_SERVICE_URL__
RUN npm run build

# ---- runtime stage: serve dist/ via `serve` ----
FROM node:20-alpine
WORKDIR /app
RUN npm install -g serve@14
COPY --from=build /app/dist ./dist
COPY docker-entrypoint.sh ./

# Choreo build (Checkov CKV_DOCKER_3) requires a non-root user with UID >= 10000.
RUN chmod +x docker-entrypoint.sh \
    && adduser -D -u 10014 choreouser \
    && chown -R 10014:10014 /app
USER 10014

EXPOSE 8080

# The entrypoint copies dist to a writable tmpfs path (/tmp/dist), substitutes
# runtime env values there, then execs CMD. Serve is pointed at /tmp/dist so
# the read-only /app/dist is never written to — required when the container
# runs with a read-only root filesystem.
ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["serve", "-s", "/tmp/dist", "-l", "8080"]
