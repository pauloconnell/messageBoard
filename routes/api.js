/*
*
*
*       Complete the API routing below
*
*
*/

'use strict';

var expect = require('chai').expect;
// import mongodb

module.exports = function (app) {
  // connect to mongo
  // set up schema/model
  // connect to collection
  
  
  app.route('/api/threads/:board').get((req,res)=>{
    
    
  }).put((req,res)=>{
    
  }).post((req,res)=>{
    var {text, reported, delete_password, replies}=req.body;
   // create schema
  // save    model.save
  // now we have board
  //mongo will add _id on save
   res.redirect('/b/{board}')  
    
  }).delete((req,res)=>{
    
  });
    
  app.route('/api/replies/:board').get((req,res)=>{
    
  }).put((req,res)=>{
    
  }).post((req,res)=>{
    
    
  }).delete((req,res)=>{
    
  });;

};
