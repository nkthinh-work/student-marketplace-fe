# Build the Vite frontend with the same Node major version as CI.
FROM node:22-alpine AS build

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY . .

# Vite reads these values while building. Runtime environment variables
# do NOT change a bundle that has already been built.
ARG VITE_API_BASE_URL
ARG VITE_WS_BASE_URL
ARG VITE_FIREBASE_API_KEY
ARG VITE_FIREBASE_AUTH_DOMAIN
ARG VITE_FIREBASE_PROJECT_ID
ARG VITE_FIREBASE_STORAGE_BUCKET
ARG VITE_FIREBASE_MESSAGING_SENDER_ID
ARG VITE_FIREBASE_APP_ID
ARG VITE_FIREBASE_VAPID_PUBLIC_KEY

RUN test -n "$VITE_API_BASE_URL" || (echo 'Missing VITE_API_BASE_URL' >&2; exit 1)
RUN test -n "$VITE_FIREBASE_API_KEY" || (echo 'Missing VITE_FIREBASE_API_KEY' >&2; exit 1)
RUN test -n "$VITE_FIREBASE_AUTH_DOMAIN" || (echo 'Missing VITE_FIREBASE_AUTH_DOMAIN' >&2; exit 1)
RUN test -n "$VITE_FIREBASE_PROJECT_ID" || (echo 'Missing VITE_FIREBASE_PROJECT_ID' >&2; exit 1)
RUN test -n "$VITE_FIREBASE_MESSAGING_SENDER_ID" || (echo 'Missing VITE_FIREBASE_MESSAGING_SENDER_ID' >&2; exit 1)
RUN test -n "$VITE_FIREBASE_APP_ID" || (echo 'Missing VITE_FIREBASE_APP_ID' >&2; exit 1)

RUN npm run build

# Serve the compiled SPA with Nginx, not the Vite dev server.
FROM nginx:stable-alpine AS runtime

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/ /usr/share/nginx/html/

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
