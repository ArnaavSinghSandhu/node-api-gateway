const jwt = require('jsonwebtoken');

const { jwt: jwtConfig } = require('../config');

function authMiddleware(req,res,next){
    const header = req.headers['authorization'];

    if(!header || !header.startsWith('Bearer ')){
        return res.status(401).json({
            error: `Missing or Malformed Authorization Header`
        });
    }

    const token = header.split(' ')[1];

    try{
        req.user = jwt.verify(token,jwtConfig.secret);
        next();
    }catch(err){
        return res.status(401).json({error: `Invalid or expired Token `});
    }

}

module.exports = authMiddleware;