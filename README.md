# Contracts

The main incentive layer contracts are TaskGiver and Solver. Each of these contracts inherit from the AccountManager contract. Which handles simple operations like keeping track of a balance and submitting a deposit. The other contracts hold the methods and data specific to their functionality. Users can submit deposits to these contracts which will effectively start an account on that contract. For example, if Alice submits a deposit of X ether to the TaskGiver contract, she is considered to be a TaskGiver and can use the methods on the TaskGiver contract.

# TaskGiver
This contract holds all of the accounts of TaskGivers. TaskGivers are the "clients" of the TrueBit protocol. They exchange Ether for computing tasks like running some C code. Alice can send out a task to be solved with the `sendTask` method. That method creates a Task, an ID for that Task, and stores the information in a Task map. An event is broadcasted. That event is picked up by Solvers watching for tasks to bid on. Once Alice receives the bids the TaskGiver contract randomly chooses a solver and issues it with the task.

# Solver
Once a solver is chosen for a task it solves the task. By running the code in an offchain WASM interpreter. It then submits a hash of that solution to be verified. If challenged, it will then play the verification game.

# Verifier
Verifiers are solvers that can challenge a solution submitted and win jackpots.

# API
Requester.sol will show the api a contract must have in order to create a task on truebit.

The basic idea is that the contract must have a way to call `truebit.createTask()`(with payment). This submits a task and returns its id. Once the task is complete it will call `proccessTask` on the contract that created it (which it must have).

ExampleRequester.sol is an example of how such a contract might want to use TrueBit. It is able to handle the solution from TrueBit and updates a variable.

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
