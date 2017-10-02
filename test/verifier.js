var Verifier = artifacts.require('./Verifier.sol');
var Solver = artifacts.require('./Solver.sol');

contract('Verifier', function(accounts) {
  it("should submit balance and send bid", function() {
  	var verifier, solver;
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
    });
  });
});