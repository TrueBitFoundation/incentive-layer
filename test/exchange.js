var TaskBook = artifacts.require("./TaskBook.sol");
var Web3 = require('web3');
var web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));

contract('TrueBit Exchange', function(accounts) {
  it("should simulate the exchange of ether for computation and verification", function() {
  	var task_book, task_giver, solver, verifier, new_task, submit_solution, solve_task;
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
  		return task_book.newTask(minDeposit, 0x0, 5, {from: task_giver});
  	}).then(function(tx) {
      taskID = tx.logs[0].args.taskID.toNumber();
  		new_task = task_book.NewTask();
  		new_task.watch(function(error, result) {
  			if(!error) {
          var _taskID = result.args.taskID.toNumber();
          var _minDeposit = result.args.minDeposit.toNumber();
          var blockNumber = result.args.blockNumber.toNumber();
  				if(minDeposit >= 6500) {//Ignore tasks from other tests
            task_book.registerForTask(_taskID, _minDeposit, {from: solver});
  				}
  			}
  		});

  		solve_task = task_book.SolveTask();
  		solve_task.watch(function(error, result) {
  			if(!error) {
          var _taskID = result.args.taskID.toNumber();
          var solver = result.args.solver;
          var task_data = result.args.taskData;
          if(minDeposit >= 6000) {//Ignore tasks from other tests
            task_book.submitSolution(_taskID, "12345", web3.utils.soliditySha3(0x0), web3.utils.soliditySha3("12345"), {from: solver});
          }
  			}
  		});

      submit_solution = task_book.SubmitSolution();
      submit_solution.watch(function(error, result) {
        if(!error) {
          var _taskID = result.args.taskID.toNumber();
          var solution = result.args.solution;
          var _minDeposit = result.args.minDeposit.toNumber();
          var task_data = result.args.taskData;
          if(minDeposit >= 6000) {
            task_book.submitChallenge(_taskID, _minDeposit, {from: verifier});
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