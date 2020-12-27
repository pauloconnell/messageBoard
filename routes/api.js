/*
 *
 *
 *       Complete the API routing below
 *
 *
 */

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
    replies: [replySchema]
  });

  const Thread = mongoose.model("Thread", threadSchema);

  const Reply = mongoose.model("Reply", replySchema);

  console.log("mongoose is: " + mongoose.connection.readyState);
  console.log(
    "readyState codes are:   0: disconnected      1: connected  2: connecting    3: disconnecting "
  );

  // define our helper functions to handle database calls

  //findBoard(board, done) - looks up board, returns false if no data or calls done with data
  //findThread(id, done)
  //findReplies(id, done)    // next line 303 clean up with findReplies NEXT
  //isExistingThread(thread, done)
  //saveThread(thread, done)
  // NOTE: no saveBoard, as a 'board' is simply a bunch of different Threads with the same 'board' name

  // Design Doc:
  // index.html will take in form data and post to
  // api/threads/:board - which calls find Board
  // if no board, call saveBoard, or look up this Thread to see if it's already on the board - call findThread
  //

  // hit DB to get all docs for this board
  var findBoard = async (board, done) => {
    console.log("FindBoard about to look up ", board);
    var boardFound = await Thread.find({ board: board }, (err, data) => {
      if (err) console.log("findDoc error reading DB ", board);
      if (data.length == 0) {
        console.log("need to save, no board yet for ", board);
        //if(data.replies){
        //  return done(null, data);
        //}else{
        //           console.log("found  file ", JSON.stringify(data));
        return done(null, false);
      } else {
        console.log("found board", board, JSON.stringify(data));

        return done(null, data);
      }
    });
  };

  var findThread = async id => {
    console.log("FindThread about to look up ", id);
    const threadFound = await Thread.find(id, (err, data) => {
      if (err) console.log("findDoc error reading DB ", id);
      if (data.length >= 1) {
        //        if (data.replies) {
        //          return done(null, data);
        //        } else {
        console.log("found  file ", data, data[0].replies);
        //  if(done){
        //    return done(null, data);
        //  }else
        return data[0].replies;
        //        }
      } else {
        console.log(
          "checking to see if this is sent back, should always find doc(and not see this)"
        );
        data = "no data yet";
        return null;
      }
    });
  };

  // check if thread exists before calling saveThread
  var isExistingThread = async (thread, done) => {
    // next: first check for board, false or get_id and check for thread
    var found_id;
    var found_doc;
    console.log("inside isExistingThread with ", thread);
    await findBoard(thread.board, (err, doc) => {
      if (err) console.log(" error looking up board on db ", err);
      if (doc.length == 0) {
        console.log();
        console.log("found board ", doc[0]);
        doc.forEach(doc => {
          console.log(doc, thread);
          if (
            doc.board == thread.board &&
            doc.text == thread.text &&
            doc.delete_password == thread.delete_password
          ) {
            found_doc = doc; // causing next error
            console.log("our thread/doc is ", doc);
          }
        });
      }
    });
    console.log("inside isExistingThread with ", thread);
    await Thread.find(
      {
        _id: found_id
        //board:  thread.board,      // redundant, remove later
        //text:   thread.text,
        //delete_password: thread.delete_password
      },
      (err, data) => {
        if (err) {
          console.log("error reading thread DB", err);
          return done(err);
        }
        if (data) {
          console.log("recieved from mongodb : ", data);
          if (data.length == 0) {
            console.log("api 82 Thread is new ");
            return done(null, false);
          } else {
            console.log(
              "Thread already exists, doc: ",
              typeof data,
              data[0]._id,
              JSON.stringify(data)
            );
            return done(null, true);
          }
        }
      }
    );
  };

  var saveThread = async (Thread, done) => {
    console.log("saving thread ", Thread);
    try {
      await Thread.save(done);

      //       =>{
      //       if (err) console.log("error saving at 100 ", err);
      //       else{
      //         return done(null, doc);
      //       }
      //     });    // save thread call done with the resulting doc
    } catch (err) {
      console.log("error saving thread ", err, Thread);
      done(err);
    }
    //   return true;
  };
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

  app.route("/api").get((req, res) => {
    res.sendFile(process.cwd() + "/views/index.html");
  });

  app
    .route("/api/threads/:board")
    .get(async (req, res) => {
      let board = req.params;

      console.log("api/threads board GET is ", board);
      //res.redirect(`/b/{board}`);

      // hit db to get all entries for :board
      let boardData = await findBoard(board, function(err, data) {
        if (err) console.log(err);
        if (data) {
          console.log("got data 181", data);
          return null, data;
          return;
        } else {
          console.log(
            "should never see this because board will be returned or already be saved and returned from findBoard"
          );
          // return null;
        }
      });
      console.log("188 boardData is :", boardData);
      res.json(boardData);

      // return entries
    })
    .put((req, res) => {})
    .post(async (req, res) => {
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
      console.log("going to look up board ", gotPost.board);
      // check for existing board:
      let boardFound;
      await findBoard(gotPost.board, async function(err, result) {
        if (err) console.log("err reading from DB api 236", err);
        if (result == false) {
          boardFound = false;
          // board not found so save it here
          await saveThread(gotPost);
          console.log("No existing board found", gotPost);
        } else {
          console.log("findBoard returned doc ", result);
          boardFound = result;
        }
      });
      var isExisting;
      if (boardFound) {
        await isExistingThread(gotPost, function(err, result) {
          if (err) console.log("err reading from DB api 246", err);
          if (result.length >= 1) {
            console.log("isExistingThread returned doc ", result);
            isExisting = result;
          } else {
            isExisting = false;
            console.log("Not existing so must save...");
          }
        }); //returns undefined or doc if exists
      }
      let thisThread = null;
      var saved;
      console.log(
        "is existing should be false/undefined or contain doc ",
        isExisting
      );
      // save if new, or load data into 'thisThread' if existing
      if (!isExisting) {
        thisThread = await new Thread(req.body);
        console.log("about to save ", thisThread);

        await saveThread(thisThread, function(err, doc) {
          if (err) console.log("err saving to db 241", err);
          else {
            saved = true; // saved will now containg _id
            console.log("saved is ", saved);
            return;
          }
        }); // essentially load up _id
        console.log("saved status is ", saved);
      } else {
        thisThread = isExisting; // if existing board, it's data will be sent back with _id
      }
      // now we have board

      console.log("api 254 redirect with thisThread : ", thisThread);
      res.redirect("/b/" + thisThread.board + "/" + thisThread._id); //(`/b/{board}`);
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
      let _id = await mongoose.Types.ObjectId(thread_id.thread_id); // convert JSON sent in into _id
      //hit db to get replies for :board
      console.log("_id converted ", _id);
      var thisBoard = await findThread(_id);
      // , function(err, doc) {
      //   if (err) console.log("errror reading from db 281 ", err);
      //   if (doc) {
      //     // thisBoard=doc;
      //     console.log("recieved in api/replies/:board doc = ", doc);
      //     thisBoard = doc;
      //     //return doc;
      //   } else return null, "no DOC found";
      // });
      // console.log("api/replies/:board results of board on DB: ", thisBoard);

      if (thisBoard) {
        //         if (!thisBoard.replies){

        //             let fakeReply =new Reply({text:"No Replies Yet", delete_password:"a"});
        //           console.log("adding reply to avoid html error ", fakeReply);
        //           thisBoard[0].replies.push(fakeReply);  // needed to avoid error in required html
        //           }
        console.log("found board any replies? ", thisBoard);
        if (thisBoard.replies) {
          return res.send(thisBoard);
        } //else{
        // thisBoard.replies=null;
        // return res.send(thisBoard);
        //}
      } else {
        //let path=window.location.pathname;
        // var currentURL = window.location.pathname.slice(3);
        //  currentURL = currentURL.split('/');

        console.log("No replies here  ", thisBoard);
        res.send(thisBoard);
        // let returnObject = {};
        // returnObject._id = _id; // add replies value to send back(stop error if no replies)
        // returnObject.replies = [null];
        // returnObject.board = board.board;
        // let loadedReturnObject = new Reply(returnObject);
        // console.log(loadedReturnObject, "sent ", _id, thisBoard);
        // return res.json(loadedReturnObject); // send empty replies to allow page to load
      }
      // }
    })
    .put((req, res) => {})
    .post(async (req, res) => {
      console.log(
        "inside POST @ api/replies/board ",
        req.body,
        req.body.thread_id
      );
      let _id = mongoose.Types.ObjectId(req.body.thread_id); // convert JSON sent in into _id
      let text = req.body.text;
      console.log(" configuring replies to save to db. Reply Text is:", text);
      let newReply = new Reply(req.body);
      let savedReply = await Thread.findOne(_id); //,  { $push: { replies: newReply} });
      savedReply.replies.push(newReply);
      await savedReply.save();
      console.log("saved the reply to DB: ", savedReply.board, savedReply);
      res.redirect("/b/" + savedReply.board + "/" + savedReply._id); //+'/views/thread.html');
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
            let newThread = new Thread(req.body);
            saveThread(newThread, function(err, result) {
              if (err) console.log("err saving to db 331 /b/:board ", err);
              else {
                console.log("Thread saved", result);
                newThread = result; //this will add _id to Thread
              }
            });
          } catch {
            console.log("error saving new thread to DB /b/:board");
            return res.send("error saving board to DB");
          }
        }

        res.sendFile(process.cwd() + "/views/board.html");
      });
    });

  app.route("/b/:board/:threadid").get(function(req, res) {
    res.sendFile(process.cwd() + "/views/thread.html");
  });
};
