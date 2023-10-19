FROM node:16.13.0-alpine as build-stage

WORKDIR /app

COPY package.json package-lock.json /app/
RUN npm ci

COPY ./ /app/
RUN npm run build

FROM nginx:alpine
COPY --from=build-stage /app/index.html /app/bundle.js /usr/share/nginx/html/
COPY ./nginx.conf /etc/nginx/conf.d/default.conf

VOLUME "/tracks"

LABEL org.opencontainers.image.source="https://github.com/AdamVig/derive"
LABEL org.opencontainers.image.licenses="MIT"
LABEL org.opencontainers.image.title="dérive"
LABEL org.opencontainers.image.description="Generate a heatmap from GPS tracks."
