var TaskGiver = artifacts.require("./TaskGiver.sol");
var Solver = artifacts.require("./Solver.sol");
var Verifier = artifacts.require("./Verifier.sol");
var Web3 = require('web3');
var web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));

contract('TrueBit Exchange', function(accounts) {
  it("should simulate the exchange of ether for computation and verification", function() {
  	var taskGiver, solver, verifier, sendTask, sendSolution, solveTask;
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
  		return taskGiver.sendTask(accounts[5], 6000, 0x0);
  	}).then(function(tx) {
  		sendTask = taskGiver.SendTask();
  		sendTask.watch(function(error, result) {
  			if(!error) {
  				var from = result.args._from;
  				var taskID = result.args.id;
  				var minDeposit = result.args.minDeposit;
  				if(minDeposit >= 6000) {//Ignore tasks from other tests
  					solver.sendBid(from, taskID, minDeposit, accounts[6], web3.utils.soliditySha3("12345"));
  				}
  			}
  		});

  		solveTask = taskGiver.SolveTask();
  		solveTask.watch(function(error, result) {
        var solverAddress = result.args.solvers;
        var taskData = result.args.taskData;
        var minDeposit = result.args.minDeposit.toNumber();
  			if(!error) {
          if(minDeposit >= 6000) {//Ignore tasks from other tests
            solver.submitSolution(accounts[6], 0, "12345", 0x0, "123456");
          }
  			}
  		});
  	}).then(function() {
  			return new Promise(function(resolve) {
  				setTimeout(function() {
  					resolve(taskGiver.selectSolver(0));
  				}, 2000);
  			});
  	});
  });
});

console.log("ctrl + c to end tests");