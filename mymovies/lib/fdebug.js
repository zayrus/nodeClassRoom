/* eslint-disable semi */

'use strict';

const redis = require('./redis');
const redisClient = new redis();
const debug = require("debug")('movies:lib:fdebug');



var FDEBUG = process.env.FDEBUG || null;


redisClient.redis.on("error", function (err) {
    console.log("Redis Error " ,  err);
});


function fdebug(nameSpace, instanceID){
    var self        = this;
    var driver      = FDEBUG || "debug";
    var nameSpace   = nameSpace || "noNameSpace";
    var instanceID  = instanceID || "";


    debug("create : "+nameSpace);
    if(driver=="debug"){
        return require("debug")(nameSpace)
    }else{
        return function(){
            var s = "";
            for(var k in arguments) s+=" "+arguments[k];
            var channel = "debug"+instanceID;
            redisClient.redis.publish(channel, nameSpace+" "+(new Date().getTime())+":"+s);
        };
    }//end else
};


module.exports = fdebug;
