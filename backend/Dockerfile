FROM node:latest

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY . .
RUN rm -rf dist/

EXPOSE 3000

RUN npm run prisma:prod
RUN npm run build

ENTRYPOINT ["/bin/bash", "start.prod.sh"]
