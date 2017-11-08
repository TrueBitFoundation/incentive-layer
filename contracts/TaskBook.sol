pragma solidity ^0.4.4;

import './DepositsManager.sol';

contract TaskBook is DepositsManager {

	uint private numTasks = 0;
	uint private forcedErrorThreshold = 42;

	event TaskCreated(uint taskID, uint minDeposit, uint blockNumber);
	event SolverSelected(uint indexed taskID, address solver, bytes32 taskData, uint minDeposit);
	event SolutionsCommitted(uint taskID, uint minDeposit, bytes32 taskData, address solver);
	event SolutionRevealed(uint taskID, uint randomBits);
	event TaskStateChange(uint taskID, uint state);

	enum State { TaskInitialized, SolverSelected, SolutionComitted, ChallengesAccepted, IntentsRevealed, SolutionRevealed, VerificationGame}

	struct Task {
		address owner;
		address selectedSolver;
		uint minDeposit;
		bytes32 taskData;
		mapping(address => bytes32) challenges;
		State state;
		bytes32 blockhash;
		bytes32 randomBitsHash;
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

	//Task Issuers create tasks to be solved
	function createTask(uint minDeposit, bytes32 taskData, uint numBlocks) returns (bool) {
		require(deposits[msg.sender] >= minDeposit);
		Task storage t = tasks[numTasks];
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
		t.state = State(newState);
		TaskStateChange(taskID, newState);
		return true;
	}

	//Solver registers for tasks, if first to register than automatically selected solver
	//0->1
	function registerForTask(uint taskID, bytes32 randomBitsHash) returns(bool) {
		Task storage t = tasks[taskID];
		require(deposits[msg.sender] >= t.minDeposit);
		require(!(t.owner == 0x0));
		require(t.state == State.TaskInitialized);
		require(t.selectedSolver == 0x0);
		t.selectedSolver = msg.sender;
		t.randomBitsHash = randomBitsHash;
		t.blockhash = block.blockhash(block.number-1);
		t.state = State.SolverSelected;
		log0(randomBitsHash);
		SolverSelected(taskID, msg.sender, t.taskData, t.minDeposit);
		return true;
	}

	//Selected solver submits a solution to the exchange
	//1->2
	function commitSolution(uint taskID, bytes32 solutionHash0, bytes32 solutionHash1) returns (bool) {
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

	//Verifier submits a challenge to the solution provided for a task
	//Verifiers can call this until task giver changes state or timeout
	function commitChallenge(uint taskID, bytes32 intentHash) returns (bool) {
		Task storage t = tasks[taskID];
		require(deposits[msg.sender] >= t.minDeposit);
		require(t.state == State.SolutionComitted);
		t.challenges[msg.sender] = intentHash;
		return true;
	}

	//Verifiers can call this until task giver changes state or timeout
	function revealIntent(uint taskID, uint intent) returns (bool) {
		require(tasks[taskID].challenges[msg.sender] == sha3(intent));
		require(tasks[taskID].state == State.ChallengesAccepted);
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
		require(tasks[taskID].randomBitsHash == sha3(originalRandomBits));
		require(tasks[taskID].state == State.IntentsRevealed);
		require(tasks[taskID].selectedSolver == msg.sender);
		solutions[taskID].solution0Correct = solution0Correct;
		tasks[taskID].state = State.SolutionRevealed;
		SolutionRevealed(taskID, originalRandomBits);
		return true;
	}

	//5->6
	//This assumes that the verification game will state who gets paid
	function verifySolution(uint taskID, uint randomBits) returns (bool) {
		require(tasks[taskID].state == State.SolutionRevealed);
		require(tasks[taskID].owner == msg.sender);
		require(sha3(randomBits) == tasks[taskID].randomBitsHash);
		tasks[taskID].state = State.VerificationGame;
		if(uint(sha3(randomBits, tasks[taskID].blockhash)) < forcedErrorThreshold) {//Forced error
			//jackpot
		}
		runVerificationGames(taskID);
		return true;
	}

	function runVerificationGames(uint taskID) {
		require(tasks[taskID].state == State.VerificationGame);
		Task storage t = tasks[taskID];
		Solution storage s = solutions[taskID];
		if(s.solution0Correct) {
			for(uint i = 0; i < solutions[taskID].solution0Challengers.length; i++) {
				verificationGame(t.selectedSolver, solutions[taskID].solution0Challengers[i], t.taskData, s.solutionHash0);
			}
		} else {
			for(uint j = 0; j < solutions[taskID].solution1Challengers.length; j++) {
				verificationGame(t.selectedSolver, solutions[taskID].solution1Challengers[j], t.taskData, s.solutionHash1);
			}
		}
	}

	function verificationGame(address solver, address challenger, bytes32 taskData, bytes32 solutionHash) {

	}
}
