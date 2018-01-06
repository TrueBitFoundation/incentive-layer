pragma solidity ^0.4.4;

import './DepositsManager.sol';

contract TBIncentiveLayer is DepositsManager {

	uint private numTasks = 0;
	uint private forcedErrorThreshold = 42;

 	event DepositBonded(uint taskID, address account, uint amount);
 	event DepositUnbonded(uint taskID, address account, uint amount);
 	event BondedDepositMovedToJackpot(uint taskID, address account, uint amount);
	event TaskCreated(uint taskID, uint minDeposit, uint blockNumber, uint reward);
	event SolverSelected(uint indexed taskID, address solver, bytes32 taskData, uint minDeposit, bytes32 randomBitsHash);
	event SolutionsCommitted(uint taskID, uint minDeposit, bytes32 taskData, address solver);
	event SolutionRevealed(uint taskID, uint randomBits);
	event TaskStateChange(uint taskID, uint state);

	enum State { TaskInitialized, SolverSelected, SolutionComitted, ChallengesAccepted, IntentsRevealed, SolutionRevealed, VerificationGame, TaskSolved }

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
	}

	struct Solution {
		bytes32 solutionHash0;
		bytes32 solutionHash1;
		bool solution0Correct;
		address[] solution0Challengers;
		address[] solution1Challengers;
	}

	mapping(uint => Task) private tasks;
	mapping(uint => Solution) private solutions;

	uint8[8] private timeoutWeights = [1, 2, 3, 4, 5, 6, 7, 8];

	// @dev - private method to check if the denoted amount of blocks have been mined (time has passed).
	// @param taskID - the task id.
	// @param numBlocks - the difficulty weight for the task
	// @return - boolean
	function stateChangeTimeoutReached(uint taskID, uint numBlocks) private returns (bool) {
		Task t = tasks[taskID];
		return (numBlocks.mul(block.number.sub(t.taskCreationBlockNumber)) >= timeoutWeights[uint(t.state)]);
	}

	// @dev – locks up part of the a user's deposit into a task.
	// @param taskID – the task id.
	// @param account – the user's address.
	// @param amount – the amount of deposit to lock up. 
	// @return – the user's deposit bonded for the task.
	function bondDeposit(uint taskID, address account, uint amount) private returns (uint) { 
	  Task storage task = tasks[taskID];
	  require(deposits[msg.sender] >= amount);
	  deposits[account] = deposits[account].sub(amount);
	  task.bondedDeposits[account] = task.bondedDeposits[account].add(amount);
	  DepositBonded(taskID, account, amount);
	  return task.bondedDeposits[account];
	}

	// @dev – unlocks a user's bonded deposits from a task.
	// @param taskID – the task id.
	// @param account – the user's address.
	// @return – the user's deposit which was unbonded from the task.
	function unbondDeposit(uint taskID) public returns (uint) {
	  Task storage task = tasks[taskID];
	  require(task.state == State.TaskSolved);
	  uint bondedDeposit = task.bondedDeposits[msg.sender];
	  delete task.bondedDeposits[msg.sender];
	  deposits[msg.sender] = deposits[msg.sender].add(bondedDeposit);
	  DepositUnbonded(taskID, msg.sender, bondedDeposit);
	  
	  return bondedDeposit;
	}

	// @dev – punishes a user by moving their bonded deposits for a task into the jackpot.
	// @param taskID – the task id.
	// @param account – the user's address.
	// @return – the updated jackpot amount.
	function moveBondedDepositToJackpot(uint taskID, address account) private returns (uint) { 
	  Task storage task = tasks[taskID];
	  uint bondedDeposit = task.bondedDeposits[account];
	  delete task.bondedDeposits[account];
	  jackpot = jackpot.add(bondedDeposit);
	  BondedDepositMovedToJackpot(taskID, account, bondedDeposit);
	  
	  return bondedDeposit;
	}

	// @dev – returns the user's bonded deposits for a task.
	// @param taskID – the task id.
	// @param account – the user's address.
	// @return – the user's bonded deposits for a task.
	function getBondedDeposit(uint taskID, address account) constant public returns (uint) {
	  return tasks[taskID].bondedDeposits[account];
	}

	// @dev – taskGiver creates tasks to be solved.
  	// @param minDeposit – the minimum deposit required for engaging with a task as a solver or verifier.
  	// @param reward - the payout given to solver
  	// @param taskData – tbd. could be hash of the wasm file on a filesystem.
  	// @param numBlocks – the number of blocks to adjust for task difficulty
  	// @return – boolean
	function createTask(uint minDeposit, uint reward, bytes32 taskData, uint numBlocks) public returns (bool) {
		require(deposits[msg.sender] >= minDeposit);
		Task storage t = tasks[numTasks];
		t.owner = msg.sender;
		t.minDeposit = minDeposit;
		t.reward = reward;
		t.taskData = taskData;
		t.taskCreationBlockNumber = block.number;
		t.numBlocks = numBlocks;
		bondDeposit(numTasks, msg.sender, minDeposit);
		log0(keccak256(msg.sender));//possible bug if log is after event
		TaskCreated(numTasks, minDeposit, numBlocks, reward);
		numTasks.add(1);
		return true;
	}

  	// @dev – changes a tasks state.
  	// @param taskID – the task id.
  	// @param newSate – the new state.
  	// @return – boolean
	function changeTaskState(uint taskID, uint newState) public returns (bool) {
		Task storage t = tasks[taskID];
		require(t.owner == msg.sender);
		require(stateChangeTimeoutReached(taskID, 1));
		t.state = State(newState);
		TaskStateChange(taskID, newState);
		return true;
	}

	// @dev – solver registers for tasks, if first to register than automatically selected solver
	//  0 -> 1
  	// @param taskID – the task id.
  	// @param randomBitsHash – hash of random bits to commit to task
  	// @return – boolean
	function registerForTask(uint taskID, bytes32 randomBitsHash) public returns(bool) {
		Task storage t = tasks[taskID];
		
		require(!(t.owner == 0x0));
		require(t.state == State.TaskInitialized);
		require(t.selectedSolver == 0x0);
    
    	bondDeposit(taskID, msg.sender, t.minDeposit);
		t.selectedSolver = msg.sender;
		t.randomBitsHash = randomBitsHash;
		t.blockhash = block.blockhash(block.number.add(1));
		t.state = State.SolverSelected;

		SolverSelected(taskID, msg.sender, t.taskData, t.minDeposit, t.randomBitsHash);	
    	return true;
	}

	// @dev – selected solver submits a solution to the exchange
	// 1->2
  	// @param taskID – the task id.
 	// @param solutionHash0 – the hash of the solution (could be true or false solution)
  	// @param solutionHash1 – the hash of the solution (could be true or false solution)
  	// @return – boolean
	function commitSolution(uint taskID, bytes32 solutionHash0, bytes32 solutionHash1) public returns (bool) {
		Task storage t = tasks[taskID];
		require(t.selectedSolver == msg.sender);
		require(t.state == State.SolverSelected);
		Solution storage s = solutions[taskID];
		s.solutionHash0 = solutionHash0;
		s.solutionHash1 = solutionHash1;
		solutions[taskID] = s;
		t.state = State.SolutionComitted;
		SolutionsCommitted(taskID, t.minDeposit, t.taskData, msg.sender);
		return true;
	}

	// @dev – verifier submits a challenge to the solution provided for a task
	// verifiers can call this until task giver changes state or timeout
  	// @param taskID – the task id.
  	// @param intentHash – submit hash of even or odd number to designate which solution is correct/incorrect.
  	// @return – boolean
	function commitChallenge(uint taskID, bytes32 intentHash) public returns (bool) {
		Task storage t = tasks[taskID];
		require(t.state == State.SolutionComitted);

		bondDeposit(taskID, msg.sender, t.minDeposit);
		t.challenges[msg.sender] = intentHash;
		return true;
	}

	// @dev – verifiers can call this until task giver changes state or timeout
  	// @param taskID – the task id.
  	// @param intent – submit 0 to challenge solution0, 1 to challenge solution1, anything else challenges both
  	// @return – boolean
	function revealIntent(uint taskID, uint intent) public returns (bool) {
		require(tasks[taskID].challenges[msg.sender] == keccak256(intent));
		require(tasks[taskID].state == State.ChallengesAccepted);
		if(intent == 0) {//Intent determines which solution the verifier is betting is deemed incorrect
			solutions[taskID].solution0Challengers.push(msg.sender);
		}else if(intent == 1) {
			solutions[taskID].solution1Challengers.push(msg.sender);
		}else{
			solutions[taskID].solution0Challengers.push(msg.sender);
			solutions[taskID].solution1Challengers.push(msg.sender);
		}
		delete tasks[taskID].challenges[msg.sender];
		return true;
	}

	// @dev – solver reveals which solution they say is the correct one
  	// 4->5
  	// @param taskID – the task id.
  	// @param solution0Correct – determines if solution0Hash is the correct solution
  	// @param originalRandomBits – original random bits for sake of commitment.
  	// @return – boolean
	function revealSolution(uint taskID, bool solution0Correct, uint originalRandomBits) public returns (bool) {
		require(tasks[taskID].randomBitsHash == keccak256(originalRandomBits));
		require(tasks[taskID].state == State.IntentsRevealed);
		require(tasks[taskID].selectedSolver == msg.sender);
		solutions[taskID].solution0Correct = solution0Correct;
		tasks[taskID].state = State.SolutionRevealed;
		SolutionRevealed(taskID, originalRandomBits);
		return true;
	}

	// @dev – 5->6
	// this assumes that the verification game will state who gets paid
  	// @param taskID – the task id.
  	// @param randomBits – original random bits submitted by solver
  	// @return – boolean
	function verifySolution(uint taskID, uint randomBits) public returns (bool) {
		require(tasks[taskID].state == State.SolutionRevealed);
		require(tasks[taskID].owner == msg.sender);
		require(keccak256(randomBits) == tasks[taskID].randomBitsHash);
		tasks[taskID].state = State.VerificationGame;
		if(uint(keccak256(randomBits, tasks[taskID].blockhash)) < forcedErrorThreshold) {//Forced error
			//jackpot
		}
		runVerificationGames(taskID);
		return true;
	}

  	// @dev – initiate verification games for solver and verifiers
  	// @param taskID - the task id.
	function runVerificationGames(uint taskID) public {
		require(tasks[taskID].state == State.VerificationGame);
		// Task storage t = tasks[taskID];
		Solution storage s = solutions[taskID];
		if(s.solution0Correct) {
			for(uint i = 0; i < solutions[taskID].solution0Challengers.length; i++) {
				// verificationGame(t.selectedSolver, solutions[taskID].solution0Challengers[i], t.taskData, s.solutionHash0);
        break;
			}
		} else {
			for(uint j = 0; j < solutions[taskID].solution1Challengers.length; j++) {
				// verificationGame(t.selectedSolver, solutions[taskID].solution1Challengers[j], t.taskData, s.solutionHash1);
        break;
			}
		}
	}

	// function verificationGame(address solver, address challenger, bytes32 taskData, bytes32 solutionHash);
}
