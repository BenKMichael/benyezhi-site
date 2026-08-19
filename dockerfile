# GOLANG
FROM golang:1.22-alpine AS go-builder

WORKDIR /build
COPY go-cgi/ .

RUN CGO_ENABLED=0 GOOS=linux go build -o /out/ ./cmd/...

RUN cd /out && \
    for bin in *; do \
      case "$bin" in \
        *.cgi) ;; \
        *) [ -f "$bin" ] && mv "$bin" "go-${bin}.cgi" ;; \
      esac; \
    done

# PHP
FROM php:8.2-apache

RUN apt-get update && apt-get install -y --no-install-recommends \
    perl \
    libjson-perl \
    libcgi-pm-perl \
    libcgi-session-perl \
    && rm -rf /var/lib/apt/lists/* \
    && (a2enmod cgi || a2enmod cgid) \
    && a2enmod proxy proxy_http

COPY apache.conf /etc/apache2/sites-available/000-default.conf

RUN mkdir -p /var/www/html
RUN mkdir -p /usr/bin/cgi-bin

COPY html/ /var/www/html
COPY perl-cgi/ /usr/bin/cgi-bin/
COPY --from=go-builder /out/ /usr/bin/cgi-bin/

RUN chmod +x /usr/bin/cgi-bin/* && \
    chown -R www-data:www-data /var/www/html /usr/bin/cgi-bin

EXPOSE 80
CMD ["apache2-foreground"]