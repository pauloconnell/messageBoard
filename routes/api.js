// Design Doc: In ReadMe
// - this challenge is  confusing as each action creates a chain of API calls and HTML page changes

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
    bumped_on: { type: Date, required: false, default: new Date() },
    reported: { type: Boolean, default: false, required: true },
    delete_password: { type: String, required: true },
    replycount: { type: Number, default: 0 },
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
      board = { board: board };
      board = { board: board }; // General board links with object, so ensure we have object to look up here
    }
    await Thread.find(board)
      .sort({ bumped_on: -1 })
      .exec((err, data) => {
        if (err) console.log("findBoard error reading DB ", board, err);
        if (data.length == 0) {
          console.log(" It should be Impossible, but no board yet for ", board);

          return done(null, false);
        } else {
          console.log("found board", board, JSON.stringify(data));

          // arrange results as per spec
          while (data.length >= 11) {
            data.pop();
            console.log("trimming to 10 items ", data.length);
          }
          console.log("data now has max 10 items ", data.length);

          data.forEach(doc => {
            delete data.reported;
            delete data.delete_password;
            while (doc.replies.length >= 4) {
              doc.replies.shift(); // remove the oldest reply until there are only 3 most receint here
            }
            console.log(
              "prepared 10 data with max 3 replies",
              doc.text,
              doc.bumped_on,
              doc.replies
            );
            //doc.replies=doc.replies.slice(doc.replies.length-2);
          });
          console.log("now data is max 10 items, with max 3 replies");

          //          I can GET an array of the most recent 10 bumped threads on the board with only the most recent 3 replies from /api/threads/{board}.
          //The reported and delete_passwords fields will not be sent.

          return done(null, data);
        }
      });
  };

  var findThread = (id, done) => {
    // called at 339
    console.log("FindThread about to look up ", id);
    Thread.findById(id, done);
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
    thread.created_on = new Date(); // update time -otherwise it will default to time when model was instantated
    thread.bumped_on = new Date();
    console.log("In saveThread, saving thread ", thread);
    let threadSaved = new Thread(thread); // convert data to Thread (adds _id)
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
  var saveReply = async (board, reply, done) => {
    console.log("inside saveReply with ", reply);
    // prep reply to be converted to schema:
    let threadId = reply.thread_id; // as per reply format passed in
    delete reply._id; // to allow new _id for this reply
    reply.created_on = new Date(); // update created on date (otherwise it defaults to when Thread was instantated)
    let newReply = new Reply(reply);
    //update bumped on date in board
    await Thread.find(board, (err, doc)=>{
      if(err) console.log("error reading board from DB ", err);
      if(doc){
        doc.bumped_on= new Date();
      }
      doc.save();
    })
    // update reply in thread, save and send data back
    await Thread.findById(threadId, (err, data) => {
      if (err) console.log("findDoc error reading DB ", threadId);
      if (data) {
        console.log("data on this thread is ", data);
        data.replies.push(newReply);
        data.replycount++;
        data.bumped_on = new Date(); // updated bumped on date for this thread
        console.log("data updated to be ", data);
        data.save();
        return done(null, data);
      } else {
        console.log("checking to see if this is sent back");
        data = "no Replies yet";
        return done(null, null);
      }
    });
  };

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
          console.log("got data, about to send ", typeof data, data.length);
          // done in findBoard
          // while(data.length>=10){
          //   data=data.pop();
          //   }
          console.log("data now has max 10 items ", data);

          data.forEach((doc, index) => {
            doc.replies.sort(doc.replies.created_on);
            delete data.reported;
            delete data.delete_password;
            if (doc.replies.length >= 3) doc.replies.slice(2);
          });
          console.log("now data is max 10 items, with max 3 replies");

          //          I can GET an array of the most recent 10 bumped threads on the board with only the most recent 3 replies from /api/threads/{board}.
          //The reported and delete_passwords fields will not be sent.

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
      // save Thread -which creates thread for board
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
      // let boardFound;
      //  let threadFound;
      // no need to find board, just save Thread
      let thisThread = null;
      var saved = false;
      // do this in saveThread to save time in Server      thisThread = await new Thread(req.body); // prep for save/add _id ect
      console.log("about to save ", req.body);
      await saveThread(req.body, function(err, doc) {
        if (err) console.log("err saving to db ", err);
        if (doc) {
          saved = true; // saved will now containg _id
          console.log("saveThread returned doc, ", doc.board, doc);

          res.redirect("/b/" + doc.board + "/");
        }
      }); //.then();
      console.log(
        "Note: awaiting saved, but this executes first so saved? ",
        saved
      );
      // now we have board and _id
      console.log(" will redirect  thisThread to GET b/board ");
      // res.redirect("/b/" + thisThread.board);// redirect to board showing all replies instead of just this thread => + "/" + thisThread._id); //(`/b/{board}`);
    })
    .delete((req, res) => {});
  /////////////////////////////////////////////////

  app
    .route("/api/replies/:board/:_id")
    .get(async (req, res) => {
      //check for replies and return replies or null?
      let {board} = req.params;
      let { id, _id, thread_id } = req.query;
      if (thread_id) {
        _id = thread_id;
      }
      if (id) {
        _id = id;
      }
      console.log(
        "GET replies/:board recieved from front end - id? ",
        thread_id,
        board
      );
      _id = await mongoose.Types.ObjectId(thread_id.thread_id); // convert JSON sent in into _id NOT NEEDED
      //hit db to get replies for :board
      console.log("_id converted ", _id);
      //  var thisBoard;
      await findThread(_id, function(err, doc) {
        if (err) console.log("error reading from db ", err);
        if (doc) {
          // thisBoard=doc;
          console.log("recieved in api/replies/:board doc = ", doc);
          res.json(doc);
        } else return null, "impossible, but no DOC found";
      });
    })
    .put((req, res) => {})
    .post(async (req, res) => {
      console.log("inside POST @ api/ALLreplies/board ", req.body, req.params);
    });

  ////////////////////////////////////////////////////////////
  app
    .route("/api/replies/:board")
    .get(async (req, res) => {
      //check for replies and return replies or null?
      let board = req.params;
      let {_id, id, thread_id} = req.query;
      if (thread_id) {
        _id = thread_id;
      }
      if (id) {
        _id = id;
      }
    // if querried specific thread, return all replies
    if(_id){
      console.log("_id present, so returning all replies ", _id);
      //  var thisBoard;
      await findThread(_id, function(err, doc) {
        if (err) console.log("error reading from db ", err);
        if (doc) {
          // thisBoard=doc;
          console.log("recieved in api/replies/:board doc = ", doc);
          res.json(doc);
        } else return null, "impossible, but no DOC found";
      });
    }else{
    
    
      console.log(
        "GET replies/:board recieved from front end - id? ",
        thread_id,
        board
      );
      _id = await mongoose.Types.ObjectId(thread_id.thread_id); // convert JSON sent in into _id NOT NEEDED
      //hit db to get replies for :board
      console.log("_id converted ", _id);
      //  var thisBoard;
      await findThread(_id, function(err, doc) {
        if (err) console.log("error reading from db ", err);
        if (doc) {
          console.log("recieved in api/replies/:board doc = ", doc);
          
          // only return the three most recient docs:
          if (doc.replies.length >= 3) {
            doc.replies.sort((a, b) => {
              if (a.replies) {
                return a.replies.bumped_on - b.replies.bumped_on;
              } else console.log("no replies here");
            });
            doc.replies = doc.replies.splice(3);
          }
          
          console.log("now our doc is ", doc);
          res.json(doc);
        } else return null, "impossible, but no DOC found";
      });
      //      console.log("api/replies/:board results of board on DB: ", thisBoard);

      //       if (thisBoard) {
      //         console.log("found board any replies? ", thisBoard);
      //         if (thisBoard.replies) {
      //           return res.json(thisBoard);
      //         } else {
      //           //let path=window.location.pathname;
      //           // var currentURL = window.location.pathname.slice(3);
      //           //  currentURL = currentURL.split('/');

      //           console.log("No replies here  ", thisBoard);

      //           res.json(thisBoard);
      //         }
      //    //   }
      }
    })
    .put((req, res) => {})
    .post(async (req, res) => {
      console.log("inside POST @ api/replies/board ", req.body, req.params);
      // need to get thread_id from params?

      let _id = req.body.thread_id; //mongoose.Types.ObjectId(req.body.thread_id); // convert JSON sent in into _id
      let text = req.body.text;
      console.log(" configuring replies to save to db. Reply Text is:", text);
      // must find board name from thread_id
      var boardName = req.params.board;
      // await findBoard(_id, function(err, data){
      //   if(err) console.log(err);
      //   if(data){
      //     boardName=data.board;
      //     console.log("board name found from ID, ",boardName, JSON.stringify(data));
      //   }
      // })

      // need function to be passed reply and thread id, and save reply to thread
      await saveReply(boardName, req.body, (err, doc) => {
        if (err) console.log(err);
        if (doc) {
          console.log("saved the reply to DB: ", doc);
          res.redirect("/b/" + boardName + "/" + _id); //+'/views/thread.html');
        }
      });
      //   let newReply = new Reply(req.body);
      //   let savedReply = await Thread.findOne(_id); //,  { $push: { replies: newReply} });
      //   savedReply.replies.push(newReply);
      //   await savedReply.save();
      //   console.log("saved the reply to DB: ", savedReply.board, savedReply);
      //   res.redirect("/b/" + savedReply.board + "/" + savedReply._id); //+'/views/thread.html');
    })
    .delete((req, res) => {});

  // create route for full response of thread:
  app.route("/api/replies/:board/:_id").get(async (req, res) => {
    let { _id, board } = req.params;
    console.log("inside api/replies/:board/:_id", _id, board);
    await findThread(_id, function(err, doc) {
      if (err) console.log("error reading from db ", err);
      if (doc) {
        // thisBoard=doc;
        console.log("recieved in api/replies/:board doc = ", doc);
        // thisBoard = doc;

        //want all docs and all replies, but no report info/passwords

        //           if(doc.replies.length>=3){
        //             doc.replies.sort((a,b)=>{
        //               if(a.replies){
        //                 return (a.replies.bumped_on-b.replies.bumped_on);
        //               }else console.log("no replies here" );
        //             }
        //             );
        //              doc.replies=doc.replies.splice(3);
        //           }

        console.log("now our doc is ", doc);
        res.json(doc);
      } else return null, "impossible, but no DOC found";
    });
  });

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
