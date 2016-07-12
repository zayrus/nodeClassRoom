/* eslint-disable semi */
"use strict";

const config = require("config");
const collections = ['movies'];

var db  =null;

module.exports = {
    collections: collections,
    config: config,
    getDB : function(){
        return db ? db :require('mongojs')(config.get('db'), collections);
    }

};