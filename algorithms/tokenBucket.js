const SCRIPT = `
    local tokens_key = KEYS[1]
    local last_key = KEYS[2]
    local capacity = tonumber(ARGV[1])
    local refill_rate = tonumber(ARGV[2])
    local now = tonumber(ARGV[3])

    local tokens = tonumber(redis.call('GET',tokens_key))
    local last = tonumber(redis.call('GET',last_key))

    if tokens == nil then
    tokens = capacity
    last = now
    end

    

    local elapsed = (now - last)/1000
    tokens = math.min(capacity, tokens + elapsed * refill_rate)

    local allowed = 0
    if tokens >= 1 then
    tokens  = tokens - 1
    allowed = 1
    end

    redis.call('SET', tokens_key , tokens, 'EX' , 3600)
    redis.call('SET', last_key, now, 'EX' , 3600)

    return { allowed , math.floor(tokens)}
`;


class TokenBucket{
    constructor(redis, { capacity = 10, refillRate = 1} = {}){
        this.redis = redis;
        this.capacity = capacity;
        this.refillRate = refillRate;
    }

    async consume(identifier){

        const [allowed, remaining] = await this.redis.eval(
            SCRIPT,
            2,
            `tb:${identifier}:tokens`,
            `tb:${identifier}:last`,
            this.capacity,
            this.refillRate,
            Date.now()
        );
        const retryAfter = allowed ? 0 : Math.ceil((1-remaining)/this.refillRate);

        console.log({
            identifier,
            allowed,
            remaining,
            retryAfter
        });
        return {
            allowed: allowed === 1,
            remaining,
            retryAfter,
        };
    }
}

module.exports = TokenBucket;