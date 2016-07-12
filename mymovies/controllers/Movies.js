/* eslint-disable semi */
"use strict";

const fdebug = require("../lib/fdebug");
const debug = fdebug("movies:controllers:movies");


function Movies(main) {
    debug("init.");
    return {

        'search': (req, res, next)=>{
            debug(".search called");

            var title  = req.swagger.params.title ? req.swagger.params.title.value : null;
            var year  = req.swagger.params.year ? req.swagger.params.year.value : null;
            var id  = req.swagger.params.id ? req.swagger.params.id.value : null;

            main.libs.Movies.search({title: title, year: year, _id: id})
            .then((movies)=>{
                    res.json(movies);
                })
            .catch(next);
        },
        
        'add': (req, res, next)=>{
            debug(".post called");

            main.libs.Movies.add(req.body)
            .then((movies)=>{
                    res.json(movies);
                })
            .catch(next);
        },
        
        'put': (req, res, next)=>{
            debug(".put called");
            
            var title  = req.swagger.params.title;
            var id  = req.swagger.params.id;
            
            main.libs.Movies.put({ title: title,  _id: id})
            .then((movies)=>{
                res.json(movies);
            })
            .catch(next);
        }


    };//end return
}

module.exports = Movies;