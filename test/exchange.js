var TaskBook = artifacts.require("./TaskBook.sol");
var Web3 = require('web3');
var web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));

contract('TrueBit Exchange', function(accounts) {
  it("should simulate the exchange of ether for computation and verification", function() {
  	var task_book, task_giver, solver, verifier, task_created, solution_submitted, solver_selected;
    task_giver = accounts[5];
    solver = accounts[6];
    verifier = accounts[7];
    var minDeposit = 6500;
  	return TaskBook.deployed().then(function(_task_book) {
  		task_book = _task_book;
  		return task_book.submitDeposit({from: task_giver, value: 10000});
  	}).then(function(tx) {
  		return task_book.submitDeposit({from: solver, value: 10000});
  	}).then(function(tx) {
  		return task_book.submitDeposit({from: verifier, value: 10000});
  	}).then(function(tx) {
  		return task_book.createTask(minDeposit, 0x0, 5, {from: task_giver});
  	}).then(function(tx) {
      taskID = tx.logs[0].args.taskID.toNumber();
  		task_created = task_book.TaskCreated();
  		task_created.watch(function(error, result) {
  			if(!error) {
          var _taskID = result.args.taskID.toNumber();
          var _minDeposit = result.args.minDeposit.toNumber();
          var blockNumber = result.args.blockNumber.toNumber();
  				if(minDeposit >= minDeposit) {//Ignore tasks from other tests
            task_book.registerForTask(_taskID, _minDeposit, web3.utils.soliditySha3("12345"), {from: solver});
  				}
  			}
  		});

  		solver_selected = task_book.SolverSelected();
  		solver_selected.watch(function(error, result) {
  			if(!error) {
          var _taskID = result.args.taskID.toNumber();
          var _solver = result.args.solver;
          var task_data = result.args.taskData;
          if(solver == _solver) {
            task_book.submitSolution(_taskID, web3.utils.soliditySha3(0x0), {from: solver});
          }
  			}
  		});

      solution_submitted = task_book.SolutionSubmitted();
      solution_submitted.watch(function(error, result) {
        if(!error) {
          var _taskID = result.args.taskID.toNumber();
          var _minDeposit = result.args.minDeposit.toNumber();
          var task_data = result.args.taskData;
          var solverAddress = result.args.solver;
          if(_minDeposit >= 6000) {
            task_book.submitChallenge(_taskID, _minDeposit, solverAddress, web3.utils.soliditySha3(2), {from: verifier});
          }
        }
      });
  	}).then(function() {
  			return new Promise(function(resolve) {
  				setTimeout(function() {
  					resolve(task_book.selectSolver(0, {from: task_giver}));
  				}, 3000);
  			});
  	});
  });
});

console.log("ctrl + c to end tests");