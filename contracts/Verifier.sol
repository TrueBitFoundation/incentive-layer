pragma solidity ^0.4.4;

import './AccountManager.sol';
import './Solver.sol';
import './TaskGiver.sol';

contract Verifier is AccountManager {

	mapping(address => mapping(uint => bytes32)) solutions;

	function sendChallenge(address solver, uint id, bytes32 solution, uint minDeposit) returns (bool) {
		require(balances[tx.origin] >= minDeposit);
		require(Solver(solver).receiveChallenge(id));
		return true;
	}

	function sendSolutionHash(address _to, uint minDeposit, uint taskID, bytes32 solutionHash) returns (bool) {
		require(balances[tx.origin] >= minDeposit);
		require(TaskGiver(_to).receiveSolutionHash(tx.origin, taskID, solutionHash));
		return true;
	}

}