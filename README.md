# Truebit Incentive Layer

<p align="center">
  <img src="./Incentive Layer.jpg"/>
</p>

This repo hosts the smart contract code related to the Truebit incentive layer. We have a contract called IncentiveLayer that inherits from the DepositsManager contract. Which handles operations like keeping track of a balance, submitting a deposit, bonding a deposit, slashing deposit, etc.  Users can submit deposits to these contracts which will effectively start an account on the IncentiveLayer. Once a user has an account they have the ability to create, solve, or verify tasks. A creator of a task is known as a Task Giver. Solvers solve tasks, and Verifiers verify tasks. The data that each of these agents interact with is contained in a struct. The lifecycle of a task is implemented as a finite state machine.

# Install
This is a truffle codebase (see http://truffleframework.com/docs).

`npm install truffle -g` to install truffle

`npm install` to install needed dependencies locally

In a separate tab on the command line run `ganache-cli`

Then `truffle migrate --reset` to deploy the contracts

`truffle test` to run tests

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
		uint reward;
		bytes32 taskData;
		mapping(address => bytes32) challenges;
		State state;
		bytes32 blockhash;
		bytes32 randomBitsHash;
		uint numBlocks;
		uint taskCreationBlockNumber;
    mapping(address => uint) bondedDeposits;
		uint randomBits;
		uint finalityCode; //0 => not finalized, 1 => finalized, 2 => forced error occurred
		uint jackpotID;
		uint initialReward;
	}
```

A task is identified with an unisgned integer functioning as its ID. In the code, this is referred to as taskID.

`owner:` is the address of the task giver.

`selectedSolver`: address of the selectedSolver (first solver to register for task).

`minDeposit`: the minimum deposit required to participate in task actions.

`reward`: amount of reward given for completing the task

`taskData`: the initial data for the task, or possibly an IPFS address.

`challenges`: is a map that relates addresses of verifiers to their intent hash.

`state`: is an enum representing the different states of the task.

`blockhash`: the hash of the previous block upon registering for a task.

`randomBitsHash`: the hash of the random bits upon registering for a task.

`numBlocks`: the number of blocks to adjust for task difficulty.

`taskCreationBlockNumber`: block number upon creating the task.

`bondedDeposits`: Addresses of people with bonded deposits and amount deposited.

`randomBits`: this is the original random bits that is eventually revealed.

`finalityCode`: this is an encoding to determine the final state of the task

`jackpotID`: the version of the jackpot associated with the task because jackpot versions can change over time.

`initialReward`: this value is stored to compare what amount should be received by a particular user.

## Posting a deposit

In order to participate in the Truebit protocol a client must first submit a deposit. This deposit can be used for multiple tasks as only the minDeposit for a task will be bonded.
`incentiveLayer.makeDeposit({from: taskGiver, value: 1000});`

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

A task has been created with an ID and is stored on the TBIncentiveLayer contract. This also has the side effect of bonding the taskGiver's deposit.
```javascript
incentiveLayer.createTask(minDeposit, reward, taskData, numBlocks, {from: task_giver});
```

The Finite State Machine (FSM) is in State 0: Task Initialized. In this state a solver can register to solve a task. This state is open until a solver registers or a given timeout has ended. Solver submits task ID and hash of random bits. This also has the side effect of bonding the solver's deposit.

```javascript
incentiveLayer.registerForTask(taskID, web3.utils.soliditySha3(12345), {from: solver});
```

Now the FSM is in State 1: SolverSelected

A solver is selected based on who registers for task. This can also be thought of as whichever solver's call to this function gets put on the main chain first. Now that the solver has been selected, they have a given time period to solve a task and submit a correct and incorrect solution. If they do not perform this action within the given time period than they are penalized.

```javascript
incentiveLayer.commitSolution(taskID, web3.utils.soliditySha3(0x0), web3.utils.soliditySha3(0x12345), {from: solver});
```

Once the solution is commiteed we enter State 2: SolutionCommitted. It is now possible to post challenges

Notice that two solution hashes are input. This is done because one of the hashes is for a forced error and another is for the real solution. At this point only the Solver is aware which solutionHash is 'correct'.

Now that a solution is committed there is a time period for challenges to be accepted. These challenges will come from verifiers. It is assumed at least one challenge will come from a solver. This also has the effect of bonding the verifier's deposit. Once a given time period ends the task giver will call this function to change the state of the task. Only the task giver (owner of task) is allowed to call this function.

```javascript
incentiveLayer.commitChallenge(taskID, minDeposit, intentHash, {from: verifier});

incentiveLayer.changeTaskState(taskID, 3, {from: task_giver});
```

State 3: ChallengesAccepted - is the time period where the verifiers that have committed challenges reveal which solution they believe is correct. Solution0 or Solution1 by revealing either 0 or 1, anything else is an intent to challenge both solutions. Then after a given time period the task giver changes the state to 4.

```javascript
incentiveLayer.revealIntent(taskID, 0, {from: verifier});

incentiveLayer.changeTaskState(taskID, 4, {from: task_giver});
```

State 4: IntentsRevealed is the state where the solver is allowed to reveal which solution hash is the correct solution hash. This is denoted by submitting a boolean value. true means solutionHash0 is correct, and thus solutionHash1 is incorrect. Submitting false has the opposite effect. This is important because it determines who eventually will participate in the verification game later. The solver also reveals the random number submitted previously which determines whether a forced error is in effect or not.

```javascript
incentiveLayer.revealSolution(taskID, true, 12345, {from: solver});
```

We are now in State 5: SolutionRevealed

After the solution is revealed the task giver can initiate the verification game and then verify the solution.

```javascript
incentiveLayer.verifySolution(taskID, 12345, {from: task_giver});
```

This will eventually include calls to the dispute resolution layer where the actual verification games will take place.

Once the verification games are over the task is finalized and we are in the final stage of the lifecycle of a task State 6: TaskFinalized.

If for any reason there was a timeout triggered in the intermediate states a task can end up in the TaskTimeout state.
