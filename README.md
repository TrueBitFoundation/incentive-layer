# WIP
Incentive layer contracts and deployment information.

# API
Requester.sol will show the api a contract must have in order to create a task on truebit.

The basic idea is that the contract must have a way to call `truebit.createTask()`(with payment). This submits a task and returns its id. Once the task is complete it will call `proccessTask` on the contract that created it (which it must have).

ExampleRequester.sol is an example of how such a contract might want to use Truebit. It is able to handle the solution from Truebit and updates a variable.

# Truffle
This is a truffle codebase (see http://truffleframework.com/docs).

`npm install -g ethereumjs-testrpc`

`npm install -g truffle` to install

`truffle migrate` to run migrations

`truffle compile` to compile contracts

`truffle test` to run tests