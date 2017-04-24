FROM node:4.8.2

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

ENV NODE_ENV development

EXPOSE 3000
