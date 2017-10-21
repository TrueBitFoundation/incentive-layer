pragma solidity ^0.4.4;

import './AccountManager.sol';

contract TaskBook is AccountManager {

	uint private numTasks = 0;
	uint private forcedErrorThreshold = 42;

	event TaskCreated(uint taskID, uint minDeposit, uint blockNumber);
	event SolverSelected(uint indexed taskID, address solver, bytes32 taskData, uint minDeposit);
	event SolutionsCommitted(uint taskID, uint minDeposit, bytes32 taskData, address solver);
	event SolutionRevealed(uint taskID, uint randomBits);
	event TaskStateChange(uint taskID, uint state);

	struct Challenge {
		address challenger;
		bytes32 intentHash;
	}

	struct Task {
		address owner;
		address selectedSolver;
		uint minDeposit;
		bytes32 taskData;
		uint numSolvers;
		mapping(address => bytes32) challenges;
		uint state;
	}

	struct Solution {
		bytes32 solutionHash0;
		bytes32 solutionHash1;
		bool solution0Correct;
		address[] solution0Challengers;
		address[] solution1Challengers;
	}

	mapping(uint => Task) private tasks;
	mapping(address => mapping(uint => bytes32)) private solverRandomBitsHash;
	mapping(uint => Solution) private solutions;

	//Task Issuers create tasks to be solved
	function createTask(uint minDeposit, bytes32 taskData, uint numBlocks) returns (bool) {
		require(balances[msg.sender] >= minDeposit);
		Task storage t;
		t.owner = msg.sender;
		t.minDeposit = minDeposit;
		t.taskData = taskData;
		tasks[numTasks] = t;
		log0(sha3(msg.sender));//possible bug if log is after event
		TaskCreated(numTasks, minDeposit, block.number+numBlocks);
		numTasks++;
		return true;
	}

	function changeTaskState(uint taskID, uint newState) returns (bool) {
		Task storage t = tasks[taskID];
		require(t.owner == msg.sender);
		t.state = newState;
		TaskStateChange(taskID, newState);
		return true;
	}

	//Solver registers for tasks, if first to register than automatically selected solver
	//0->1
	function registerForTask(uint taskID, uint minDeposit, bytes32 randomBitsHash) returns(bool) {
		require(balances[msg.sender] >= minDeposit);
		Task storage t = tasks[taskID];
		require(!(t.owner == 0x0));
		require(t.state == 0);
		require(t.selectedSolver == 0x0);
		t.selectedSolver = msg.sender;
		solverRandomBitsHash[msg.sender][taskID] = randomBitsHash;
		t.state = 1;
		log0(randomBitsHash);
		SolverSelected(taskID, msg.sender, t.taskData, t.minDeposit);
		return true;
	}

	//Selected solver submits a solution to the exchange
	//1->2
	function commitSolution(uint taskID, bytes32 solutionHash0, bytes32 solutionHash1) returns (bool) {
		Task storage t = tasks[taskID];
		require(t.selectedSolver == msg.sender);
		require(t.state == 1);
		Solution storage s;
		s.solutionHash0 = solutionHash0;
		s.solutionHash1 = solutionHash1;
		solutions[taskID] = s;
		t.state = 2;
		SolutionsCommitted(taskID, t.minDeposit, t.taskData, msg.sender);
		return true;
	}

	//Verifier submits a challenge to the solution provided for a task
	//Verifiers can call this until task giver changes state or timeout
	function commitChallenge(uint taskID, uint minDeposit, bytes32 intentHash) returns (bool) {
		require(balances[msg.sender] >= minDeposit);
		Task storage t = tasks[taskID];
		require(t.state == 2);
		t.challenges[msg.sender] = intentHash;
		return true;
	}

	//Verifiers can call this until task giver changes state or timeout
	function revealIntent(uint taskID, uint intent) returns (bool) {
		require(tasks[taskID].challenges[msg.sender] == sha3(intent));
		require(tasks[taskID].state == 3);
		if(intent % 2 == 0) {//Intent determines which solution the verifier is betting is deemed incorrect
			solutions[taskID].solution0Challengers.push(msg.sender);
		}else{
			solutions[taskID].solution1Challengers.push(msg.sender);
		}
		delete tasks[taskID].challenges[msg.sender];
		return true;
	}

	//4->5
	function revealSolution(uint taskID, bool solution0Correct, uint originalRandomBits) returns (bool) {
		require(solverRandomBitsHash[msg.sender][taskID] == sha3(originalRandomBits));
		require(tasks[taskID].state == 4);
		require(tasks[taskID].selectedSolver == msg.sender);
		solutions[taskID].solution0Correct = solution0Correct;
		tasks[taskID].state = 5;
		SolutionRevealed(taskID, originalRandomBits);
		return true;
	}

	//5->6
	//This assumes that the verification game will state who gets paid
	function verifySolution(uint taskID, uint randomBits) returns (bool) {
		require(tasks[taskID].state == 5);
		require(tasks[taskID].owner == msg.sender);
		tasks[taskID].state = 6;
		if(uint(sha3(randomBits, block.blockhash(block.number))) < forcedErrorThreshold) {//Forced error
			runVerificationGames(taskID, solutions[taskID].solution0Correct);
			//jackpot
		}else{//No forced error
			runVerificationGames(taskID, solutions[taskID].solution0Correct);
			//solver is punished or rewarded
		}
		return true;
	}

	function runVerificationGames(uint taskID, bool solution0Correct) {
		require(tasks[taskID].state == 6);
		Task storage t = tasks[taskID];
		if(solution0Correct) {
			for(uint i = 0; i < solutions[taskID].solution0Challengers.length; i++) {
				verificationGame(t.selectedSolver, solutions[taskID].solution0Challengers[i], t.taskData);
			}
		} else {
			for(uint j = 0; j < solutions[taskID].solution1Challengers.length; j++) {
				verificationGame(t.selectedSolver, solutions[taskID].solution0Challengers[j], t.taskData);
			}			
		}
	}

	function verificationGame(address solver, address challenger, bytes32 taskData) {

	}
}