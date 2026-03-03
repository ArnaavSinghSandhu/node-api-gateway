const express = require('express');

const  authMiddleware  = require('../middleware/auth');
const  createRateLimiter  = require('../middleware/rateLimiter');
const { requestLogger } = require('../middleware/logger');
const createProxy       = require('./proxy');
const Redis = require('ioredis');
const config = require('../config');
const os = require('os');
const cluster = require('cluster');

const numCPUs = os.cpus().length;

if(cluster.isPrimary){
    console.log(`PrimaryProcess ${process.pid} is running`);
    console.log(`Forking ${numCPUs} workers ...\n`);

    for(let i = 0 ; i < numCPUs ; i++){
        cluster.fork();
    }

    cluster.on('exit',(worker,code,signal) => {
        console.error(`Worker ${worker.process.pid} died. Restarting`);
        cluster.fork();
    });
}else{
    const app = express();
    const redis = new Redis(config.redis.url);
    app.use(express.json());
    app.use(requestLogger);
    app.set('trust proxy', true);
    redis.on('connect', () => console.log(`Redis Connected`));
    redis.on('error', (e) => console.error('Redis Error:',e.message));

    app.get('/health', (req,res) => {
        res.json({status: 'ok', timestamp: Date.now()});
    })

    for(const route of config.routes){
        const middlewareChain = []

        middlewareChain.push(createRateLimiter(
            redis,
            {
                limit : route.rateLimit?.limit ?? config.defaultRateLimit.limit,
                windowSecs : route.rateLimit?.windowSecs ?? config.defaultRateLimit.windowSecs,
            }
        ))
        if(route.requiresAuth){
            middlewareChain.push(authMiddleware);
        }

        middlewareChain.push(createProxy(route.target,route.prefix));

        app.use(route.prefix,...middlewareChain);

    }


    app.use((req,res,next,err) => {
        console.error(err);
        res.status(500).json({ error : `Internal Gateway Error `});
    });

    app.listen(config.port, () => {
        console.log(`Server Running on Port ${config.port}`);
    });

}


