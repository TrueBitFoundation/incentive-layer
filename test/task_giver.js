var TaskGiver = artifacts.require('./TaskGiver.sol');
var Web3 = require('web3');
var web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));

contract('TaskGiver', function(accounts) {
  it("should assert true", function() {
  	var taskGiver;
    return TaskGiver.deployed().then(function(instance) {
    	taskGiver = instance;
    	return taskGiver.getBalance.call(accounts[0]);
    }).then(function(balance) {
    	assert.equal(0, balance.toNumber());
    	return taskGiver.submitDeposit(accounts[0], {value: 10000});
    }).then(function(tx) {
        assert.equal(web3.utils.soliditySha3(accounts[0]), tx.receipt.logs[0].data);
    	return taskGiver.getBalance.call(accounts[0]);
    }).then(function(balance) {
    	assert.equal(10000, balance.toNumber());
    	return taskGiver.sendTask(accounts[0], 5000, 0x0);
    }).then(function(tx) {
        assert.equal(taskGiver.address, tx.logs[0].args._from);
    	return taskGiver.receiveBid(0, accounts[1]);//account[1] sends bid to task0
    }).then(function(tx) {
        assert.equal(web3.utils.soliditySha3(accounts[1]), tx.receipt.logs[0].data);
        return taskGiver.selectSolver(0);
    }).then(function(tx) {
        assert.equal(accounts[1], tx.logs[0].args.solver);
        return
    });
  });
});
