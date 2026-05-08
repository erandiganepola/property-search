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

# ---- runtime stage ----
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
COPY docker-entrypoint-replace-env.sh /docker-entrypoint.d/40-replace-env.sh

# Choreo build (Checkov CKV_DOCKER_3) requires a non-root user with UID >= 10000.
# nginx:alpine's stock entrypoint runs every executable in /docker-entrypoint.d/
# before starting nginx, so the placeholder substitution happens once at boot.
# We replaced the main nginx.conf, so the stock listen-on-ipv6 helper that
# rewrites /etc/nginx/conf.d/default.conf is irrelevant — drop it.
RUN chmod +x /docker-entrypoint.d/40-replace-env.sh \
    && rm -f /docker-entrypoint.d/10-listen-on-ipv6-by-default.sh \
    && adduser -D -u 10014 choreouser \
    && chown -R 10014:10014 \
        /usr/share/nginx \
        /docker-entrypoint.d \
        /var/cache/nginx \
        /var/log/nginx
USER 10014

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
