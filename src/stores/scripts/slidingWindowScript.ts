export const slidingWindowScript = `
local key = KEYS[1]

local now = tonumber(ARGV[1])
local windowMs = tonumber(ARGV[2])
local limit = tonumber(ARGV[3])
local requestId = ARGV[4]
local expirySeconds = tonumber(ARGV[5])

local windowStart = now - windowMs

redis.call(
  "ZREMRANGEBYSCORE",
  key,
  0,
  windowStart
)

local count = redis.call(
  "ZCARD",
  key
)

if count >= limit then

  local oldest = redis.call(
    "ZRANGE",
    key,
    0,
    0,
    "WITHSCORES"
  )

  local oldestTimestamp = nil

  if oldest[2] then
    oldestTimestamp = tonumber(oldest[2])
  end

  return {
    0,
    count,
    oldestTimestamp
  }
end

redis.call(
  "ZADD",
  key,
  now,
  requestId
)

redis.call(
  "EXPIRE",
  key,
  expirySeconds
)

count = count + 1

local oldest = redis.call(
  "ZRANGE",
  key,
  0,
  0,
  "WITHSCORES"
)

local oldestTimestamp = nil

if oldest[2] then
  oldestTimestamp = tonumber(oldest[2])
end

return {
  1,
  count,
  oldestTimestamp
}
`;
