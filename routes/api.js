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
const mongoose = require("mongoose");
module.exports = function (app) {

  //connect to DB
mongoose.connect(process.env.DB_URI, {
  useNewUrlParser: true,
  useCreateIndex: true,
  useUnifiedTopology: true 
}); 
  // Make Mongoose use `findOneAndUpdate()`. Note that this option is `true` by default, you need to set it to false.
mongoose.set("useFindAndModify", false);
  
  // set up schema/model
  // threads are board topics, which hold their own replies

    var replySchema = new mongoose.Schema({
    text: {type: String, required:true},
    created_on: {type: Date, default: new Date(), required:true},
    reported: {type:Boolean, default: false},
    delete_password: {type: String, required:true}
  });

  var threadSchema = new mongoose.Schema({
    text: {type: String, required:true},
    board: {type: String, required:true},
    created_on: {type: Date, default: new Date(),  required:true},
    bumped_on: {type: Date, required:false},
    reported: {type:Boolean, default: false, required:true},
    delete_password: {type: String, required:true},
    replies: [replySchema]
  });


const Thread = mongoose.model("Thread", threadSchema);

const Reply=mongoose.model("Reply", replySchema);
  
console.log("mongoose is: "+mongoose.connection.readyState);
console.log("readyState codes are:   0: disconnected      1: connected  2: connecting    3: disconnecting ");
  
 var findDoc=(board)=>{

    Thread.findOne(
      {board: board}, (err, data)=>{
        if(err) console.log("error reading DB");
        if(data){
          if(data.replies){
            return data;
          }
        }
      }
    )
  }
// check if thread exists before calling saveThread
var saveThread=(thread)=>{   // delete this - will save all boards together
    
   thread.save(); 
};
  
var isNewThread=(thread)=>{
  Thread.findOne({
    board: thread.name
    },(err,data)=>{
      if(err){
        console.log("error reading thread DB", err);
      }else{
        if(!data){
           console.log("Thread is new ");
          return true;
        }
        else{
          console.log("Thread already exists, adding to replies");
          return false;      
        }
      }
  })    
}
  
  
  app.route('/api').get((req,res)=>{
    
  })
  
  app.route('/api/threads/:board').get((req,res)=>{
    let {test} =req.params;
    let board=req.body.board;
    console.log("api/threads board is ",board);
    res.redirect(`/b/{board}`);
    
    // hit db to get all entries for :board
    //let boardData=findDoc(board);
    
    
    // return entries
    
    
  }).put((req,res)=>{
    
  }).post((req,res)=>{
    var {text, reported, delete_password, replies}=req.body;
   // create schema
  // save    model.save
  // now we have board
  //mongo will add _id on save
   res.redirect(`/b/{board}`);  
    
  }).delete((req,res)=>{
    
  });
    
  app.route('/api/replies/:board').get((req,res)=>{
    //hit db to get replies for :board
    
  }).put((req,res)=>{
    
  }).post((req,res)=>{
    
    
  }).delete((req,res)=>{
    
  });;

  

//Sample front-end
app.route('/b/:board/')
  .get(function (req, res) {
    res.sendFile(process.cwd() + '/views/board.html');
  
  
  })
  .post(function (req, res){
  var {text, reported, delete_password, replies}=req.body;
  var board=req.params;
  if(isNewThread(board)){
    try{
      let newThread= new Thread(req.body);
      }catch{
        console.log("error saving new thread to DB /b/:board")
        return res.send("error saving board to DB");
      }
  }
  
  res.sendFile(process.cwd() + '/views/board.html');
});
  
app.route('/b/:board/:threadid')
  .get(function (req, res) {
    res.sendFile(process.cwd() + '/views/thread.html');
  });
  
};
