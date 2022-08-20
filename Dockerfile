FROM node:18

WORKDIR /usr/src/PandemicCommon

COPY PandemicCommon/package*.json PandemicCommon/index.ts PandemicCommon/tsconfig.json ./

RUN npm ci && npm run build

# Create app directory
WORKDIR /usr/src/pandemicServer

COPY ./PandemicServer/package*.json ./

RUN npm ci

COPY ./PandemicServer/ .

RUN npm run build && npm prune --production && rm *.ts && rm -r data && cp -r dist/* . && rm -r dist

EXPOSE 8080

CMD [ "npm", "run", "server" ]
