pragma solidity ^0.4.4;

import './AccountManager.sol';
import './Solver.sol';

contract Verifier is AccountManager {

	function sendChallenge(address solver, uint id, bytes32 solution, uint minDeposit) returns (bool) {
		require(balances[tx.origin] >= minDeposit);
		require(Solver(solver).receiveChallenge(id));
		return true;
	}

}