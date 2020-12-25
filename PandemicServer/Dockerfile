FROM node:14

WORKDIR /usr/src/PandemicCommon

COPY PandemicCommon/dist/out-tsc ./dist/out-tsc

COPY PandemicCommon/package*.json ./


# Create app directory
WORKDIR /usr/src/pandemicServer

COPY ./PandemicServer/package*.json ./

RUN npm ci --only=production

COPY ./PandemicServer/dist .

EXPOSE 8080

CMD [ "npm", "run", "server" ]