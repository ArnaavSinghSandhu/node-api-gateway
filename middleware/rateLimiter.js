const TokenBucket = require('../algorithms/tokenBucket');

function createRateLimiter(redis,opts = {}){
    const limiter = new TokenBucket(redis,{
        capacity : opts.limit || 100,
        refillRate: (opts.limit || 100) / (opts.windowSecs || 60),
    });

    return async(req,res,next) => {
        let rawIp = req.headers['x-forwarded-for'] || req.ip;
        const identifier = req.headers['x-api-key'] || rawIp.split(',')[0].trim();
        const { allowed, remaining , retryAfter } = await limiter.consume(identifier);

        res.set('X-RateLimit-Limit', opts.limit || 100);
        res.set('X-RateLimit-Remaining', remaining);
        res.set('X-RateLimit-Reset', Date.now() + (opts.windowSecs || 60) * 1000);

        if(!allowed){
            res.set(`Retry-After`,retryAfter);
            return res.status(429).json({
                error: `Too Many Requests`,
                retryAfter: `${retryAfter}s`,
            });
        }
        next();
    };
}

module.exports = createRateLimiter;