var TaskGiver = artifacts.require("./TaskGiver.sol");
var Solver = artifacts.require("./Solver.sol");
var Verifier = artifacts.require("./Verifier.sol");
var Web3 = require('web3');
var web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));

contract('TrueBit Exchange', function(accounts) {
  it("should simulate the exchange of ether for computation and verification", function() {
  	var taskGiver, solver, verifier, sendTask, submitSolution, solveTask;
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
  				var to = result.args._from;
  				var taskID = result.args.id;
  				var minDeposit = result.args.minDeposit;
  				if(minDeposit >= 6000) {//Ignore tasks from other tests
  					solver.sendBid(to, taskID, minDeposit, accounts[6]);
  				}
  			}
  		});

  		solveTask = taskGiver.SolveTask();
  		solveTask.watch(function(error, result) {
        var solverAddress = result.args.solver;
        var taskData = result.args.taskData;
        var minDeposit = result.args.minDeposit.toNumber();
        var taskID = result.args.id.toNumber();
  			if(!error) {
          if(minDeposit >= 6000) {//Ignore tasks from other tests
            solver.submitSolution(taskGiver.address, solverAddress, taskID, "12345", web3.utils.soliditySha3(0x0), web3.utils.soliditySha3("12345"));
          }
  			}
  		});

      submitSolution = solver.SubmitSolution();
      submitSolution.watch(function(error, result) {
        if(!error) {
          var solverAddress = result.args.solver;
          var taskGiverAddress = result.args.taskGiver;
          var taskID = result.args.id.toNumber();
          var solution = result.args.solution;
          var minDeposit = result.args.minDeposit.toNumber();
          var taskData = result.args.taskData;
          if(minDeposit >= 6000) {
            verifier.sendChallenge(accounts[7], solverAddress, taskID, minDeposit);
          }
        }
      });
  	}).then(function() {
  			return new Promise(function(resolve) {
  				setTimeout(function() {
  					resolve(taskGiver.selectSolver(0, {from: accounts[5]}));
  				}, 3000);
  			});
  	});
  });
});

console.log("ctrl + c to end tests");