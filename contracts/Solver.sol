pragma solidity ^0.4.4;

import './AccountManager.sol';
import './TaskGiver.sol';

contract Solver is AccountManager {

	mapping(uint => bytes32) private solverRandomBits;
	mapping(uint => mapping(address => uint)) private challengers;

	//one solver per task
	event SubmitSolution(address solver, address indexed taskGiver, uint id, bytes32 solution, uint minDeposit, bytes32 taskData);

	function sendBid(address origin, uint id, uint minDeposit, address addr) {
		require(balances[addr] >= minDeposit);
		require(TaskGiver(origin).receiveBid(id, addr));
	}

	function submitSolution(address taskGiver, address solver, uint taskID, bytes32 randomBits, bytes32 correctSolutionHash, bytes32 incorrectSolutionHash) returns (bool) {
		uint minDeposit;
		bytes32 taskData;
		(minDeposit, taskData) = TaskGiver(taskGiver).getTask(0, solver);
		solverRandomBits[taskID] = sha3(randomBits);//save for later use
		uint randomNum = uint(sha3(randomBits, block.blockhash(block.number-1)));
		if (randomNum % 2 == 0) {
			SubmitSolution(this, taskGiver, taskID, correctSolutionHash, minDeposit, taskData);
		}else{
			SubmitSolution(this, taskGiver, taskID, incorrectSolutionHash, minDeposit, taskData);
		}
		return true;
	}

	function receiveChallenge(uint id, address from) returns (bool) {
		require(!(solverRandomBits[id] == 0x0));
		challengers[id][from] = 1;
		//initiate verification game here
		return true;
	}
}
