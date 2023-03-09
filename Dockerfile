FROM node:18.15.0-bullseye-slim
ENV DEBIAN_FRONTEND=noninteractive
ENV DEBCONF_NOWARNINGS="yes"
ENV NODE_OPTIONS=--max-old-space-size=8192
WORKDIR /usr/app
#COPY * ./
COPY package.json yarn.lock turbo.json git-init.sh git-setup.sh ./
COPY apps/web ./apps/web
COPY packages ./packages
RUN ls -lh
RUN apt-get update
RUN apt-get -y install git
RUN corepack prepare yarn@stable --activate
RUN yarn set version stable
RUN yarn -v
RUN yarn config set httpTimeout 1000000000
RUN yarn add turbo
#RUN yarn turbo prune --scope=@calcom/web --docker
RUN yarn install --network-timeout 1000000000
RUN yarn build 
CMD ["yarn", "start"]
EXPOSE 3000
