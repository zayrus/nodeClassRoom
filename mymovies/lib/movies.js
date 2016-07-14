/* eslint-disable semi */
"use strict";

const fdebug = require("./fdebug");
const debug = fdebug("movies:lib:movies");

function Movies(main) {
    this.db = main.db;
    debug('init');
}





Movies.prototype.search = function(obj){
    var self = this;

    debug("search called: "+JSON.stringify(obj));

    return new Promise((resolve, rejec)=>{

        let query = {};

        if(obj.title) query.name = new RegExp(obj.title);
        if(obj.year) query.year = obj.year;
        if(obj.id) query._id = obj.id;

        self.db.movies.find(query, {}, (err, docs)=>{
            err ? reject(err) : resolve(docs);
        })
    });
}

Movies.prototype.add = function(obj){
    var self = this;

    debug("add called: "+JSON.stringify(obj));

    return new Promise((resolve, rejec)=>{

        self.db.movies.insert(obj, {}, (err, doc)=>{
            err ? reject(err) : resolve(doc);
        })
    });
}

Movies.prototype.put = function(id, movie){
    var self = this;

    //debug("update called: "+JSON.stringify());
    return new Promise((resolve, rejec)=>{
        
        self.db.movies.update( {"_id":id}, movie, {}, (err, docs)=>{
            err ? reject(err) : resolve(docs);
        })
    });
}

Movies.prototype.delete = function(id){
    var self = this;

    //debug("update called: "+JSON.stringify());
    return new Promise((resolve, rejec)=>{
        
        self.db.movies.remove( {"_id":id}, {}, (err, docs)=>{
            err ? reject(err) : resolve(docs);
        })
    });
}

module.exports = Movies;
