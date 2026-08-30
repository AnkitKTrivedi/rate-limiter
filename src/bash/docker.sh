docker run -d \
  --name rate-limiter-redis \
  -p 6379:6379 \
  redis:7