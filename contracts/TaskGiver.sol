pragma solidity ^0.4.4;

import './AgentManager.sol';

contract TaskGiver is AgentManager {
	uint numTasks = 0;
	event SendTask(address _from, uint minDeposit);

	function sendTask(uint minDeposit) returns (bool) {
		require(balances[tx.origin] >= minDeposit);
		SendTask(tx.origin, minDeposit);
		return true;
	}
}
