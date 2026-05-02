# syntax=docker/dockerfile:1.7-labs
# This dockerfile is used to publish the `ohif/app` image on dockerhub.
#
# It's a good example of how to build our static application and package it
# with a web server capable of hosting it as static content.
#
# docker build
# --------------
# If you would like to use this dockerfile to build and tag an image, make sure
# you set the context to the project's root directory:
# https://docs.docker.com/engine/reference/commandline/build/
#
#
# SUMMARY
# --------------
# This dockerfile has two stages:
#
# 1. Building the React application for production
# 2. Setting up our Nginx (Alpine Linux) image w/ step one's output
#


# Stage 1: Build the application
# docker build -t ohif/viewer:latest .
FROM node:20.18.1-slim@sha256:b2c8e0eb8a6aeeae33b2711f8f516003e27ee45804e270468d937b3214f2f0cc AS builder

RUN apt-get update && apt-get install -y --no-install-recommends build-essential python3 \
    && rm -rf /var/lib/apt/lists/*

RUN mkdir /usr/src/app
WORKDIR /usr/src/app
RUN npm install -g bun@1.2.23 lerna@7.4.2
ENV PATH=/usr/src/app/node_modules/.bin:$PATH

# Do an initial install and then a final install
COPY package.json yarn.lock preinstall.js lerna.json ./
COPY --parents ./addOns/package.json ./addOns/*/*/package.json ./extensions/*/package.json ./modes/*/package.json ./platform/*/package.json ./
# Run the install before copying the rest of the files

RUN bun install --frozen-lockfile
# Copy the local directory
COPY --link --exclude=yarn.lock --exclude=package.json --exclude=Dockerfile . .

# Build here
# After install it should hopefully be stable until the local directory changes
ARG QUICK_BUILD=false
ENV QUICK_BUILD=${QUICK_BUILD}
# ENV GENERATE_SOURCEMAP=false
ARG APP_CONFIG=config/default.js
ARG PUBLIC_URL=/
ENV PUBLIC_URL=${PUBLIC_URL}

RUN bun run show:config
RUN bun run build

# Precompress files
RUN chmod u+x .docker/compressDist.sh
RUN ./.docker/compressDist.sh

# Stage 2: Bundle the built application into a Docker container
# which runs Nginx using Alpine Linux
FROM nginxinc/nginx-unprivileged:1.27-alpine@sha256:65e3e85dbaed8ba248841d9d58a899b6197106c23cb0ff1a132b7bfe0547e4c0 AS final
#RUN apk add --no-cache bash
ARG PUBLIC_URL=/
ENV PUBLIC_URL=${PUBLIC_URL}
ARG PORT=80
ENV PORT=${PORT}
RUN rm /etc/nginx/conf.d/default.conf
USER nginx
COPY --chown=nginx:nginx .docker/Viewer-v3.x /usr/src
RUN chmod 755 /usr/src/entrypoint.sh
COPY --chown=nginx:nginx --from=builder /usr/src/app/platform/app/dist /usr/share/nginx/html${PUBLIC_URL}
# Copy paths that are renamed/redirected generally
# Microscopy libraries depend on root level include, so must be copied
COPY --chown=nginx:nginx --from=builder /usr/src/app/platform/app/dist/dicom-microscopy-viewer /usr/share/nginx/html/dicom-microscopy-viewer

# app-config.js needs write permission for entrypoint.sh runtime override
RUN chmod 664 /usr/share/nginx/html${PUBLIC_URL}app-config.js 2>/dev/null || true

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT}/ || exit 1

ENTRYPOINT ["/usr/src/entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
