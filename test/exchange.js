var TaskGiver = artifacts.require("./TaskGiver.sol");
var Solver = artifacts.require("./Solver.sol");
var Verifier = artifacts.require("./Verifier.sol");

contract('TrueBit Exchange', function(accounts) {
  it("should simulate the exchange of ether for computation and verification", function() {
  	var taskGiver, solver, verifier;
  	return TaskGiver.deployed().then(function(_taskGiver) {
  		taskGiver = _taskGiver;
  		return Solver.deployed();
  	}).then(function(_solver) {
  		solver = _solver;
  		return Verifier.deployed();
  	}).then(function(_verifier) {
  		verifier = _verifier;
  		return initializeAccounts([taskGiver, solver, verifier], accounts);
  	}).then(function() {

  		//setup event handlers
  		var sendTask = taskGiver.SendTask();
  		sendTask.watch(function(error, result) {
  			console.log(result);
  		});

  		var submitSolution = solver.SendSolution();
  		submitSolution.watch(function(error, result) {
  			console.log(result);
  		});

  		return new Promise(function(resolve) {
  			setTimeout(resolve, 2000);
  		});
  	}).then(function() {
  		return taskGiver.sendTask(6000, {from: accounts[5]});
  	});
  });
});

function initializeAccounts(accountManagers, accounts) {
	return new Promise(function(resolve) {
		for(i = 0; i < accountManagers.length; i++) {
			for(j = 5; j < 9; j++) {
				accountManagers[i].submitDeposit({value: 10000, from: accounts[j]});
			}
		}
		resolve();
	})
}
