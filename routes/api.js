// Design Doc:
// See ReadMe - this challenge is  confusing as each action creates a chain of API calls and HTML page changes

// helper functions to handle database calls
//findBoard(board, done) - looks up board, returns false if no data or calls done with data of all threads on this board
//findThread(id, done)  - looks up Thread by ID returns thread
//saveReplies(replyWithThread_IdIncluded, done)    - saves reply to Thread
//isExistingThread(board, done)
//saveThread(thread, done)
// NOTE: no saveBoard, as a 'board' is simply a bunch of different Threads with the same 'board' name

"use strict";

var expect = require("chai").expect;
// import mongodb
const mongoose = require("mongoose");
module.exports = function(app) {
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
    text: { type: String, required: true },
    created_on: { type: Date, default: new Date(), required: true },
    reported: { type: Boolean, default: false },
    delete_password: { type: String, required: true }
  });

  var threadSchema = new mongoose.Schema({
    text: { type: String, required: true },
    board: { type: String, required: true },
    created_on: { type: Date, default: new Date(), required: true },
    bumped_on: { type: Date, required: false },
    reported: { type: Boolean, default: false, required: true },
    delete_password: { type: String, required: true },
    replycount:Number,
    replies: [replySchema]
  });

  const Thread = mongoose.model("Thread", threadSchema);

  const Reply = mongoose.model("Reply", replySchema);

  console.log("mongoose is: " + mongoose.connection.readyState);
  console.log(
    "readyState codes are:   0: disconnected      1: connected  2: connecting    3: disconnecting "
  );

  // define our helper functions to handle database calls

  // hit DB to get all docs for this board
  var findBoard = async (board, done) => {
    console.log("FindBoard about to look up ", board, typeof board);
    if (typeof board != "object") {
      board = { board: board }; // General board links with object, so ensure we have object to look up here
    }

    //
    var boardFound = await Thread.find(board, (err, data) => {
      if (err) console.log("findBoard error reading DB ", board, err);
      if (data.length == 0) {
        console.log(" It should be Impossible, but no board yet for ", board);

        return done(null, false);
      } else {
        console.log("found board", board, JSON.stringify(data));

        return done(null, data);
      }
    });
  };

  var findThread = async (id, done) => {
    // called at 339
    console.log("FindThread about to look up ", id);
    const threadFound = await Thread.findById(id, done);
  };

  // check if thread exists before calling saveThread
  // delete this
  // NON GOAL - not going to worry about double threads
  var isExistingThread = async (thread, done) => {
    // next: first check for board, false or get_id and check for thread
    var found_id;
    var found_doc;
    console.log("inside isExistingThread with ", thread);
    await findBoard(thread.board, (err, doc) => {
      // look up all docs on this board
      if (err) console.log(" error looking up board on db ", err);
      if (doc.length >= 1) {
        console.log();
        console.log("found board ", doc[0]);
        doc.forEach(doc => {
          // search through all docs to see if we found our doc(Thread)
          console.log(doc, thread);
          if (
            doc.board == thread.board &&
            doc.text == thread.text &&
            doc.delete_password == thread.delete_password
          ) {
            found_doc = doc;
            console.log("our thread/doc is ", doc);
          }
        });
      } else {
        // if no docs found on this board
      }
    });
    console.log("inside isExistingThread with ", thread);
    return done(null, found_doc);
  };

  var saveThread = async (thread, done) => {
    console.log("In saveThread, saving thread ", thread);
    let threadSaved = new Thread(thread);  // convert data to Thread (adds _id)
    console.log("thread is now :", threadSaved);
    try {
      threadSaved.save(done);
    } catch (err) {
      console.log("error saving thread ", err, Thread);
      done(err);
    }
    //   return true;
  };
  
  // function to find replies
  var saveReply=async(reply, done)=>{
      console.log("inside saveReply with ", reply);
      // prep reply to be converted to schema:
      let threadId=reply.thread_id;  // as per reply format passed in 
      delete reply._id;  // to allow new _id for this reply
      let newReply = new Reply(reply)
      await Thread.findById(
        threadId, (err, data)=>{
          if(err) console.log("findDoc error reading DB ", threadId);
          if(data){
            console.log("data on this thread is ", data);
            data.replies.push(newReply);
            data.save();
            return done(null, data);
          }else{
            console.log("checking to see if this is sent back");
              data="no Replies yet";
              return done(null, null);
         }
        }
      )
    }

  app.route("/api").get((req, res) => {
    res.sendFile(process.cwd() + "/views/index.html");
  });

  app
    .route("/api/threads/:board")
    .get(async (req, res) => {
      // get threads on this board
      let board = req.params;

      console.log("api/threads board GET is ", board);
      //res.redirect(`/b/{board}`);

      // hit db to get all entries for :board
      let boardData;
      await findBoard(board, function(err, data) {
        if (err) console.log(err);
        if (data) {
          console.log("got data, about to send ", typeof data, data);
         // data.forEach((data)=>{
        //    if(data.replies.length>=1){
        //      data.replycount=data.replies.length;
        //      boardData = data;
        //      data.save();
        //    }  
       //   });
          res.json(data);
          
          } else {
          console.log(
            "should never see this because board will be saved and returned from findBoard"
          );
          // return null;
        }
      });
//      console.log("boardData will not be defined here yet :", boardData[0]);
      //res.json(boardData);

      // return entries
    })
    .put((req, res) => {})
    .post(async (req, res) => {
      // save Thread -which 'adds'&OR Creates thread for board
      //var {text, reported, delete_password, replies}=req.body;
      var { board, text, delete_password } = req.body;
      console.log("/api/threads/:board  POST recieved: ", req.body, req.params); // board,text, password only?
      var gotPost = req.body;
      if (!req.body.board) {
        // if clicked on 'testing general' link on index page, board is sent in params
        if (req.params) {
          gotPost.board = req.params.board;
        }
      }
      console.log("saving thread to  board: ", gotPost.board);
      // check for existing board:
      let boardFound;
      let threadFound;
      // no need to find board, just save Thread
      let thisThread = null;
      var saved=false;
// do this in saveThread to save time in Server      thisThread = await new Thread(req.body); // prep for save/add _id ect
      console.log("about to save ", req.body);
      await saveThread(req.body, function(err, doc) {
        if (err) console.log("err saving to db ", err);
        if (doc) {
          saved = true; // saved will now containg _id
          console.log("saveThread returned doc, ", doc.board, doc);
          
          res.redirect("/b/"+doc.board+"/");
        }
      });//.then();
      console.log("Note: awaiting saved, but this executes first so saved? ", saved);
      // now we have board and _id
      console.log(" will redirect  thisThread to GET b/board ");
     // res.redirect("/b/" + thisThread.board);// redirect to board showing all replies instead of just this thread => + "/" + thisThread._id); //(`/b/{board}`);
    })
    .delete((req, res) => {});

  app
    .route("/api/replies/:board")
    .get(async (req, res) => {
      //check for replies and return replies or null?
      let board = req.params;
      let thread_id = req.query;

      console.log(
        "GET replies/:board recieved from front end - id? ",
        thread_id,
        board
      );
      let _id = await mongoose.Types.ObjectId(thread_id.thread_id); // convert JSON sent in into _id NOT NEEDED
      //hit db to get replies for :board
      console.log("_id converted ", _id);
      var thisBoard;
      await findThread(_id, function(err, doc) {
        if (err) console.log("error reading from db ", err);
        if (doc) {
          // thisBoard=doc;
          console.log("recieved in api/replies/:board doc = ", doc);
          thisBoard = doc;
          //return doc;
        } else return (null, "no DOC found");
      })
      console.log("api/replies/:board results of board on DB: ", thisBoard);

      if (thisBoard) {
        console.log("found board any replies? ", thisBoard);
        if (thisBoard.replies) {
          return res.json(thisBoard);
        } else {
          //let path=window.location.pathname;
          // var currentURL = window.location.pathname.slice(3);
          //  currentURL = currentURL.split('/');

          console.log("No replies here  ", thisBoard);

          res.json(thisBoard);
        }
      }
    
    })
    .put((req, res) => {})
    .post(async (req, res) => {
      console.log(
        "inside POST @ api/replies/board ",
        req.body,
        req.body.thread_id
      );
      // need to get thread_id from params?

      let _id = req.body.thread_id; //mongoose.Types.ObjectId(req.body.thread_id); // convert JSON sent in into _id
      let text = req.body.text;
      console.log(" configuring replies to save to db. Reply Text is:", text);
    
    // need function to be passed reply and thread id, and save reply to thread
     await saveReply(req.body, (err, doc)=>{
        if(err) console.log(err);
        if(doc){
          console.log("saved the reply to DB: ", doc);
          res.redirect("/b/" + req.body.board + "/" + _id); //+'/views/thread.html');
        }
  })
   //   let newReply = new Reply(req.body);
   //   let savedReply = await Thread.findOne(_id); //,  { $push: { replies: newReply} });
   //   savedReply.replies.push(newReply);
   //   await savedReply.save();
   //   console.log("saved the reply to DB: ", savedReply.board, savedReply);
   //   res.redirect("/b/" + savedReply.board + "/" + savedReply._id); //+'/views/thread.html');
    })
    .delete((req, res) => {});

  //Sample front-end
  app
    .route("/b/:board/")
    .get(function(req, res) {
      res.sendFile(process.cwd() + "/views/board.html");
    })
    .post(async function(req, res) {
      var { text, reported, delete_password, replies } = req.body;
      var board = req.params;
      console.log("inside b/:board");
      let isExisting = await isExistingThread(board, function(err, result) {
        if (err) console.log("err reading from DB api 322", err);
        if (result) {
          console.log("existing thread found ", result);
          return true; // thread exists, returns true to pass if statement
        } else {
          console.log("Must be a new board");
          return false;
        }
        if (!isExisting) {
          // if NOT existing Thread:
          try {
            // this is done in saveThread  to save server time : let newThread = new Thread(req.body);
            saveThread(req.body, function(err, result) {
              if (err) console.log("err saving to db /b/:board ", err);
              if (result) {
                console.log("Thread saved", result);
                //newThread = result; //this will add _id to Thread
                res.sendFile(process.cwd() + "/views/board.html");              
              }
            });
          } catch {
            console.log("error saving new thread to DB ");
            return res.send("error saving board to DB");
          }
        }

// called after async saveThread call        res.sendFile(process.cwd() + "/views/board.html");
      });
    });

  app.route("/b/:board/:threadid").get(function(req, res) {
    res.sendFile(process.cwd() + "/views/thread.html");
  });
};
