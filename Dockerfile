FROM nginx:stable

ENV TZ "Asia/Shanghai"
WORKDIR /var/www

COPY --chown=nginx:nginx dist /var/www
COPY --chown=nginx:nginx nginx.conf /etc/nginx/nginx.conf
RUN chmod 644 /etc/nginx/nginx.conf

HEALTHCHECK --interval=30s --timeout=3s \
  CMD curl -f http://localhost/ || exit 1

EXPOSE 80