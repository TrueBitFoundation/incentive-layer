var Solver = artifacts.require('./Solver.sol');
var TaskGiver = artifacts.require('./TaskGiver.sol');

contract('Solver', function(accounts) {
  it("should submit balance and send bid", function() {
  	var solver;
    return Solver.deployed().then(function(instance) {
    	solver = instance;
    	return solver.getBalance.call(accounts[0]);
    }).then(function(balance) {
        //console.log(balance);
    	assert.equal(0, balance.toNumber());
    	return solver.submitDeposit(accounts[0], {value: 10000});
    }).then(function(result) {
    	 //console.log(result);
    	// assert.isTrue(result);
    	return solver.getBalance.call(accounts[0]);
    }).then(function(balance) {
    	assert.equal(10000, balance.toNumber());
    	return TaskGiver.deployed();
    }).then(function(tg) {
    	return solver.sendBid(tg.address, 0, 5000, accounts[0]);
    }).then(function(tx) {
    	//return
    });
  });

  it("should solve task and receive challenge", function() {
    var solver;
    return Solver.deployed().then(function(instance) {
        solver = instance;
        return solver.solveTask(0x0, 0, 1000);
    }).then(function(tx) {
        return solver.receiveChallenge(0, {from: accounts[3]});
    });
  });
});
