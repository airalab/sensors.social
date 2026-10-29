# AOD tile cache

Disk-backed WMS proxy for the CAMS dust and smoke layers used by sensors.social. It follows
ECMWF's redirect to the generated PNG, validates requests, adds CORS, caches misses, and
prefetches the current three-hour step at zooms 2–6.

## Local use

Requires Node.js 20 or newer and has no npm dependencies.

```sh
cd services/aod-cache
npm start
curl http://127.0.0.1:3081/health
```

For parity with the public URL, the local server also accepts `/aod/wms` and `/aod/health`.

The main settings are `PORT` (3081), `CACHE_DIR` (`./cache`), `CACHE_MAX_BYTES` (10 GiB),
`CACHE_DAYS` (6), `REQUEST_MAX_ZOOM` (6), `PREFETCH_CONCURRENCY` (8),
`PREFETCH_ENABLED` (true), and `UPSTREAM_WMS` (ECMWF public WMS). Cache pruning runs at
startup and every six hours, independently of prefetching.

```nginx
location /aod/ {
    proxy_pass http://127.0.0.1:3081/;
    proxy_http_version 1.1;
    proxy_connect_timeout 5s;
    proxy_read_timeout 30s;
}
```

## Docker

```sh
cd services/aod-cache
cp .env.example .env
docker compose up -d --build
curl http://127.0.0.1:3081/health
```

The container uses `network_mode: host` because the server listens on `127.0.0.1` only, so
the port is not exposed publicly and nginx proxies to it as shown above. Tiles are stored in
`CACHE_PATH` (default `./cache`), which must be writable by uid 1000, the `node` user in the
image. All settings above can be set in `.env`.
