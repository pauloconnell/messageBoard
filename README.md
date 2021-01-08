## **FreeCodeCamp**- Information Security and Quality Assurance

[![Run on Repl.it](https://repl.it/badge/github/freeCodeCamp/boilerplate-project-messageboard)](https://repl.it/github/freeCodeCamp/boilerplate-project-messageboard)

Project Anon Message Board

1. SET NODE_ENV to `test` without quotes when ready to write tests and DB to your databases connection string (in .env)
2. Recomended to create controllers/handlers and handle routing in routes/api.js
3. You will add any security features to `server.js`
4. You will create all of the functional/unit tests in `tests/2_functional-tests.js` and `tests/1_unit-tests.js` but only functional will be tested

# Design Documentation :

## Title and People

    Author: Paul O'Connell
    Reviewer:
    Last Updated: Dec 28 2020

## Overview

    Message board that allows users to add password protected content without requiring users to log in

Users must remember thier password to be able to delete thier own content later if they want.
Users can create or pick any board topic, all threads with that same board name = board.
Users can add content to any board, or flag inappropriate content.
ect as per index.html

## Context

    Create secure messageboard without needing to create user profiles - simply use password on each post to allow deletion of that post.

## Goals and Non-Goals

    GOALS -  see readme, NEXT send full list on querry   /api/replies/{board}?thread_id={thread_id}. Also hiding _id &reported
    NON-GOALS- if 2 threads have same content, not going to worry about potential duplicate threads
    -

## Milestones

    Start Date: Dec 7, 2020

```
Milestone 1 — Done Hook up MongoDB and code up api route to allow board/Thread creation Dec 15
Milestone 2 - Done Get replies working seamlessly - note General board is causing errors fix Dec 29
Milestone 3 - build out other API routes to delete ect. Jan 2021
End Date: Jan 2021
Milestone 4 - Future project(non-goal) - add a feature to show all boards, and be able to click on any list item to access that board
```

## Existing Solution/User Story

See UserStories @ index.html

# Design patern here:

## Proposed Solution

    Technical Architecture is apparently intentionally confusing for this application, so a flow chart works best:

```
 Create new Thread:
  POST=> api/threads/:board
    index.html  user inputs newThread  into NEW THREAD form: POST=> api/threads/:board  which saves Thread
    redirects to GET=> b/:board(NOT WITH /:id so it shows ALL Threads in this board)  which
  =>Board.html will GET => api/threads/:board which sends back all threads on this board:(limited to 10 most recient)
     From here, user can reply to any Thread on this board
Report a thread
  PUT=> /api/threads/{board}
    call reportThread, which changes it's reported value to true


Create a reply on a Thread:
     board.html showing all(10 most recient) threads, user replies to any thread:
  =>POST to api/replies/:board, which calls saveReply(replyWithThreadIdIncluded, done) and redirects to =>b:/:Board/:Id which redirects to=> thread.html
     thread.html calls
  GET => api/replies/:board which  sorts by date, and return 10 most recient threads in this board - limited to most recient three replies each
      EITHER board.html OR thread.html can save a reply to thread
  DELETE => calls deleteReply, which hits db to confirm password, then updates reply TEXT to be "deleted" as per specs
Report a reply
  PUT => /api/replies/{board}, which calls reportReply(thread_id, reply_id, done) hits db updates reported to True

URL Querry=>  /api/replies/:board/?_id=xxx   ALL replies are sent back in JSON




```

## Alternative Solutions

    Pros/Cons of Alternatives - also can we use 3rd party/open source solution?

## Testability, Monitoring and Alerting

    detail testing

## Cross-Team Impact

    negative consequences/security vulnerabilities - cost$$$, support burden?

## Open Questions

    Known Unknowns

## Detailed Scoping and Timeline (Used by dev team during creation)

    how and when each section of project will be done -

```
-Milestone 4 - Overview of all boards
  on index page, show a list of links to each 'board'
    -create function to access db, and create a list of unique board names with a link to that 'board'
    -create component to house this list and include it on the index page and in Thread.html so it's easily accessable



```
