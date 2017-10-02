pragma solidity ^0.4.4;

import './AgentManager.sol';
import './TaskGiver.sol';

contract Solver is AgentManager {

	event SendSolution(address _from, bytes32 solution);

	function sendBid(address origin, uint id, uint minDeposit) {
		require(balances[tx.origin] >= minDeposit);
		require(TaskGiver(origin).receiveBid(id));
	}

	function solveTask(bytes32 task) returns (bool) {
		SendSolution(msg.sender, 0x0);
		return true;
	}
}
