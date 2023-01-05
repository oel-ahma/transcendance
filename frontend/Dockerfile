FROM node:latest
WORKDIR /usr/src/app
COPY package.json  ./
RUN yarn
COPY . ./
RUN yarn build

EXPOSE 4000
CMD ["yarn", "run", "serve"]
