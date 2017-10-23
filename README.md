# TaskBook

The main incentive layer contract is the TaskBook. It inherits from the AccountManager contract. Which handles simple operations like keeping track of a balance and submitting a deposit.  Users can submit deposits to these contracts which will effectively start an account on the TaskBook. Once a user has an account they have the ability to create, solve, or verify tasks. A creator of a task is known as a Task Giver. Solvers solve tasks, and Verifiers verify tasks. The data that each of these agents interact with is contained in a struct. The lifecycle of a task is implemented as a finite state machine.

# TaskGiver
This is a user that creates a new task. They exchange Ether for computing tasks like running some C code. Alice can send out a task to be solved with the `createTask` method. That method creates a Task, an ID for that Task, and stores the information in a mapping. A TaskCreated event is broadcasted over the network.

# Solver
Once a solver is chosen for a task, it solves the task by running the code in an offchain WASM interpreter. It then submits a hash of that solution to be verified. If challenged, the solver and the verifier play the verification game.

# Verifier
Verifiers can challenge a solution submitted and win jackpots.

## Task
```
	struct Task {
		address owner;
		address selectedSolver;
		uint minDeposit;
		bytes32 taskData;
		mapping(address => bytes32) challenges;
		uint state;
	}
```

A task is identified with an unisgned integer functioning as its ID. In the code, this is referred to as taskID.

`owner:` is the address of the task creator.

`selectedSolver`: address of the selectedSolver (first solver to register for task).

`minDeposit`: the minimum deposit required to participate in task actions.

`taskData`: the initial data for the task, or possibly an IPFS address.

`challenges`: is a map that relates addresses of verifiers to their intent hash.

`state`: is an integer representing the different states of the task.

## Finite State Machine

```javascript
var minDeposit = 5000;
var taskData = 0x0;
var numBlocks = 5;//For timeout
var task_giver = accounts[0];
var solver = accounts[1];
var verifier = accounts[2];
```

The states of the task will change after certain functions are called.

A task has been created with an ID and is stored on the TaskBook contract.
```javascript
task_book.createTask(minDeposit, taskData, numBlocks, {from: task_giver});
```

The Finite State Machine (FSM) is in State 0: Task Initialized. In this state a solver can register to solve a task. This state is open until a solver registers or a given timeout has ended.

```javascript
task_book.registerForTask(taskID, minDeposit, web3.utils.soliditySha3(12345), {from: solver});
```

Now the FSM is in State 1: Solver selected

A solver is selected based on who registers for task. This can also be thought of as whichever solver's call to this function gets put on the main chain first. Now that the solver has been selected, they have a given time period to solve a task and submit a correct and incorrect solution. If they do not perform this action within the given time period than they are penalized.

```javascript
task_book.commitSolution(taskID, web3.utils.soliditySha3(0x0), web3.utils.soliditySha3(0x12345), {from: solver});
```

Now that a solution is committed there is a time period for challenges to be accepted. This is called State 2: Challenge Queue. These challenges will come from verifiers. It is assumed at least one challenge will come from a solver. Once a given time period ends the task giver will call this function to change the state of the task. Only the task giver (owner of task) is allowed to call this function.

```javascript
task_book.commitChallenge(taskID, minDeposit, intentHash, {from: verifier});

task_book.changeTaskState(taskID, 3, {from: task_giver});
```

State 3: Reveal Intent - is the time period where the verifiers that have committed challenges reveal which solution they believe is correct. Solution0 or Solution1 by revealing either an even or odd number. Then after a given time period the task giver changes the state to 4.

```javascript
task_book.revealIntent(taskID, 2, {from: verifier});

task_book.changeTaskState(taskID, 4, {from: task_giver});
```

State 4: Reveal Solution is the state where the solver is allowed to reveal which solution hash is the correct solution hash. This is denoted by submitting a boolean value. true means solutionHash0 is correct, and thus solutionHash1 is incorrect. Submitting false has the opposite effect. This is important because it determines who eventually will participate in the verification game later. The solver also reveals the random number submitted previously which determines whether a forced error is in effect or not.

```javascript
task_book.revealSolution(taskID, true, 12345, {from: solver});
```

State 5: Verification game
After the solution is revealed the task giver can initiate the verification game.

```javascript
task_book.verifySolution(taskID, 12345, {from: task_giver});
```

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

`npm install` to install needed dependencies locally

In a separate tab on the command line run `testrpc`

Then `truffle deploy` to deploy the contracts

`truffle test` to run tests

Currently tests only pass if run separately (believe this is due to how taskID works)

`truffle test test/task_book.js`

`truffle test test/exchange.js`
