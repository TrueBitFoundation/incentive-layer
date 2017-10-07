pragma solidity ^0.4.4;

import './AccountManager.sol';
import './TaskGiver.sol';

contract Solver is AccountManager {

	mapping(address => bytes32) private solverRandomBits;

	//one solver per task
	mapping(uint => mapping(address => address)) challenges;

	event SendSolution(address solver, address taskGiver, uint id, bytes32 solution, uint minDeposit, bytes32 taskData);

	function sendBid(address origin, uint id, uint minDeposit, address addr, bytes32 random) {
		require(balances[addr] >= minDeposit);
		require(TaskGiver(origin).receiveBid(id, addr));
		solverRandomBits[addr] = random;
	}

	function solveTask(address solver, address taskGiver, bytes32 taskData, uint id, uint minDeposit) returns (bool) {
		bytes32 solution = 0x0;
		//add send correct or incorrect solution here
		//sha3(random, block.blockhash)
		SendSolution(solver, taskGiver, id, solution, minDeposit, taskData);
		return true;
	}

	function receiveChallenge(uint id, address from) returns (bool) {
		//tasks[id].challengers.push(from);
		return true;
	}

	function wasSelected(address from, address by, uint taskID) returns (bool) {
		return TaskGiver(by).isSelectedSolver(taskID, from);
	}
}
