// Design Doc: In ReadMe - quick guide here:
// - this challenge is a bit confusing as each submit/action creates a chain of API calls and HTML page changes

// helper functions to handle database calls
//findBoard(board, done) - looks up board, returns false if no data or calls done with data of all threads on this board
//findThread(id, done)  - looks up Thread by ID returns thread
//saveReplies(replyWithThread_IdIncluded, done)    - saves reply to Thread
//isExistingThread(board, done) - NOT USED - NonGoal= avoid duplicate threads
//saveThread(thread, done)
//deleteThread(thread_id, delete_password)
//reportThread(_id, done)
//reportReply(thread_id, reply_id, done)
// NOTE: no saveBoard, as a 'board' is simply a bunch of different Threads with the same 'board' name

//API ROUTES:
///api/threads/:board    - filters results to 10 most reciently bumped threads, with latest 3 replies
///api/replies/:board"    - accepts query ?id=xxx
///api/replies/:board/:_id"
//b/:board/"
///b/:board/:threadid

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
  // threads are board topics, which hold their own replies in an array

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
    bumped_on: { type: Date, required: false, default: new Date() }, // bumped_on date is the date an update to thread occurs-this is used to sort threads(display most recent)
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

  // hit DB to get list of all boards
  var findAllBoards = async done => {
    console.log("FindAllBoards about to get boards");

    await Thread.find()
      .sort({ bumped_on: -1 })
      .exec((err, data) => {
        if (err) console.log("findBoard error reading DB ", err);
        if (data.length == 0) {
          console.log(" No boards yet for ");
          return done(null, false);
        } else {
          console.log("found boards", JSON.stringify(data));
          // arrange results as per spec
          while (data.length >= 11) {
            data.pop();
            console.log("trimming to 10 items ", data.length);
          }
          console.log("data now has max 10 items ", data.length);
          let onlyBoards = [];
          data.forEach(doc => {
            onlyBoards.push(doc.board);

            while (doc.replies.length >= 4) {
              doc.replies.shift(); // remove the oldest reply until there are only 3 most recent here
            }
          });
          console.log("prepared board names");
          return done(null, onlyBoards);
        }
      });
  };

  // hit DB to get all docs for this board
  var findBoard = async (board, done) => {
    console.log("FindBoard about to look up ", board, typeof board);
    if (typeof board != "object") {
      board = { board: board }; // General board links with object, so ensure we have object to look up here
      //          I can GET an array of the most recent 10 bumped threads on the board with only the most recent 3 replies from /api/threads/{board}.
    } // sort results based on most recent 'bumped' threads-showing most recent 10
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
            delete data.reported; //The reported and delete_passwords fields will not be sent.
            delete data.delete_password;
            while (doc.replies.length >= 4) {
              doc.replies.shift(); // remove the oldest reply until there are only 3 most recent here
            }
            console.log(
              "prepared 10 data with max 3 replies",
              doc.text,
              doc.bumped_on,
              doc.replies
            );
          });
          console.log("now data is max 10 items, with max 3 replies");

          return done(null, data);
        }
      });
  };

  var findThread = (id, done) => {
    // called at 339
    console.log("FindThread about to look up ", id);
    Thread.findById(id, done);
  };

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

  // function to save replies NOTE: thread ID is saved in reply Object for use here, then deleted out
  var saveReply = async (id, reply, done) => {
    console.log("inside saveReply with ", id, reply);
    // prep reply to be converted to schema:
    let threadId = reply.thread_id; // as per reply format passed in
    delete reply._id; // to allow new _id for this reply
    reply.created_on = new Date(); // update created on date (otherwise it defaults to when Thread was instantated)
    let newReply = new Reply(reply);
    //update bumped on date in board
    await Thread.findOneAndUpdate({ _id: id }, { bumped_on: new Date() });

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

  var deleteThread = async (thread_id, reply_id, delete_password, done) => {
    await Thread.findOne({ _id: thread_id }, async (err, data) => {
      if (err) console.log(err);
      if (data) {
        if (data.delete_password == delete_password) {
          console.log("about to remove this thread ", data);
          await data.remove();
          return done(null, "success delete completed ");
        } else return done(null, "incorrect password");
      }
    });
  };

  var deleteReply = async (thread_id, reply_id, delete_password, done) => {
    console.log(
      "inside deleteReply with ",
      thread_id,
      reply_id,
      delete_password
    );
    var noPasswordFound = true;

    // must first confirm password

    await Thread.findOne({ _id: thread_id }, async (err, data) => {
      if (err) console.log(err);
      if (data) {
        console.log("found thread with replies: ", data.replies);
        if (data.replies) {
          //use for loop using to keep track of which reply this is in the array
          for (var index = 0; index < data.replies.length; index++) {
            if (data.replies[index]._id == reply_id) {
              if (
                data.replies[index].delete_password == delete_password &&
                noPasswordFound
              ) {
                data.replies[index].text = "deleted";
                data.save();
                noPasswordFound = false;
              }
            }
          }
          return done(null, "success");
        } // if data.replies
      } // if data
      if (noPasswordFound) {
        return done(null, "found data but incorrect password");
      } else return done(null, "no replies here to delete");
    });
  };

  var reportThread = async (thread_id, done) => {
    console.log("inside reportThread with ", thread_id);
    await Thread.findOneAndUpdate(
      { _id: thread_id },
      { $set: { reported: true } },
      { new: true },
      async (err, doc) => {
        if (err) console.log("err looking up thread ", thread_id, err);
        else {
          console.log(doc);
          return done(null, "success");
        }
      }
    );
  };

  var reportReply = async (thread_id, reply_id, done) => {
    console.log("inside reportReply with ", reply_id);
    await Thread.findOne({ _id: thread_id }, async (err, doc) => {
      if (err) console.log("err reading from db ", thread_id, err);
      if (doc) {
        if (doc.replies) {
          for (let x = 0; x < doc.replies.length; x++) {
            if (doc.replies[x]._id == reply_id) {
              doc.replies[x].reported = true;
              await doc.save(done(null, "success"));
              console.log("reply has been reported");
              //return done(null, "success")
            }
          }
        }
      } else done("failed to get doc");
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
      // hit db to get all entries for :board, then complete as per requirements:
      //          I can GET an array of the most recent 10 bumped threads on the board with only the most recent 3 replies from /api/threads/{board}.
      //The reported and delete_passwords fields will not be sent.

      let boardData;
      await findBoard(board, function(err, data) {
        if (err) console.log(err);
        if (data) {
          console.log("got data, about to send ", typeof data, data.length); // findBoard trims data to max 10 items
          data.forEach((doc, index) => {
            doc.replies.sort(doc.replies.created_on);
            delete data.reported;
            delete data.delete_password;
            if (doc.replies.length >= 3) doc.replies.slice(2);
          });
          console.log("now data is max 10 items, with max 3 replies");

          res.json(data);
        } else {
          console.log(
            "should never see this because board will be saved and returned from findBoard"
          );
        }
      });
    })
    .put(async (req, res) => {
      var { report_id } = req.body;
      console.log("recieved put api/threads/:board", req.body);
      await reportThread(report_id, async (err, data) => {
        if (err) console.log("err reporting thread", err);
        if (data) {
          console.log("thread reported:", data);
          res.send(data);
        } else res.send("reporting failed");
      });
    })
    .post(async (req, res) => {
      // save Thread -which creates thread for board
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
      let thisThread = null;
      var saved = false;
      console.log("about to save ", req.body);
      await saveThread(req.body, function(err, doc) {
        if (err) console.log("err saving to db ", err);
        if (doc) {
          saved = true; // saved will now containg _id
          console.log("saveThread returned doc, ", doc.board, doc);
          res.redirect("/b/" + doc.board + "/");
        }
      });
      // now we have board and _id
      console.log(
        " will redirect  thisThread to GET b/board after await completes(this will print first) "
      );
    })
    .delete(async (req, res) => {
      var { thread_id, delete_password } = req.body;
      console.log(
        "/api/threads/:board  DELETE recieved: ",
        req.body,
        req.params
      );
      await deleteThread(thread_id, delete_password, async (err, response) => {
        if (err) console.log(err);
        if (response) {
          console.log("response from delete is ", response);
          res.send(response);
        }
      });
    });

  app
    .route("/api/replies/:board")
    .get(async (req, res) => {
      //check for replies and return replies or null?
      let board = req.params;
      let { _id, id, thread_id } = req.query;
      let callFromThreadHtml = false;
      console.log(
        "req.query is thread_id from front end, or _id/id from user query ",
        req.query
      );
      if (thread_id) {
        _id = thread_id;
        callFromThreadHtml = true;
      }
      if (id) {
        _id = id;
        callFromThreadHtml = false;
      }
      // if querried specific thread, return all replies
      if (!callFromThreadHtml) {
        console.log("_id present, so returning all replies ", _id);
        await findThread(_id, function(err, doc) {
          if (err) console.log("error reading from db ", err);
          if (doc) {
            console.log("recieved in api/replies/:board doc = ", doc);
            res.json(doc);
          } else return null, "impossible, but no DOC found";
        });
      } else {
        console.log(
          "GET replies/:board recieved from front end - id? ",
          thread_id,
          board
        );
        _id = await mongoose.Types.ObjectId(thread_id.thread_id); // convert JSON sent in into _id NOT NEEDED
        //hit db to get replies for :board
        console.log("_id converted ", _id);
        await findThread(thread_id, function(err, doc) {
          if (err) console.log("error reading from db ", err);
          if (doc) {
            console.log("recieved in api/replies/:board doc = ", doc);

            // only return the three most recient docs:
            if (doc.replies.length >= 3) {
              doc.replies.reverse(); // just put the most recent replies first, keep 3 and cut off the old ones
              doc.replies = doc.replies.slice(0, 3);
            }

            console.log("now our doc is ", doc);
            res.json(doc);
          } else return null, "impossible, but no DOC found";
        });
      }
    })
    .put(async (req, res) => {
      console.log("inside PUT @ api/replies/board ", req.body);
      var { thread_id, reply_id } = req.body;
      await reportReply(thread_id, reply_id, async (err, doc) => {
        if (err) console.log("error reporting reply ", err);
        if (doc) res.send(doc);
      });
    })
    .post(async (req, res) => {
      console.log("inside POST @ api/replies/board ", req.body, req.params);
      // need to get thread_id from params?

      let _id = req.body.thread_id; //mongoose.Types.ObjectId(req.body.thread_id); // convert JSON sent in into _id
      let text = req.body.text;
      console.log(" configuring replies to save to db. Reply Text is:", text);
      // must find board name from thread_id
      var boardName = req.params.board;

      // need function to be passed reply and thread id, and save reply to thread NOTE: _id is already saved in req.body, but confusing as reply WILL get it's own _id
      await saveReply(_id, req.body, (err, doc) => {
        if (err) console.log(err);
        if (doc) {
          console.log("saved the reply to DB: ", doc);
          res.redirect("/b/" + boardName + "/" + _id); //+'/views/thread.html');
        }
      });
    })
    .delete(async (req, res) => {
      console.log(
        "/api/replies/:board  DELETE recieved: ",
        req.body,
        req.params
      );
      let { thread_id, reply_id, delete_password } = req.body;
      await deleteReply(
        thread_id,
        reply_id,
        delete_password,
        async (err, doc) => {
          if (err) console.log(err);
          else {
            console.log("api recieved back ", doc);
            res.send(doc);
          }
        }
      );
    });

  // create route for full response of thread:
  // NOTE: THIS NEVER GETS CALLED IF USER TYPES api/replies/board?id=xxx, so this is handled above
  // This route handles api/replies/board/id
  app.route("/api/replies/:board/:_id").get(async (req, res) => {
    let { _id, board } = req.params;
    console.log("inside api/replies/:board/:_id", _id, board);
    await findThread(_id, function(err, doc) {
      if (err) console.log("error reading from db ", err);
      if (doc) {
        console.log("recieved in api/replies/:board doc = ", doc);

        console.log("now our doc is ", doc);
        res.json(doc);
      } else return null, "impossible, but no DOC found";
    });
  });

  app.route("/api/allBoards/").get(async (req, res) => {
    //let { _id, board } = req.params;
    console.log("inside api/allBoards");
    await findAllBoards(function(err, doc) {
      if (err) console.log("error reading from db ", err);
      if (doc) {
        console.log("recieved in api/allBoards = ", doc);

        res.json(doc);
      } else return null, "impossible, but no DOC found";
    });
  });

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
                res.sendFile(process.cwd() + "/views/board.html");
              }
            });
          } catch {
            console.log("error saving new thread to DB ");
            return res.send("error saving board to DB");
          }
        }
      });
    });

  app.route("/b/:board/:threadid").get(function(req, res) {
    res.sendFile(process.cwd() + "/views/thread.html");
  });
};
