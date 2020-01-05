// redis配置参数

const redis = require('redis');
var redis_config = {
    "host": "127.0.0.1",
    "port": 6379
};
const redisClient = redis.createClient(redis_config);

const rpush = (...args) => {
    return new Promise((resolve, reject) => {
        redisClient.rpush(...args, function (err, value) {
            if (err) reject(err)
            else resolve(value)
        })
    })
}

const rpop = (...args) => {
    return new Promise((resolve, reject) => {
        redisClient.rpop(...args, function (err, value) {
            if (err) reject(err)
            else resolve(value)
        })
    })
}
const lrange = (...args) => {
    return new Promise((resolve, reject) => {
        redisClient.lrange(...args, function (err, value) {
            if (err) reject(err)
            else resolve(value)
        })
    })
}




module.exports = {
    rpush,
    rpop,
    lrange
}