pragma solidity ^0.4.4;

import './AccountManager.sol';
import './TaskGiver.sol';

contract Solver is AccountManager {

	struct Task {
		address owner;
		address[] challengers;
	}

	mapping(uint => Task) tasks;

	event SendSolution(address _from, uint id, bytes32 solution, uint minDeposit);

	function sendBid(address origin, uint id, uint minDeposit) {
		require(balances[tx.origin] >= minDeposit);
		require(TaskGiver(origin).receiveBid(id));
	}

	function solveTask(bytes32 task, uint id, uint minDeposit) returns (bool) {
		Task t;
		t.owner = tx.origin;
		tasks[id] = t;
		SendSolution(msg.sender, id, 0x0, minDeposit);
		return true;
	}

	function receiveChallenge(uint id) returns (bool) {
		tasks[id].challengers.push(tx.origin);
		return true;
	}
}
