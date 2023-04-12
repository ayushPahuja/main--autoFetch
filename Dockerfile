FROM node:16-alpine

RUN mkdir -p /usr/src/app
ENV PORT 3000

WORKDIR /usr/src/app

COPY package.json /usr/src/app
# COPY package-lock.json /usr/src/app
COPY yarn.lock /usr/src/app

# Production use node instead of root
# USER node

# RUN npm install -g webpack webpack-cli

RUN yarn install --frozen-lockfile --ignore-engines
# RUN npm install
# RUN npm ci

COPY . /usr/src/app

# RUN npm run build

EXPOSE 3000
# CMD [ "npm", "start" ]
CMD [ "yarn", "start" ]
