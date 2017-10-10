# TaskBook

The main incentive layer contract is the TaskBook. It inherit from the AccountManager contract. Which handles simple operations like keeping track of a balance and submitting a deposit.  Users can submit deposits to these contracts which will effectively start an account on the TaskBook.

# TaskGiver
This is a user that creates a new task. They exchange Ether for computing tasks like running some C code. Alice can send out a task to be solved with the `newTask` method. That method creates a Task, an ID for that Task, and stores the information in a mapping. A NewTask event is broadcasted over the network. That event is picked up by anyone listening.

# Solver
Once a solver is chosen for a task it solves the task. By running the code in an offchain WASM interpreter. It then submits a hash of that solution to be verified. If challenged, it will then play the verification game.

# Verifier
Verifiers are solvers that can challenge a solution submitted and win jackpots.

# Docker
To run the tests with Docker:
`docker-machine create dev`

`eval $(docker-machine env dev)`

`docker run --name truebit-contracts -ti hswick/truebit-contracts:latest`

`cd truebit-contracts`

`truffle test`

# Truffle
This is a truffle codebase (see http://truffleframework.com/docs).

`npm install -g ethereumjs-testrpc`

`npm install truffle@v4.0.0-beta.0 -g` to install truffle

In a separate tab on the command line run `testrpc`

Then `truffle deploy` to deploy the contracts

`truffle test` to run tests

Currently tests only pass if run separately (believe this is due to how taskID works)

`truffle test test/task_book.js`

`truffle test test/exchange.js`
