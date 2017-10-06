var TaskGiver = artifacts.require("./TaskGiver.sol");
var Solver = artifacts.require("./Solver.sol");
var Verifier = artifacts.require("./Verifier.sol");

contract('TrueBit Exchange', function(accounts) {
  it("should simulate the exchange of ether for computation and verification", function() {
  	var taskGiver, solver, verifier, sendTask, sendSolution, solverSelection;
  	return TaskGiver.deployed().then(function(_taskGiver) {
  		taskGiver = _taskGiver;
  		return Solver.deployed();
  	}).then(function(_solver) {
  		solver = _solver;
  		return Verifier.deployed();
  	}).then(function(_verifier) {
  		verifier = _verifier;
  		return taskGiver.submitDeposit(accounts[5], {value: 10000});
  	}).then(function(tx) {
  		return solver.submitDeposit(accounts[6], {value: 10000});
  	}).then(function(tx) {
  		return verifier.submitDeposit(accounts[7], {value: 10000});
  	}).then(function(tx) {
  		return taskGiver.sendTask(6000, accounts[5]);
  	}).then(function(tx) {
  		sendTask = taskGiver.SendTask();
  		sendTask.watch(function(error, result) {
  			if(!error) {
  				var from = result.args._from;
  				var taskID = result.args.id;
  				var minDeposit = result.args.minDeposit;
  				if(minDeposit >= 6000) {//Ignore tasks from other tests
  					solver.sendBid(from, 0, 6000, accounts[6]);
  				}
  			}
  		});

  		solverSelection = taskGiver.SolverSelection();
  		solverSelection.watch(function(error, result) {
  			if(!error) {
  				var taskID = result.args.taskID.toNumber();
  				var from = result.args._from;
  				var minDeposit = result.args.minDeposit.toNumber();
  				if(solver.wasSelected(accounts[6], from, taskID)) {
  					solver.solveTask(accounts[6], accounts[5], taskID, 0x0, minDeposit);
  				}
  			}
  		});

  		sendSolution = solver.SendSolution();
  		sendSolution.watch(function(error, result) {
  			if(!error) {
  				var solverAddress = result.args.solver;
  				var taskGiverAddress = result.args.taskGiver;
  				var id = result.args.id.toNumber();
  				var solution = result.args.solution;
  				var minDeposit = result.args.minDeposit.toNumber();
  				var taskData = result.args.taskData;
  				if(minDeposit >= 6000) {//Ignore other solutions
  					//verifier.sendSolutionHash(accounts[7], taskGiverAddress, minDeposit, id, 0x0);
  				}
  			}
  		});
  	}).then(function() {
  			return new Promise(function(resolve) {
  				setTimeout(function() {
  					resolve(taskGiver.selectSolver(0));
  				}, 2000);
  			});
  	}).then(function() {
  		return new Promise(function(resolve) {
  			setTimeout(function() {
  				resolve();
  				//taskGiver.completeTask(0, accounts[5]));
  			}, 2000);
  		});
  	});
  });
});

console.log("ctrl + c to end tests");