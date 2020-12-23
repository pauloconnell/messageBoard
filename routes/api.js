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
  
// define our helper functions to handle database calls
  
  //findBoard(board, done)
  //findThread(id, done)
  //isExistingThread(thread, done)
  //saveThread(thread, done)
  
  
// hit DB to get all docs for this board
 var findBoard=async(board, done)=>{ 

   console.log("about to look up ",board);
    await Thread.find(
      board, (err, data)=>{
        if(err) console.log("findDoc error reading DB ", board);
        if(data){
          //if(data.replies){
          //  return done(null, data);
          //}else{
         //   console.log("no replies but have file ", data.toString());
            return done(null, data);
          
        }else{
          console.log("checking to see if this is sent back");
            data="no board for this yet";
            return done(null, data);
       }
      }
    )
  }

  var findThread=async(id, done)=>{  

   console.log("about to look up ",id);
    await Thread.find(
      id, (err, data)=>{
        if(err) console.log("findDoc error reading DB ", id);
        if(data){
          if(data.replies){
            return done(null, data);
          }else{
            console.log("no replies yet but have file ", data.toString());
            return done(null, data);
          }
        }else{
          console.log("checking to see if this is sent back, should always find doc(and not see this)");
            data="no data yet";
            return done(null, data);
       }
      }
    )
  }
 
 // check if thread exists before calling saveThread
var isExistingThread=async(thread, done)=>{
  
  // next: first check for board, false or get_id and check for thread
  
  console.log("inside isExistingThread with ",thread);
  await Thread.find({
    board: thread.board,
    text: thread.text,
    delete_password: thread.delete_password
    },(err,data)=>{
      if(err){
        console.log("error reading thread DB", err);
        return done(err);
      }else{
        console.log("recieved from mongodb : ", data)
        if(data.length==0){
           console.log("api 82 Thread is new ");
          return done(null, false);
        }else{
          console.log("Thread already exists, doc: ", typeof(data), data[0]._id, JSON.stringify(data));
          return done(null, data);                             
        }
      }
  })    
}

var saveThread=async(Thread, done)=>{
  console.log("saving thread ", Thread);
  try{
    await Thread.save(done);
      
//       =>{
//       if (err) console.log("error saving at 100 ", err);
//       else{
//         return done(null, doc);
//       }
//     });    // save thread call done with the resulting doc
      
    
   }catch(err){
     console.log("error saving thread ", err, Thread );
     done(err);
   }
//   return true;
 }
//    var findReplies=async(id, done)=>{

