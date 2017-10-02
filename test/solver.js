var Solver = artifacts.require('./Solver.sol');
var TaskGiver = artifacts.require('./TaskGiver.sol');

contract('Solver', function(accounts) {
  it("should submit balance and send bid", function() {
  	var solver;
    return Solver.deployed().then(function(instance) {
    	solver = instance;
    	return solver.getBalance.call({from: accounts[0]});
    }).then(function(balance) {
    	assert.equal(0, balance.toNumber());
    	return solver.submitDeposit({value: 10000, from: accounts[0]});
    }).then(function(result) {
    	// console.log(result);
    	// assert.isTrue(result);
    	return solver.getBalance.call({from: accounts[0]});
    }).then(function(balance) {
    	assert.equal(10000, balance.toNumber());
    	return TaskGiver.deployed();
    }).then(function(tg) {
    	return solver.sendBid(tg.address, 0, 5000, {from: accounts[0]});
    }).then(function(tx) {
    	return
    });
  });

  it("should solve task", function() {
    var solver;
    return Solver.deployed().then(function(instance) {
        solver = instance;
        return solver.solveTask.call(0x0);
    }).then(function(result) {
        assert.isTrue(result);
    });
  });
});
