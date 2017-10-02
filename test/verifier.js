var Verifier = artifacts.require('./Verifier.sol');

contract('Verifier', function(accounts) {
  it("should submit balance and send bid", function() {
  	var verifier;
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
    	return 
    });
  });
});