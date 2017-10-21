var TaskBook = artifacts.require('./TaskBook.sol');
var Web3 = require('web3');
var web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));

contract('TaskBook', function(accounts) {

	//starting with account[1], because web3 uses account[0] by default if address not specified
  it("should assert true", function() {
    var task_book, task_giver, solver, verifier, taskID, minDeposit, challengerID, intentHash;
    TaskBook.deployed().then(function(_task_book) {
    	task_book = _task_book;
    	return task_book.commitDeposit({from: accounts[1], value: 10000});
    }).then(function(tx) {
    	//TaskGiver
    	assert.equal(web3.utils.soliditySha3(accounts[1]), tx.receipt.logs[0].data);
    	task_giver = accounts[1];
    	return task_book.commitDeposit({from: accounts[2], value: 10000});
    }).then(function(tx) {
    	//Solver
    	assert.equal(web3.utils.soliditySha3(accounts[2]), tx.receipt.logs[0].data);
    	solver = accounts[2];
    	return task_book.commitDeposit({from: accounts[3], value: 10000});
    }).then(function(tx) {
    	//Verifier
    	assert.equal(web3.utils.soliditySha3(accounts[3]), tx.receipt.logs[0].data);
    	verifier = accounts[3];
    	minDeposit = 5000;
    	return task_book.createTask(minDeposit, 0x0, 5, {from: task_giver});
    }).then(function(tx) {
        //State 0
    	assert.equal(web3.utils.soliditySha3(accounts[1]), tx.receipt.logs[0].data);
    	taskID = tx.logs[0].args.taskID.toNumber();
    	assert.equal(0, taskID);
    	assert.equal(minDeposit, tx.logs[0].args.minDeposit.toNumber());
    	//TODO: add block number test here
    	return task_book.registerForTask(tx.logs[0].args.taskID, tx.logs[0].args.minDeposit, web3.utils.soliditySha3(12345), {from: solver});
    }).then(function(tx) {
        //State 1
        assert.equal(taskID, tx.logs[0].args.taskID.toNumber());
        assert.equal(solver, tx.logs[0].args.solver);
        assert.equal(0x0, tx.logs[0].args.taskData);
        assert.equal(minDeposit, tx.logs[0].args.minDeposit);
        assert.equal(web3.utils.soliditySha3(12345), tx.receipt.logs[0].data);
    	return task_book.commitSolution(taskID, web3.utils.soliditySha3(0x0), web3.utils.soliditySha3(0x12345), {from: solver});
    }).then(function(tx) {
        //State 2
    	assert.equal(taskID, tx.logs[0].args.taskID.toNumber());
    	assert.equal(minDeposit, tx.logs[0].args.minDeposit.toNumber());
        intentHash = web3.utils.soliditySha3(2);
    	return task_book.commitChallenge(taskID, minDeposit, intentHash, {from: verifier});
    }).then(function(tx) {
        assert.equal(taskID, tx.logs[0].args.taskID.toNumber());
        assert.equal(verifier, tx.logs[0].args.challenger);
        challengerID = tx.logs[0].args.challengerID.toNumber();
    	return task_book.changeTaskState(taskID, 3, {from: task_giver});
    }).then(function(tx) {
        //State 3
        assert.equal(taskID, tx.logs[0].args.taskID.toNumber());
        assert.equal(3, tx.logs[0].args.state.toNumber());
        return task_book.revealIntent(taskID, challengerID, 2, {from: verifier});
    }).then(function(tx) {
        return task_book.changeTaskState(taskID, 4, {from: task_giver});
    }).then(function(tx) {
        //State 4
        assert.equal(taskID, tx.logs[0].args.taskID.toNumber());
        assert.equal(4, tx.logs[0].args.state.toNumber());
        return task_book.revealSolution(taskID, true, 12345, {from: solver});
    }).then(function(tx) {
        //State 5
        assert.equal(taskID, tx.logs[0].args.taskID.toNumber());
        assert.equal(12345, tx.logs[0].args.randomBits.toNumber());
        return
    });
  });
});
