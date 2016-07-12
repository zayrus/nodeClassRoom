const config = require("config");
const sentinel = require("redis-sentinel");
const redis = require("redis");
const debug = require("debug")("lib:redis");

/**
 * Connect and run operations into Redis. Support traditional Redis or Sentinel.
 * @param {object} connection - If connection argument array, the lib automatic connect to Sentinel.
 * @param {string} connection.host - The host to connect
 * @param {integer} connection.port - The port connection
 * @constructor
 */
function Redis(connection){

    if(typeof connection=="undefined"){
        var redisConf = config.get("redis") || {
                "host": "localhost",
                "port": 6379
            };
    }else{
        var redisConf = connection;
    }

    this.redis = null;

    if(Object.prototype.toString.call( redisConf ) =="[object Array]"){
        debug("Redis for sentinel");
        this.redis = sentinel.createClient(redisConf, null, null);
    }else{
        debug("Redis to "+redisConf.host);
        this.redis = redis.createClient(redisConf);
    }

}

Redis.prototype.get = function(key){
    var self = this;
    debug("get called");
    return new Promise((resolve, reject)=>{
        self.redis.get(key, (err, val)=>{
            if(err) reject(err);
            else resolve(val);
        });
    });
}

Redis.prototype.hset = function(key, property, value){
    var self=this;
    debug("hset called");
    return new Promise((resolve, reject)=>{
        self.redis.hset(key, property, value, (err)=> {
            if(err) reject(err);
            else resolve();
        });
    });
}

Redis.prototype.hget = function(key, property){
    var self = this;
    debug("hget called");
    return new Promise((resolve, reject)=>{
        self.redis.hget(key, property, (err, value)=> {
            if(err) reject(err);
            else resolve(value)
        });
    });
}


Redis.prototype.expire = function(key, time){
    var self = this;
    debug("expire called");
    return new Promise((resolve, reject)=>{
        self.redis.expire(key, time, ()=>{
            resolve();
        });
    });
}


Redis.prototype.setex = function(key, exp, value){
    var self = this;
    debug("setex called");
    return new Promise((resolve, reject)=>{
        self.redis.setex(key, exp, value, (err)=>{
            if(err) reject(err);
            else resolve();
        });
    });
}


Redis.prototype.del = function(key){
    var self = this;
    debug("del called");
    return new Promise((resolve, rehect)=>{
        self.redis.del(key, (err)=>{
            if(err) reject(err);
            else resolve();
        });
    });
}

Redis.prototype.srem = function(key, val){
    var self = this;
    debug("srem called");
    return new Promise((resolve, reject)=>{
        self.redis.srem(key.toString(), val.toString(), (err)=>{
            if(err) reject(err);
            else resolve();
        }) ;
    });
}

Redis.prototype.sadd = function(key, val){
    var self = this;
    debug("sadd called");
    return new Promise((resolve, reject)=>{
        self.redis.sadd(key.toString(), val.toString(), (err)=>{
            if(err) reject(err);
            else resolve();
        }) ;
    });
}

module.exports = Redis;