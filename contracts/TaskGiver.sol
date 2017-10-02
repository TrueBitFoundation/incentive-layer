pragma solidity ^0.4.4;

import './AgentManager.sol';
import './Solver.sol';

contract TaskGiver is AgentManager {
	uint numTasks = 0;
	event SendTask(address _from, uint id, uint minDeposit);

	mapping(uint => Task) tasks;

	struct Task {
		address owner;
		address[] solvers;
		uint minDeposit;
	}

	function sendTask(uint minDeposit) returns (bool) {
		require(balances[tx.origin] >= minDeposit);
		Task t;
		t.owner = tx.origin;
		t.minDeposit = minDeposit;
		tasks[numTasks] = t;
		SendTask(tx.origin, numTasks, minDeposit);
		numTasks++;
		return true;
	}

	function receiveBid(uint id) returns(bool) {
		Task t = tasks[id];
		t.solvers.push(tx.origin);
		return true;
	}

	function selectSolver(uint id) returns (address) {
		address solver = tasks[id].solvers[0];
		require(Solver(solver).solveTask(0x0, id, tasks[id].minDeposit));
		return solver;
	}
}
