require('dotenv').config();

module.exports = {
    port : process.env.PORT || 3000,

    redis : {
        url : process.env.REDIS_URL || 'redis://localhost:6379',
    },

    jwt:{
        secret : process.env.JWT_SECRET || 'changename',
    },

    routes:[
        {
            prefix: '/users',
            target: process.env.SERVICE_USERS,
            rateLimit : {limit: 50, windowSecs : 60},
            requiresAuth : true,
        },
        {
        prefix: '/orders',
        target: process.env.SERVICE_ORDERS,
        rateLimit: { limit: 100, windowSecs: 60 },
        requiresAuth: true,
        },
        {
        prefix: '/products',
        target: process.env.SERVICE_PRODUCTS,
        rateLimit: { limit: 200, windowSecs: 60 },
        requiresAuth: false,
        },
    ],

    defaultRateLimit: {
        limit: parseInt(process.env.DEFAULT_RATE_LIMIT) || 100,
        windowSecs: parseInt(process.env.DEFAULT_WINDOW_SECS) || 60,
    },
};

