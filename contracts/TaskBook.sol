pragma solidity ^0.4.4;

import './AccountManager.sol';

contract TaskBook is AccountManager {

	uint private numTasks = 0;
	uint constant maxSolvers = 10;
	uint constant maxChallengers = 10;
	uint private forcedErrorThreshold = 42;

	event TaskCreated(uint taskID, uint minDeposit, uint blockNumber);
	event SolverSelected(uint indexed taskID, address solver, bytes32 taskData, uint minDeposit);
	event SolutionCommitted(uint taskID, uint minDeposit, bytes32 taskData, address solver);
	event TaskStateChange(uint taskID, uint state);
	event ChallengeCommitted(uint taskID, address challenger, uint challengerID);

	struct Task {
		address owner;
		address[] solvers;
		address selectedSolver;
		uint minDeposit;
		bytes32 taskData;
		uint numSolvers;
		bytes32[] challengers;
		uint numChallengers;
		uint state;
	}

	struct Solution {
		bytes32 solutionHash0;
		bytes32 solutionHash1;
		bool correct;
		bool committed;
	}

	mapping(uint => Task) private tasks;
	mapping(address => mapping(uint => bytes32)) private solverRandomBitsHash;
	mapping(address => mapping(uint => Solution)) private solutions;

	//Task Issuers create tasks to be solved
	function createTask(uint minDeposit, bytes32 taskData, uint numBlocks) returns (bool) {
		require(balances[msg.sender] >= minDeposit);
		tasks[numTasks] = Task(msg.sender, new address[](maxSolvers), 0x0, minDeposit, taskData, 0, new bytes32[](maxChallengers), 0, 0);
		log0(sha3(msg.sender));//possible bug if log is after event
		TaskCreated(numTasks, minDeposit, block.number+numBlocks);
		numTasks++;
		return true;
	}

	function changeTaskState(uint taskID, uint newState) returns (bool) {
		Task t = tasks[taskID];
		require(t.owner == msg.sender);
		t.state = newState;
		TaskStateChange(taskID, newState);
		return true;
	}

	//Solver registers for tasks
	function registerForTask(uint taskID, uint minDeposit, bytes32 randomBitsHash) returns(bool) {
		require(balances[msg.sender] >= minDeposit);
		Task t = tasks[taskID];
		require(!(t.owner == 0x0));
		require(t.state == 0);
		require(t.numSolvers < maxSolvers);
		solverRandomBitsHash[msg.sender][taskID] = randomBitsHash;
		//random = sha3(random, block.blockhash(block.number-1));
		t.solvers[t.numSolvers] = msg.sender;
		t.numSolvers++;
		log0(bytes32(sha3(msg.sender)));
		log0(randomBitsHash);
		return true;
	}

	//Task Issuer tells TrueBitExchange to select a solver
	function selectSolver(uint taskID) returns (bool) {
		Task t = tasks[taskID];
		require(msg.sender == t.owner);
		require(t.state == 0);
		address solver = t.solvers[0];
		t.selectedSolver = solver;
		t.state = 1;
		SolverSelected(taskID, solver, t.taskData, t.minDeposit);
		return true;
	}

	//Selected solver submits a solution to the exchange
	function commitSolution(uint taskID, bytes32 solutionHash0, bytes32 solutionHash1) returns (bool) {
		Task t = tasks[taskID];
		require(t.selectedSolver == msg.sender);
		require(t.state == 1);
		solutions[msg.sender][taskID] = Solution(solutionHash0, solutionHash1, true, true);
		SolutionCommitted(taskID, t.minDeposit, t.taskData, msg.sender);
		t.state = 2;
		return true;
	}

	//Verifier submits a challenge to the solution provided for a task
	function commitChallenge(uint taskID, uint minDeposit, address solver, bytes32 intentHash) returns (bool) {
		require(balances[msg.sender] >= minDeposit);
		require(solutions[solver][taskID].committed);
		Task t = tasks[taskID];
		require(t.state == 2);
		require(t.numChallengers < maxChallengers);
		t.challengers[t.numChallengers] = intentHash;
		t.numChallengers++;
		ChallengeCommitted(taskID, msg.sender, t.numChallengers-1);
		return true;
	}

	function revealIntent(uint taskID, uint challengerID, uint intent) returns (bool) {
		require(tasks[taskID].challengers[challengerID] == sha3(intent));
		require(tasks[taskID].state == 3);
		log0(tasks[taskID].challengers[challengerID]);
		return true;
	}

	function revealSolution(uint taskID, bool solution0, uint originalRandomBits) returns (bool) {
		require(solverRandomBitsHash[msg.sender][taskID] == sha3(originalRandomBits));
		require(tasks[taskID].state == 4);
		require(tasks[taskID].selectedSolver == msg.sender);
		solutions[msg.sender][taskID].correct = solution0;
		tasks[taskID].state = 5;
		log0(sha3(originalRandomBits));
		return true;
	}
}