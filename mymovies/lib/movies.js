/* eslint-disable semi */
"use strict";

const fdebug = require("./fdebug");
const debug = fdebug("movies:lib:movies");
const request = require("request");
function Movies(main) {
    this.db = main.db;
    debug('init');
}


function searchOmdb(title, cb){
  debug("searchOmdb called")
  var myTitle = title.replace(/" "/g, "+");
  const url = "http://www.omdbapi.com/?t="+ myTitle + "&plot=short&r=json";
  request.get(url, (error, response, body)=>{
    if (!error && response.statusCode == 200){
      const data = JSON.parse(body);
      console.log(data)
      var movie = {
        name: data.Title,
        image: data.Poster,
        imdbrating: data.imdbRating
      }
      debug('omdb ' + JSON.stringify(movie))
      cb(movie) 
    } else {
      debug('error: ' + response.statusCode);
      cb(false)
    }
  })
}

Movies.prototype.search = function(obj){
    var self = this;

    debug("search called: "+JSON.stringify(obj));

    return new Promise((resolve, rejec)=>{
        let query = {};

        if(obj.name) query.name = new RegExp(obj.name, "i");
        if(obj.year) query.year = obj.year;
        if(obj.id) query._id = obj.id;
         
        self.db.movies.find(query, {}, (err, docs)=>{
            if (err) return err;
            console.log(docs.length)
            if (docs.length > 0){
              resolve(docs);
            } else {
              if (obj.name) {
                searchOmdb(obj.name, function(movie){
                  if (movie){
                    self.db.movies.insert(movie, {}, (err, doc)=>{
                      err ? reject(err) : resolve([doc]);
                    })
                  }
                })
              } else {
                resolve(docs);
              }
            }
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
