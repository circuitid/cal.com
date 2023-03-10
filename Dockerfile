FROM node:18.15.0-bullseye-slim
RUN printenv
ENV DEBIAN_FRONTEND=noninteractive
ENV DEBCONF_NOWARNINGS="yes"
ENV NODE_OPTIONS=--max-old-space-size=8192
WORKDIR /usr/app
COPY package.json yarn.lock turbo.json git-init.sh git-setup.sh .env .eslintrc.js ./
COPY apps/web ./apps/web
COPY packages ./packages
RUN cat .env
RUN apt-get update
RUN apt-get -y install git
RUN corepack prepare yarn@stable --activate
RUN yarn set version stable
RUN yarn -v
RUN yarn config set httpTimeout 1000000000
RUN yarn install --network-timeout 1000000000
RUN printenv
RUN ls -lha
RUN yarn build 
CMD ["yarn", "start"]
EXPOSE 3000
