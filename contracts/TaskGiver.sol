pragma solidity ^0.4.4;

import './AccountManager.sol';
import './Solver.sol';

contract TaskGiver is AccountManager {
	uint numTasks = 0;
	event SendTask(address _from, uint id, uint minDeposit);
	event SolverSelection(uint indexed taskID, address _from);

	mapping(uint => Task) tasks;
	mapping(uint => mapping(uint => address[])) solutionSignatures;

	struct Task {
		address owner;
		mapping(address => uint) selectedSolvers;
		address[] solvers;
		uint minDeposit;
		uint[] solutions;
	}

	function sendTask(uint minDeposit, address _from) returns (bool) {
		require(balances[_from] >= minDeposit);
		Task t;
		t.owner = _from;
		t.minDeposit = minDeposit;
		tasks[numTasks] = t;
		SendTask(this, numTasks, minDeposit);
		numTasks++;
		return true;
	}

	function receiveBid(uint id, address addr) returns(bool) {
		Task t = tasks[id];
		require(!(t.owner == 0x0));
		t.solvers.push(addr);
		log0(bytes32(sha3(addr)));
		return true;
	}

	function selectSolver(uint id) returns (address) {
		//address randomSolver = tasks[id].solvers[randomNum % tasks[id.solvers].length];
		//Using a mapping allows for multiple solvers to be selected
		tasks[id].selectedSolvers[tasks[id].solvers[0]] = 1;
		SolverSelection(id, this);
	}

	function isSelectedSolver(uint id, address addr) returns (bool) {
		return 1 == tasks[id].selectedSolvers[addr];
	}

	function receiveSolutionHash(address from, uint taskID, bytes32 _solutionHash) returns (bool) {
		require(!(tasks[taskID].owner == 0x0));
		uint solutionHash = uint(_solutionHash);
		if(solutionSignatures[taskID][solutionHash].length == 0) {
			tasks[taskID].solutions.push(solutionHash);
			solutionSignatures[taskID][solutionHash].push(from);
		} else {
			solutionSignatures[taskID][solutionHash].push(from);
		}
		log0(sha3(from));
		return true;
	}

	//pay signers of winning solution hash
	function pay(uint taskID, uint solutionHash) private {

	}

	function punish(uint taskID, uint _solutionHash) private {
		uint solutionsLength = tasks[taskID].solutions.length;
		for(uint i = 0; i < solutionsLength; i++) {
			uint solutionHash = tasks[taskID].solutions[i];
			if(!(_solutionHash == solutionHash)) {
				uint signersLength = solutionSignatures[taskID][solutionHash].length;
				for(uint j = 0; j < signersLength; j++) {
					//take deposits from these signers
				}
			}
		}
	}

	function completeTask(uint taskID, address addr) returns (bool) {
		require(addr == tasks[taskID].owner);
		uint solutionsLength = tasks[taskID].solutions.length;

		//get solution hash with most signatures
		uint maxSolutionsHash = tasks[taskID].solutions[0];
		uint maxSignatures = solutionSignatures[taskID][maxSolutionsHash].length;
		for(uint i = 0; i < solutionsLength; i++) {
			uint solutionHash = tasks[taskID].solutions[i];
			uint numSignatures = solutionSignatures[taskID][solutionHash].length;
			if(numSignatures > maxSignatures) {
				maxSolutionsHash = solutionHash;
				maxSignatures = numSignatures;
			}
		}

		pay(taskID, maxSolutionsHash);
		punish(taskID, maxSolutionsHash);

		delete tasks[taskID];
		log0(sha3(addr));
	}
}