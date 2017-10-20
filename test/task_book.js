var TaskBook = artifacts.require('./TaskBook.sol');
var Web3 = require('web3');
var web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));

contract('TaskBook', function(accounts) {

	//starting with account[1], because web3 uses account[0] by default if address not specified
  it("should assert true", function() {
    var task_book, task_giver, solver, verifier, taskID, minDeposit;
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
    	assert.equal(web3.utils.soliditySha3(accounts[1]), tx.receipt.logs[0].data);
    	taskID = tx.logs[0].args.taskID.toNumber();
    	assert.equal(0, taskID);
    	assert.equal(minDeposit, tx.logs[0].args.minDeposit.toNumber());
    	//TODO: add block number test here
    	return task_book.registerForTask(tx.logs[0].args.taskID, tx.logs[0].args.minDeposit, web3.utils.soliditySha3("12345"), {from: solver});
    }).then(function(tx) {
    	assert.equal(web3.utils.soliditySha3(solver), tx.receipt.logs[0].data);
    	return task_book.selectSolver(taskID, {from: task_giver});
    }).then(function(tx) {
    	assert.equal(solver, tx.logs[0].args.solver);
    	return task_book.commitSolution(taskID, web3.utils.soliditySha3(0x0), web3.utils.soliditySha3(0x12345), {from: solver});
    }).then(function(tx) {
    	assert.equal(taskID, tx.logs[0].args.taskID.toNumber());
    	assert.equal(minDeposit, tx.logs[0].args.minDeposit.toNumber());
    	return task_book.commitChallenge(taskID, minDeposit, solver, web3.utils.soliditySha3(2), {from: verifier});
    }).then(function(tx) {
    	assert.equal(web3.utils.soliditySha3(verifier), tx.receipt.logs[0].data);
    	return
    });
  });
});
