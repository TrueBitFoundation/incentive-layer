pragma solidity ^0.4.4;

import './AccountManager.sol';
import './Solver.sol';
import './TaskGiver.sol';

contract Verifier is AccountManager {

	//many verifiers per task
	mapping(address => mapping(uint => bytes32)) solutions;

	function sendChallenge(address _from, address _to, uint id, uint minDeposit) returns (bool) {
		require(balances[_from] >= minDeposit);
		require(Solver(_to).receiveChallenge(id, _from));
		log0(sha3(_from));
		log0(sha3(_to));
		return true;
	}
	
}