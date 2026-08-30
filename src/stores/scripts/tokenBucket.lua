local key = KEYS[1]

local now = tonumber(ARGV[1])
local capacity = tonumber(ARGV[2])
local refillRate = tonumber(ARGV[3])
local requestedTokens = tonumber(ARGV[4])
local ttl = tonumber(ARGV[5])

local tokens =
    redis.call("HGET", key, "tokens")

local lastRefillTime =
    redis.call("HGET", key, "lastRefillTime")

-- First request
if not tokens then
    tokens = capacity
    lastRefillTime = now
else
    tokens = tonumber(tokens)
    lastRefillTime = tonumber(lastRefillTime)
end

-- Calculate elapsed time
local elapsed =
    (now - lastRefillTime) / 1000

-- Calculate newly generated tokens
local newTokens =
    elapsed * refillRate

-- Refill bucket
tokens =
    math.min(
        capacity,
        tokens + newTokens
    )

-- Update refill timestamp
lastRefillTime = now

-- Check whether request can be served
if tokens >= requestedTokens then

    tokens =
        tokens - requestedTokens

    redis.call(
        "HSET",
        key,
        "tokens",
        tokens,
        "lastRefillTime",
        lastRefillTime
    )

    redis.call(
        "PEXPIRE",
        key,
        ttl
    )

    return {
        1,
        tokens,
        0
    }

end

-- Calculate how long until enough tokens exist
local missingTokens =
    requestedTokens - tokens

local retryAfter =
    missingTokens / refillRate

redis.call(
    "HSET",
    key,
    "tokens",
    tokens,
    "lastRefillTime",
    lastRefillTime
)

redis.call(
    "PEXPIRE",
    key,
    ttl
)

return {
    0,
    tokens,
    retryAfter
}