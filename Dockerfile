FROM node:12
RUN mkdir /code
ADD . /code/
WORKDIR /code
RUN npm install
