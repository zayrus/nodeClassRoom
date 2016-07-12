/* eslint-disable semi */

'use strict';


const express = require("express");
const http = require("http");
const socket = require('socket.io');
const swaggerTools = require('swagger-tools');
const path = require('path');
const yaml = require('js-yaml');
const fs = require('fs');
const cors = require('cors');
const fdebug = require("./lib/fdebug");
const common = require("./lib/common");
const redis = require("./lib/redis");
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);


const Movies = require("./lib/movies");
const debug = fdebug('movies:app');





/**
 * Build the main application
 * @param {object} config - The module config
 * @returns {Promise}
 * @author César Casas
 */
function app(config) {

    var self = this;
    debug("init....");

    //this object is the main to return, has all properties need for application (factories, config, controllers, routers, etc).

     self.main = {
        config: config,
        db: common.getDB(),
        restEndpoint: config.get('service.protocol') + config.get('service.host') + config.get('service.pathname'),
    };


    return new Promise((resolve, reject)=> {

        self.swaggerDoc()
            .then(()=> { return self.getApp(); })
            .then(()=> { return self.io(); })
            .then(()=> { return self.redisClient(); })
            .then(()=> { return self.announce(); })
            .then(()=> { return self.libs(); })
            .then(()=> { return self.controllers(); })
            .then(()=> { return self.routers();})
            .then(()=> {
                debug("Setup finish, run...");
                resolve(self.main);
            })
        .catch((err)=>{
                console.log("Error init: ", err);
            });
    });
}

/**
 * inject swagger doc into main object.
 * @returns {Promise}
 */
app.prototype.swaggerDoc = function () {
    var self = this;

    debug("running swaggerDoc");

    return new Promise((resolve, reject)=> {
        var swaggerFile = path.join(__dirname, '/api/swagger/swagger.yaml');
        var swaggerString = fs.readFileSync(swaggerFile, 'utf8');
        var swaggerDoc = yaml.safeLoad(swaggerString);

        swaggerDoc.host = self.main.config.get('service.host');
        swaggerDoc.basePath = self.main.config.get('service.pathname');

        self.main.swaggerDoc = swaggerDoc;
        resolve({swaggerDoc: swaggerDoc});
    });
}

/**
 * Create the express instance an inject into main property the instance and server (http)
 * @returns {Promise}
 */
app.prototype.getApp = function () {
    var self = this;
    debug("getApp...");

    return new Promise((resolve, reject)=> {
        self.main.app = express();

        /**
         * Sessions
         */

        self.main.app.set('trust proxy', 1);

        self.main.app.use(session({
            secret: 'mysecretData',
            store: new MongoStore({db: common.getDB()})
        }));


        self.main.server = http.createServer(self.main.app);
        resolve({app: self.main.app, server: self.main.server});
    });
}

/**
 * create socket.io instance and inject into main object
 * @returns {Promise}
 */
app.prototype.io = function () {
    var self = this;

    debug("io...");

    return new Promise((resolve, reject)=> {
        var pathName = self.main.config.get('service.pathname');
        debug(pathName + '/socket.io');
        self.main.io = socket.listen(self.main.server);

        var io = self.main.io;


        io.on('connection', function(socket){
            console.log('a user connected');

            socket.on('chat message', function(msg){
                console.log('message: ' + msg);
                io.emit('chat message', msg);

            });


            socket.on('disconnect', function(){
                console.log('user disconnected');
            });
        });





        resolve({io: self.main.io});
    });
}

/**
 * create redisClient or sentinel instance, use own redis lib (return sentinel instance or redisClient). Inject the instance into main object.
 * @returns {Promise}
 */
app.prototype.redisClient = function () {
    var self = this;
    debug("redisClient");

    return new Promise((resolve, reject)=> {
        self.main.redisClient = new redis();
        resolve({redisClient: self.main.redisClient});
    });
}

/**
 * Socket.io emit message. Using into controllers/index.js for wrapHandler
 * @returns {Promise}
 */
app.prototype.announce = function () {
    var self = this;
    debug("announce...");

    return new Promise((resolve, reject)=> {
        self.main.announce = function () {
            var args = Array.prototype.slice.apply(arguments);
            self.main.io.sockets.emit.apply(self.main.io.sockets, args);
        };

        resolve({announce: self.main.announce});
    });
}


/**
 * Create the common lib instances for all REST Application
 * @returns {Promise}
 */
app.prototype.libs = function () {
    var self = this;
    return new Promise((resolve, reject)=> {

        self.main.libs = {
            Movies:  new Movies(self.main)
        };

        resolve(self.main.libs);
    });
}

app.prototype.controllers = function () {
    var self = this;
    var controllers = {};

    debug("controllers...");

    return new Promise((resolve, reject)=> {
        self.main.controllers = require('./controllers')(self.main);
        resolve(self.main.controllers);
    });
}




app.prototype.routers = function () {
    var self = this;

    debug("routers...");

    return new Promise((resolve, reject)=> {

        var app = self.main.app;
        var options = {
            controllers: self.main.controllers
        };


        app.use(cors());
        app.set('basePath', self.main.swaggerDoc.basePath);

        var formatValidationError = function formatValidationError(err, req, res, next) {
            var error = {
                code: 'validation_error',
                message: err.message,
                details: err.results ? err.results.errors : null
            };

            res.json({error: error});
        };//end formatValidationError

        // Initialize the Swagger middleware
        function initMiddleWare(middleware, callback) {
            debug('initializating middleware');

            app.use((req, res, next)=> {
                res.setHeader('Access-Control-Allow-Origin', '*');
                res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
                res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');
                res.setHeader('Access-Control-Allow-Credentials', true);

                if (req.method === 'OPTIONS') return res.end();

                next();
            });

            app.use(middleware.swaggerMetadata());
            app.use(middleware.swaggerValidator(), formatValidationError);

            app.use(middleware.swaggerRouter(options));

            app.use((err, req, res, next) => {
                res.status(500);
                res.send(err);
                res.end();
            });

            app.use(middleware.swaggerUi({
                apiDocs: self.main.config.get('service.pathname') + '/api-docs',
                swaggerUi: self.main.config.get('service.pathname') + '/docs'
            }));

            app.use(express.static('public'));

            callback();
        };//end initMiddleWare

        swaggerTools.initializeMiddleware(self.main.swaggerDoc,  (swaggerMiddleware) =>{
            initMiddleWare(swaggerMiddleware, (err) =>{
                resolve();
            });
        });

    });
}

module.exports = app;
