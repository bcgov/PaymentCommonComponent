
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

COPY ./yarn/install-state.gz ./.yarn/install-state.gz

COPY . .

ENV PORT=3000

EXPOSE 3000

CMD ["yarn", "run", "start:dev"]

###################
# BUILD FOR PRODUCTION
###################

FROM node:16-alpine3.16 AS build

WORKDIR /usr/src/app

COPY package.json ./

COPY yarn.lock ./

COPY --from=development /usr/src/app/node_modules ./node_modules

COPY . .

RUN yarn run build

ENV NODE_ENV production

RUN yarn workspaces focus --production

USER node

###################
# PRODUCTION
###################

FROM node:16-alpine AS production

COPY --from=build /usr/src/app/node_modules ./node_modules
COPY --from=build /usr/src/app/dist ./dist

CMD [ "node", "dist/main.js" ]
