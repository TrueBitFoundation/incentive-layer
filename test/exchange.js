var TaskGiver = artifacts.require("./TaskGiver.sol");
var Solver = artifacts.require("./Solver.sol");
var Verifier = artifacts.require("./Verifier.sol");

contract('TrueBit Exchange', function(accounts) {
  it("should simulate the exchange of ether for computation and verification", function() {
  	var taskGiver, solver, verifier, sendTask, sendSolution;
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
  		return new Promise(function(resolve) {

	  		//setup event handlers
	  		sendTask = taskGiver.SendTask();
	  		sendTask.watch(function(error, result) {
	  			if(!error) {
		  			var from = result.args._from;
		  			var taskID = result.args.id.toNumber();
		  			var minDeposit = result.args.minDeposit.toNumber();
		  			if(minDeposit >= 6000) {
		  				console.log(from);
		  				console.log(taskID);
		  				console.log(minDeposit);
		  				//solver.sendBid(from, taskID, minDeposit, {from: accounts[6]})
		  			}
	  			}else{
	  				console.error(error);
	  			}
	  		});

	  		submitSolution = solver.SendSolution();
	  		submitSolution.watch(function(error, result) {
	  			if(!error) {
	  				var from = result.args._from;
	  				var taskID = result.args.id.toNumber();
	  				var solution = result.args.solution;
	  				var minDeposit = result.args.minDeposit.toNumber();
					console.log(from);
					console.log(taskID);
					console.log(solution);
					console.log(minDeposit);
	  			}
	  		});

	  		resolve();
  		});
  	}).then(function() {
  		return taskGiver.sendTask(6000, {from: accounts[5]});
  	}).then(function(tx) {

  	});
  });
});

function initializeAccounts(accountManagers, accounts) {
	return new Promise(function(resolve) {
		for(i = 0; i < accountManagers.length; i++) {
			for(j = 5; j < 8; j++) {
				accountManagers[i].submitDeposit({value: 100000, from: accounts[j]});
			}
		}
		resolve();
	})
}
