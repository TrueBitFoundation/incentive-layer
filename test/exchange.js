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
  			console.log(result);
  		});
  	});
  });
});

console.log("ctrl + c to end tests");