pragma solidity ^0.4.4;

import './AccountManager.sol';
import './TaskGiver.sol';

contract Solver is AccountManager {

	struct Task {
		address solver;
		address taskGiver;
		bytes32 taskData;
		uint taskID;
		uint minDeposit;
	}

	mapping(uint => Task) private tasks;
	mapping(uint => bytes32) private solverRandomBits;
	mapping(uint => mapping(address => uint)) private challengers;

	//one solver per task
	event SubmitSolution(address solver, address indexed taskGiver, uint id, bytes32 solution, uint minDeposit, bytes32 taskData);

	function sendBid(address origin, uint id, uint minDeposit, address addr, bytes32 random) {
		require(balances[addr] >= minDeposit);
		require(TaskGiver(origin).receiveBid(id, addr));
	}

	function submitSolution(address solver, uint taskID, bytes32 randomBits, bytes32 correctSolutionHash, bytes32 incorrectSolutionHash) returns (bool) {
		Task t = tasks[taskID];
		solverRandomBits[taskID] = randomBits;
		//add send correct or incorrect solution here
		uint randomNum = uint(sha3(randomBits, block.blockhash(block.number-1)));
		if (randomNum % 2 == 0) {
			SubmitSolution(solver, t.taskGiver, taskID, correctSolutionHash, t.minDeposit, t.taskData);
		}else{
			SubmitSolution(solver, t.taskGiver, taskID, incorrectSolutionHash, t.minDeposit, t.taskData);
		}
		return true;
	}

	function receiveChallenge(uint id, address from) returns (bool) {
		challengers[id][from] = 1;
		return true;
	}
}
