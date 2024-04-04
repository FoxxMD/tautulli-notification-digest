FROM lsiobase/alpine:3.17 as base

ENV TZ=Etc/GMT

RUN \
  echo "**** install build packages ****" && \
  apk add --no-cache \
    alpine-base \
    git \
    nodejs \
    npm \
    yarn \
    openssh && \
  echo "**** cleanup ****" && \
  rm -rf \
    /root/.cache \
    /tmp/*

RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

ARG data_dir=/config
VOLUME $data_dir
ENV DATA_DIR=$data_dir

COPY docker/root/ /

WORKDIR /app

FROM base as build

# copy NPM dependencies and install
COPY --chown=abc:abc package.json yarn.lock tsconfig.json ./
COPY --chown=abc:abc patches ./patches

RUN yarn install

COPY --chown=abc:abc . /app

RUN yarn run build && rm -rf node_modules

FROM base as app

COPY --from=build --chown=abc:abc /app /app
COPY --chown=abc:abc patches /app/patches

ENV NODE_ENV=production
ENV COLORED_STD=true

RUN yarn install --omit=dev \
    && npm cache clean --force \
    && chown abc:abc node_modules \
    && rm -rf node_modules/tsx \
    && rm -rf node_modules/typescript \
    && rm -rf node_modules/patch-package \
    && rm -rf node_modules/@types \
    && rm -rf node_modules/@esbuild \
    && rm -rf /usr/local/share/.cache \
