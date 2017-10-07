pragma solidity ^0.4.4;

import './AccountManager.sol';
import './Solver.sol';

contract TaskGiver is AccountManager {

	bytes32 private random = "123456789";
	uint private numTasks = 0;
	event SendTask(address _from, uint id, uint minDeposit);
	event SolveTask(address indexed solver, bytes32 taskData, uint minDeposit);
	uint maxSolvers = 10;

	mapping(uint => Task) tasks;

	struct Task {
		address owner;
		address[] solvers;
		address selectedSolver;
		uint minDeposit;
		bytes32 taskData;
		uint numSolvers;
	}

	function sendTask(address addr, uint minDeposit, bytes32 taskData) returns (bool) {
		require(balances[addr] >= minDeposit);
		tasks[numTasks] = Task(addr, new address[](maxSolvers), 0x0, minDeposit, taskData, 0);
		SendTask(this, numTasks, minDeposit);
		numTasks++;
		return true;
	}

	function receiveBid(uint id, address addr) returns(bool) {
		Task t = tasks[id];
		require(!(t.owner == 0x0));
		random = sha3(random, block.blockhash(block.number-1));
		t.solvers[t.numSolvers] = addr;
		t.numSolvers++;
		log0(bytes32(sha3(addr)));
		return true;
	}

	function selectSolver(uint taskID) returns (address) {
		Task t = tasks[taskID];
		address randomSolver = t.solvers[uint(random) % t.numSolvers];
		t.selectedSolver = randomSolver;
		SolveTask(randomSolver, t.taskData, t.minDeposit);
	}
}