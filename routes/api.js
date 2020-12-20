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
  
var isExistingThread=async(thread, done)=>{
  console.log("inside isExistingThread with ",thread);
  await Thread.find({
    board: thread.board,
    text: thread.text,
    delete_password: thread.delete_password
    },(err,data)=>{
      if(err){
        console.log("error reading thread DB", err);
        return err;
      }else{
        console.log("recieved from mongodb : ", data)
        if(data.length==0){
           console.log("api 82 Thread is new ");
          return done(false);
        }else{
          console.log("Thread already exists, doc: ", typeof(data), data._id, JSON.stringify(data));
          done(data);                             
        }
      }
  })    
}

var saveThread=async(Thread, done)=>{
  console.log("saving thread ", Thread);
  try{
    await Thread.save();
  }catch(err){
    console.log("error saving thread ", err, Thread );
  }
  return true;
}
  
  
  app.route('/api').get((req,res)=>{
    res.sendFile(process.cwd() + '/views/index.html');
  });
  
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
    let isExisting;
    await isExistingThread(req.body, function(result){
      isExisting=result;  
    });//returns false or doc if exists
    let thisThread=null;
    console.log("is existing should be null or contain doc ", isExisting);
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
     let _id=await mongoose.Types.ObjectId(thread_id.thread_id);    // convert JSON sent in into _id
    //hit db to get replies for :board
   
    let thisBoard = await Thread.findById({_id});//,{},{lean: true});
    console.log( "api/replies/:board results of board on DB: ", thisBoard);
    
   // for(var i=0; i<thisBoard.length; i++){
      //if (thisBoard.replies){
        return res.send(thisBoard);  // replies will exist, even if none present, so this will always execute
      //}else {

        //let path=window.location.pathname;
        // var currentURL = window.location.pathname.slice(3);
        //  currentURL = currentURL.split('/');

//       console.log("No replies here so ", thisBoard._id);
//         thread_id.replies=[0];          // add replies value
//         thread_id._id=thread_id.thread_id;  // add _id
//         console.log("sending ",thread_id, thisBoard);
//         return res.json(thisBoard);  // send empty replies to allow page to load
   
    //  }
   // }
    

    
  }).put((req,res)=>{
    
  }).post(async(req,res)=>{
    console.log("inside POST @ api/replies/board ", req.body, req.body.thread_id);
    let _id=mongoose.Types.ObjectId(req.body.thread_id);    // convert JSON sent in into _id
    let text=req.body.text;
    console.log(" configuring replies to save to db. Reply Text is:", text);
    let newReply=new Reply(req.body);
    let savedReply= await Thread.findOne(_id);//,  { $push: { replies: newReply} });
    savedReply.replies.push(newReply);
    await savedReply.save();
    console.log("saved the reply to DB: ", savedReply.board,savedReply)
     res.redirect('/b/'+savedReply.board+'/'+savedReply._id); //+'/views/thread.html');
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
