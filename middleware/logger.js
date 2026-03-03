const winston = require('winston');

const logger = winston.createLogger({
    level:'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [new winston.transports.Console()],
});

function requestLogger(req,res,next){
    const start = Date.now();

    res.on(`finish`,() => {
        logger.info({
            method: req.method,
            path: req.originalUrl,
            status: res.statusCode,
            durationMs : Date.now() - start,
            ip : req.ip,
            apiKey: req.headers['x-api-key'] || null,
        });
    });
    next();
}

module.exports = { logger, requestLogger};