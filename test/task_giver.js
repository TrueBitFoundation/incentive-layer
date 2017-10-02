var TaskGiver = artifacts.require('./TaskGiver.sol');

contract('TaskGiver', function(accounts) {
  it("should assert true", function() {
  	var taskGiver;
    return TaskGiver.deployed().then(function(instance) {
    	taskGiver = instance;
    	return taskGiver.getBalance.call({from: accounts[0]});
    }).then(function(balance) {
    	assert.equal(0, balance.toNumber());
    	return taskGiver.submitDeposit({value: 10000, from: accounts[0]});
    }).then(function(result) {
    	// console.log(result);
    	// assert.isTrue(result);
    	return taskGiver.getBalance.call({from: accounts[0]});
    }).then(function(balance) {
    	assert.equal(10000, balance.toNumber());
    	return taskGiver.sendTask.call(5000, {from: accounts[0]});
    }).then(function(result) {
    	assert.isTrue(result);
    	return
    });
  });
});
