var Verifier = artifacts.require('./Verifier.sol');
var Solver = artifacts.require('./Solver.sol');
var TaskGiver = artifacts.require('./TaskGiver.sol');
var Web3 = require('web3');
var web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));

contract('Verifier', function(accounts) {
  it("should submit balance, challenge solver, and send solution", function() {
  	var verifier, solver, taskGiver;
    return Verifier.deployed().then(function(instance) {
    	verifier = instance;
    	return verifier.getBalance.call(accounts[2]);
    }).then(function(balance) {
    	assert.equal(0, balance.toNumber());
    	return verifier.submitDeposit(accounts[2], {value: 10000});
    }).then(function(tx) {
        assert.equal(web3.utils.soliditySha3(accounts[2]), tx.receipt.logs[0].data);
    	return verifier.getBalance.call(accounts[2]);
    }).then(function(balance) {
    	assert.equal(10000, balance.toNumber());
    	return Solver.deployed();
    }).then(function(_solver) {
        solver = _solver;
        return solver.solveTask(0x0, 0, 1000, {from: accounts[3]});
    }).then(function(tx) {
        return verifier.sendChallenge(accounts[2], solver.address, 0, 0x0, 1000);
    }).then(function(tx) {
        assert.equal(web3.utils.soliditySha3(accounts[2]), tx.receipt.logs[0].data);
        assert.equal(web3.utils.soliditySha3(solver.address), tx.receipt.logs[1].data);
        return TaskGiver.deployed();
    }).then(function(_taskGiver) {
        taskGiver = _taskGiver;
        return taskGiver.submitDeposit(accounts[3], {value: 10000});
    }).then(function(tx) {
        return taskGiver.sendTask(5000, accounts[3]);
    }).then(function(tx) {
        return verifier.sendSolutionHash(accounts[2], taskGiver.address, 4500, 0, 0x0);
    }).then(function(tx) {
        assert.equal(tx.receipt.logs[1].data, tx.receipt.logs[0].data);
        assert.equal(web3.utils.soliditySha3(taskGiver.address), tx.receipt.logs[2].data);
        return
    });
  });
});