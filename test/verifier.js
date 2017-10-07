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
        return Solver.deployed()
    }).then(function(_solver) {
        solver = _solver;
        return solver.submitDeposit(accounts[1], {value: 10000});
    }).then(function(tx) {
        return TaskGiver.deployed();
    }).then(function(_taskGiver) {
        taskGiver = _taskGiver;
        return taskGiver.submitDeposit(accounts[0], {value: 10000});
    }).then(function(tx) {
        return taskGiver.sendTask(accounts[0], 3000, 0x0);
    }).then(function(tx) {
        return solver.sendBid(taskGiver.address, 0, 6000, accounts[1]);
    }).then(function(tx) {
        return taskGiver.selectSolver(0, {from: accounts[0]});
    }).then(function(tx) {
        return solver.submitSolution(taskGiver.address, accounts[1], 0, "12345", web3.utils.soliditySha3(0x0), web3.utils.soliditySha3("12345"));
    }).then(function(tx) {
        return verifier.sendChallenge(accounts[2], solver.address, 0, 4600);
    }).then(function(tx) {
        return
    });
  });
});