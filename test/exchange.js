var TaskBook = artifacts.require("./TaskBook.sol");
var Web3 = require('web3');
var web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));

contract('TrueBit Exchange', function(accounts) {
  it("should simulate the exchange of ether for computation and verification", function() {
  	var task_book, task_giver, solver, verifier, task_created, solution_submitted, solver_selected, taskID;
    task_giver = accounts[5];
    solver = accounts[6];
    verifier = accounts[7];
    var minDeposit = 6500;
  	return TaskBook.deployed().then(function(_task_book) {
  		task_book = _task_book;
  		return task_book.commitDeposit({from: task_giver, value: 10000});
  	}).then(function(tx) {
  		return task_book.commitDeposit({from: solver, value: 10000});
  	}).then(function(tx) {
  		return task_book.commitDeposit({from: verifier, value: 10000});
  	}).then(function(tx) {
  		return task_book.createTask(minDeposit, 0x0, 5, 5, 5, 5, {from: task_giver});
  	}).then(function(tx) {
      taskID = tx.logs[0].args.taskID;
  		task_created = task_book.TaskCreated();
  		task_created.watch(function(error, result) {
  			if(!error) {
          var _taskID = result.args.taskID;
          var _minDeposit = result.args.minDeposit.toNumber();
          var blockNumber = result.args.blockNumber.toNumber();
  				if(taskID == _taskID) {//Ignore tasks from other tests
            task_book.registerForTask(_taskID, web3.utils.soliditySha3(12345), {from: solver});

            // try {
            //    task_book.triggerTaskSolveTimeout(_taskID, {from: task_giver});
            // }
            // catch (e) {
            //    // statements to handle any exceptions
            //    console.log(e); // pass exception object to error handler
            // }
  				}
  			}
  		});

  		solver_selected = task_book.SolverSelected();
  		solver_selected.watch(function(error, result) {
  			if(!error) {
          var _taskID = result.args.taskID;
          var _solver = result.args.solver;
          var task_data = result.args.taskData;
          var minDeposit = result.args.minDeposit.toNumber();
          if(solver == _solver && taskID == _taskID) {
            task_book.commitSolution(_taskID, web3.utils.soliditySha3(0x0), web3.utils.soliditySha3(0x12345), {from: solver});
          }
  			}
  		});

      solutions_committed = task_book.SolutionsCommitted();
      solutions_committed.watch(function(error, result) {
        if(!error) {
          var _taskID = result.args.taskID;
          var _minDeposit = result.args.minDeposit.toNumber();
          var task_data = result.args.taskData;
          var solverAddress = result.args.solver;
          if(taskID == _taskID) {
            task_book.commitChallenge(_taskID, web3.utils.soliditySha3(2), {from: verifier});
          }
        }
      });

      task_state_change = task_book.TaskStateChange();
      task_state_change.watch(function(error, result) {
        if(!error) {
          var _taskID = result.args.taskID;
          var state = result.args.state.toNumber();
          if(taskID == _taskID) {
            if(state == 3) {
              task_book.revealIntent(taskID, 2, {from: verifier});
            }

            if(state == 4) {
              task_book.revealSolution(taskID, true, 12345, {from: solver});
            }
          }
        }
      });

      solution_revealed = task_book.SolutionRevealed();
      solution_revealed.watch(function(error, result) {
        if(!error) {
          var _taskID = result.args.taskID;
          var randomBits = result.args.randomBits.toNumber();
          if(taskID == _taskID) {
            task_book.verifySolution(taskID, 12345, {from: task_giver});
          }
        }
      });

  	}).then(function() {
  			return new Promise(function(resolve) {
  				setTimeout(function() {
            //Stop accepting challenges, challengers can reveal their intent
  					resolve(task_book.changeTaskState(taskID, 3, {from: task_giver}));
  				}, 3000);
  			});
  	}).then(function() {
        return new Promise(function(resolve) {
          setTimeout(function() {
            //Stop accepting challenger's intent, solver can reveal solution now
            resolve(task_book.changeTaskState(taskID, 4, {from: task_giver}));
          }, 3000);
        });
    });
  });
});

console.log("ctrl + c to end tests");