# GOLANG
FROM golang:1.22-alpine AS go-builder

WORKDIR /build
COPY go-cgi/ .

RUN CGO_ENABLED=0 GOOS=linux go build -o /out/ ./cmd/...

# PHP
FROM php:8.2-apache

RUN apt-get update && apt-get install -y --no-install-recommends \
    perl \
    && rm -rf /var/lib/apt/lists/* \
    && (a2enmod cgi || a2enmod cgid)

COPY apache.conf /etc/apache2/sites-available/000-default.conf

RUN mkdir -p /var/www/html/cgi-bin

COPY html/ /var/www/html
COPY perl-cgi/ /var/www/html/cgi-bin/
COPY --from=go-builder /out/ /var/www/html/cgi-bin/

RUN chmod +x /var/www/html/cgi-bin/* && \
    chown -R www-data:www-data /var/www/html /var/www/html/cgi-bin

EXPOSE 80
CMD ["apache2-foreground"]