**FreeCodeCamp**- Information Security and Quality Assurance
------

[![Run on Repl.it](https://repl.it/badge/github/freeCodeCamp/boilerplate-project-messageboard)](https://repl.it/github/freeCodeCamp/boilerplate-project-messageboard)

Project Anon Message Board

1) SET NODE_ENV to `test` without quotes when ready to write tests and DB to your databases connection string (in .env)
2) Recomended to create controllers/handlers and handle routing in routes/api.js
3) You will add any security features to `server.js`
4) You will create all of the functional/unit tests in `tests/2_functional-tests.js` and `tests/1_unit-tests.js` but only functional will be tested


#  Design Documentation :

## Title and People
	Author: Paul O'Connell
	Reviewer:
	Last Updated: Dec 28 2020

## Overview
	Message board that allows users to add password protected content without requiring users to log in 
  Users must remember thier password to be able to delete thier own content later if they want.
  Users can create or pick any board topic, all threads with that same board name =  board.
  Users can add content to any board, or flag inappropriate content.
  ect as per index.html

## Context
	Create secure messageboard without needing to create user profiles - simply use password on each post to allow deletion of that post.
  
## Goals and Non-Goals
	GOALS -   Make it work :) NEXT ensure complete functionality of posting from general link AND from index.html
	NON-GOALS- if 2 threads have same content, not going to worry about potential duplicate threads
    -

## Milestones
	Start Date: Dec 7, 2020
  Milestone 1 — Hook up MongoDB and code up api route to allow board/Thread creation Dec 15
	Milestone 2 - Get replies working seamlessly - note General board is causing errors fix Dec 29
  Milestone 2 - build out other API routes to delete ect. Jan 2021
	End Date: Jan 2021

## Existing Solution/User Story
  See UserStories @ index.html
  
# Design patern here:
## Proposed Solution
	Technical Architecture is apparently intentionally confusing for this application, so a flow chart works best:
  index.html  user inputs newThread  into form: POST=> api/threads/:board  which saves Thread
    redirects to GET b/:board(NOT WITH /:id so it shows ALL Threads in this board)  which  displays board.html = board with all threads
    
    
    redirects to:
      => thread.html which calls
        GET => api/replies/:board which  Should just display all the threads in this board
        calls
          saveReply(replyWithThreadIdIncluded, done) which returns:
        
        looks up _id to retrieve replies on this thread
  thread.html REPLY input from form: POST=> api/threads/reply/:board which

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