FROM node:current-bullseye-slim
ENV DEBIAN_FRONTEND=noninteractive
ENV DEBCONF_NOWARNINGS="yes"
WORKDIR /usr/app
COPY * ./
RUN ls -lh
RUN apt-get update
RUN apt-get -y install git
RUN corepack prepare yarn@stable --activate
RUN yarn set version stable
RUN yarn
RUN yarn build
CMD ["yarn", "start"]
EXPOSE 3000
