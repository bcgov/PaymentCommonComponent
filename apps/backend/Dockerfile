
FROM node:16.18-alpine AS development

ENV PATH $PATH:/usr/src/app/node_modules/.bin

WORKDIR /usr/src/app

COPY package.json ./

COPY .yarnrc.yml ./

COPY yarn.lock ./

COPY .yarn ./.yarn

RUN corepack enable

RUN corepack prepare yarn@3.2.3 --activate

RUN yarn set version 3.2.3

RUN yarn 

COPY . .

ENV PORT=3000

EXPOSE 3000

CMD ["yarn", "run", "start:dev"]

