############################################################
# Dockerfile to build sandbox for executing user code
# Based on Ubuntu
############################################################

FROM node

USER root

RUN apt-get update
RUN apt-get install -y docker.io --force-yes

WORKDIR /var/www/laradock/compiler_api/app

ENTRYPOINT [ "/var/www/laradock/compiler_api/start.sh" ]