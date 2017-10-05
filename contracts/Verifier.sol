pragma solidity ^0.4.4;

import './AccountManager.sol';
import './Solver.sol';
import './TaskGiver.sol';

contract Verifier is AccountManager {

	mapping(address => mapping(uint => bytes32)) solutions;

	function sendChallenge(address _from, address _to, uint id, bytes32 solution, uint minDeposit) returns (bool) {
		require(balances[_from] >= minDeposit);
		//require(Solver(_to).receiveChallenge(id, _from));
		log0(sha3(_from));
		log0(sha3(_to));
		return true;
	}

	function sendSolutionHash(address _from, address _to, uint minDeposit, uint taskID, bytes32 solutionHash) returns (bool) {
		require(balances[_from] >= minDeposit);
		require(TaskGiver(_to).receiveSolutionHash(_from, taskID, solutionHash));
		log0(sha3(_from));
		log0(sha3(_to));		
		return true;
	}

}