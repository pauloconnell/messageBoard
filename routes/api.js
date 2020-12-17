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
// defined below
 //var saveThread=(thread)=>{   // delete this - will save all boards together
    
//   thread.save(); 
//};
  
var isExistingThread=async(thread)=>{
  console.log("inside isExistingThread with ",thread);
  await Thread.findOne({
    board: thread.board
    },(err,data)=>{
      if(err){
        console.log("error reading thread DB", err);
      }else{
        if(!data){
           console.log("api 82 Thread is new ");
          return false;
        }
        else{
          console.log("Thread already exists, Sending doc");
          return data;      
        }
      }
  })    
}

var saveThread=async(Thread)=>{
  console.log("saving thread ", Thread);
  try{
    await Thread.save();
  }catch(err){
    console.log("error saving thread ", Thread, err);
  }
  return true;
}
  
  
  app.route('/api').get((req,res)=>{
    
  })
  
  app.route('/api/threads/:board').get((req,res)=>{
    let {test} =req.params;
    let board=req.body.board;
    console.log("api/threads board GET is ",board);
    res.redirect(`/b/{board}`);
    
    // hit db to get all entries for :board
    //let boardData=findDoc(board);
    
    
    // return entries
    
    
  }).put((req,res)=>{
    
  }).post(async (req,res)=>{
    //var {text, reported, delete_password, replies}=req.body;
      var {board, text, delete_password } = req.body;
    console.log("/api/threads/:board  POST recieved: ", req.body);// board,text, password only?
    var board=req.body.board; 
    // check for existing board:
    let isExisting=await isExistingThread(req.body);//returns false or doc if exists
    let thisThread;
  // save if new, or load data into 'thisThread' if existing
    if(!isExisting){
      thisThread = await new Thread(req.body);
      let saved=await saveThread(thisThread);// essentially load up _id
      console.log("saved status is ",saved);
    }else{
      thisThread=isExisting; // if existing board, it's data will be sent back with _id
    }  
  // now we have board
  //mongo will add _id on save
   console.log("api 141 redirect with thisThread : ", thisThread);
   res.redirect('/b/'+thisThread.board+"/"+thisThread._id);  //(`/b/{board}`);  
    
  }).delete((req,res)=>{
    
  });
    
  app.route('/api/replies/:board').get(async(req,res)=>{
    let board=req.params;
    let thread_id=req.query;
    console.log("GET replies/:board recieved from front end - id? ", req.query, req.params);
    //hit db to get replies for :board
    let thisBoard = await Thread.find(board,{},{lean: true});
    console.log( "api/replies/:board results of board on DB: ",thisBoard);
    if (thisBoard[0].replies){
      return res.send(thisBoard[0]);
    }else {
      
      //let path=window.location.pathname;
      // var currentURL = window.location.pathname.slice(3);
      //  currentURL = currentURL.split('/');
    
    console.log("No replies here so ", thisBoard._id);
      thread_id.replies=[0];          // add replies value
      thread_id._id=thread_id.thread_id;  // add _id
      console.log("sending ",thread_id, thisBoard);
      return res.json(thisBoard);  // send empty replies to allow page to load
    }
      
    

    
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
  if(isExistingThread(board)){
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
