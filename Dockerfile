FROM nginx:stable

ENV TZ "Asia/Shanghai"

COPY dist /var/www
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80