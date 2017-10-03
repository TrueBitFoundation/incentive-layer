var Verifier = artifacts.require('./Verifier.sol');
var Solver = artifacts.require('./Solver.sol');
var TaskGiver = artifacts.require('./TaskGiver.sol');

contract('Verifier', function(accounts) {
  it("should submit balance, challenge solver, and send solution", function() {
  	var verifier, solver, taskGiver;
    return Verifier.deployed().then(function(instance) {
    	verifier = instance;
    	return verifier.getBalance.call({from: accounts[0]});
    }).then(function(balance) {
    	assert.equal(0, balance.toNumber());
    	return verifier.submitDeposit({value: 10000, from: accounts[0]});
    }).then(function(result) {
    	// console.log(result);
    	// assert.isTrue(result);
    	return verifier.getBalance.call({from: accounts[0]});
    }).then(function(balance) {
    	assert.equal(10000, balance.toNumber());
    	return Solver.deployed();
    }).then(function(_solver) {
        solver = _solver;
        return solver.solveTask(0x0, 0, 1000, {from: accounts[3]});
    }).then(function(tx) {
        return verifier.sendChallenge(solver.address, 0, 0x0, 1000, {from: accounts[0]});
    }).then(function(tx) {
        return TaskGiver.deployed();
    }).then(function(_taskGiver) {
        taskGiver = _taskGiver;
        return taskGiver.submitDeposit({from: accounts[4], value: 10000});
    }).then(function(tx) {
        return taskGiver.sendTask(5000, {from: accounts[4]});
    }).then(function(tx) {
        return verifier.sendSolutionHash(taskGiver.address, 5000, 0, 0x0);
    });
  });
});