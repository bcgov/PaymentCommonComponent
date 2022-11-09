FROM node:16.18-alpine As development

WORKDIR /usr/src/app

COPY  package*.json ./

RUN corepack enable

RUN corepack prepare yarn@3.2.3 --activate

RUN yarn set version 3.2.3

RUN yarn install

COPY  . .

EXPOSE 3000

CMD [ "yarn", "run", "start:dev" ]