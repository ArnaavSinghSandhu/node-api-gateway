const { createProxyMiddleware } = require('http-proxy-middleware');

function createProxy(target, prefix){
    return new createProxyMiddleware({
        target,
        changeOrigin:true,
        pathRewrite: {[`^${prefix}`]: ''},

        on:{
            error:(req, res, next) => {
                res.status(502).json({
                    error:  `Bad Gateway`,
                    message:  `Upstream service at ${target} is unavailable`,
                });
            },
        },
    });
}

module.exports = createProxy;