//     await Thread.find(
//       id, (err, data)=>{
//         if(err) console.log("findDoc error reading DB ", id);
//         if(data){
//           if(data.replies){
//             return done(null, data);
//           }
//         }else{
//           console.log("checking to see if this is sent back");
//             data="no Replies yet";
//             return done(null, null);
//        }
//       }
//     )
//   }
  
  app.route('/api').get((req,res)=>{
    res.sendFile(process.cwd() + '/views/index.html');
  });
  
  app.route('/api/threads/:board').get(async(req,res)=>{
    let board =req.params;
    
    console.log("api/threads board GET is ",board);
    //res.redirect(`/b/{board}`);
    
    // hit db to get all entries for :board
    let boardData;
    await findBoard(board, function(err, data){
      if (err) console.log(err);
      if( data){
        console.log("got data 181", data);
        boardData=data;
        return (data);
      }else{
        console.log("should never see this because board will already be saved");
        return (null);
      }
    });
    console.log("188 boardData is :",boardData);
    res.json(boardData);
    
    // return entries
    
    
  }).put((req,res)=>{
    
  }).post(async (req,res)=>{
    //var {text, reported, delete_password, replies}=req.body;
      var {board, text, delete_password } = req.body;
    console.log("/api/threads/:board  POST recieved: ", req.body, req.params);// board,text, password only?
    if(!req.body.board){
      if(req.params){
        req.body.board=req.params; 
      }
    }
    console.log("going to look up ",req.body);
    // check for existing board:
    let isExisting;
    await isExistingThread(req.body, function(err,result){
      if(err) console.log("err reading from DB api 206", err);
      else{ 
        isExisting=result;  
        // no need for return value as doc is loaded into variable instead
      }
    });//returns undefined or doc if exists
    let thisThread=null;
    var saved;
    console.log("is existing should be false/undefined or contain doc ", isExisting);
  // save if new, or load data into 'thisThread' if existing
    if(!isExisting){
      thisThread = await new Thread(req.body);
      console.log("about to save ",thisThread);
     
      await saveThread(thisThread, function(err, doc){
        if(err) console.log("err saving to db 221", err);
        else{
          saved=true;  // saved will now containg _id
          console.log("saved is ", saved);
          return;
          }
      });// essentially load up _id
      console.log("saved status is ",saved);
    }else{
      thisThread=isExisting; // if existing board, it's data will be sent back with _id
    }  
  // now we have board
  //mongo will add _id on save
   console.log("api 234 redirect with thisThread : ", thisThread);
   res.redirect('/b/'+thisThread.board+"/"+thisThread._id);  //(`/b/{board}`);  
    
  }).delete((req,res)=>{
    
  });
    
  app.route('/api/replies/:board').get(async(req,res)=>{
    let board=req.params;
    let thread_id=req.query;

    console.log("GET replies/:board recieved from front end - id? ", thread_id, board);
     let _id=await mongoose.Types.ObjectId(thread_id.thread_id);    // convert JSON sent in into _id
    //hit db to get replies for :board
    console.log("_id converted ", _id);
    let thisBoard ; 
    await findThread(_id, function(err, doc){
      if(err) console.log("errror reading from db 251 ", err);
      if(doc){
       // thisBoard=doc;  
        console.log("recieved in api/replies/:board doc = ", doc);
        thisBoard=doc;
        //return doc;
      }else return (null, "no DOC found")
    });
    console.log( "api/replies/:board results of board on DB: ", thisBoard);
    
      if (thisBoard){
//         if (!thisBoard.replies){
          
//             let fakeReply =new Reply({text:"No Replies Yet", delete_password:"a"});
//           console.log("adding reply to avoid html error ", fakeReply);
//           thisBoard[0].replies.push(fakeReply);  // needed to avoid error in required html
//           }
        console.log("sending result ",thisBoard ); 
        return res.send(thisBoard); 
      }else {

        //let path=window.location.pathname;
        // var currentURL = window.location.pathname.slice(3);
        //  currentURL = currentURL.split('/');

       console.log("No replies here  ", thisBoard);
        
        let returnObject={};
        returnObject._id=_id;  // add replies value to send back(stop error if no replies)
        returnObject.replies=[null];
        returnObject.board=board.board;
        let loadedReturnObject= new Reply(returnObject)
        console.log(loadedReturnObject,"sent ",_id, thisBoard, );
        return res.json(loadedReturnObject);  // send empty replies to allow page to load
   
      }
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
  let isExisting;
  if(!isExistingThread(board, function(err,result){
      if(err) console.log("err reading from DB api 322", err);
      else{ 
        isExisting=result;  
        return true;  // thread exists, returns true to pass if statement
      }
  })){  // if NOT existing Thread:
    try{
      let newThread= new Thread(req.body);
      saveThread(newThread, function(err, result){
        if (err) console.log("err saving to db 331 /b/:board ", err);
        else{
          console.log("Thread saved" , result);
          newThread=result;//this will add _id to Thread
        }
      });
      }catch{
        console.log("error saving new thread to DB /b/:board")
        return res.send("error saving board to DB");
      }
  }else return true;
  
  res.sendFile(process.cwd() + '/views/board.html');
});
  
app.route('/b/:board/:threadid')
  .get(function (req, res) {
    
    res.sendFile(process.cwd() + '/views/thread.html');
  });
  
};
