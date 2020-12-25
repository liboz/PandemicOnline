FROM node:14

WORKDIR /usr/src/PandemicCommon

COPY PandemicCommon/package*.json PandemicCommon/index.ts PandemicCommon/tsconfig.json ./

RUN npm ci && npm run build

# Create app directory
WORKDIR /usr/src/pandemicServer

COPY ./PandemicServer/package*.json ./

RUN npm ci --only=production

COPY ./PandemicServer/dist .

EXPOSE 8080

CMD [ "npm", "run", "server" ]