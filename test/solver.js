var Solver = artifacts.require('./Solver.sol');

contract('Solver', function(accounts) {
  it("should assert true", function() {
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
    	return;
    });
  });
});
