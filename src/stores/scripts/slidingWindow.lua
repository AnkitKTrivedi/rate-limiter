local key = KEYS[1]

local now = tonumber(ARGV[1])
local windowStart = tonumber(ARGV[2])
local limit = tonumber(ARGV[3])
local windowMs = tonumber(ARGV[4])
local requestId = ARGV[5]

redis.call(
    "ZREMRANGEBYSCORE",
    key,
    0,
    windowStart
)

local count =
    redis.call("ZCARD", key)

if count >= limit then

    local oldest =
        redis.call(
            "ZRANGE",
            key,
            0,
            0,
            "WITHSCORES"
        )

    local oldestTimestamp = 0

    if #oldest > 0 then
        oldestTimestamp =
            tonumber(oldest[2])
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
    "PEXPIRE",
    key,
    windowMs
)

return {
    1,
    count + 1,
    0
}