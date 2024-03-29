
FROM node:18.14-alpine AS development

ENV PATH $PATH:/usr/src/app/node_modules/.bin

COPY ./apps ./apps
COPY ./package.json ./package.json
COPY ./tsconfig.json ./tsconfig.json

EXPOSE 3000


