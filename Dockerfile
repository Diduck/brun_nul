FROM nginx:alpine

COPY . /usr/share/nginx/html
RUN chmod -R 555 /usr/share/nginx/html