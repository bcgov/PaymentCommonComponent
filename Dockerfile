FROM node:16.18-alpine AS backend-development

WORKDIR /usr/src/app

ARG BUILD_CONTEXT 

COPY ./apps/$BUILD_CONTEXT/package.json .

RUN corepack enable

RUN corepack prepare yarn@3.2.3 --activate

RUN yarn set version 3.2.3

RUN yarn install

COPY ./apps/$BUILD_CONTEXT .

RUN yarn workspace @payment/backend build

EXPOSE 3000

CMD [ "yarn", "run", "start:dev" ]