var TaskGiver = artifacts.require("./TaskGiver.sol");
var Truebit = artifacts.require("./Truebit.sol");
var Solver = artifacts.require("./Solver.sol")

//Need timeouts or else testrpc will throw invalid opcode errors nondeterministically
const util = require('util');
const setTimeoutPromise = util.promisify(setTimeout);

contract('TaskGiver Integration', function(accounts) {
  var truebit, taskGiver, dataRoot, minDeposit, value, taskIndex0, globalRoot0, solutions0

  it("tests TaskGiver & Truebit integration", function() {
    return Truebit.deployed().then(function(_truebit) {
      truebit = _truebit
      return TaskGiver.deployed()
    }).then(function(_taskGiver) {
      taskGiver = _taskGiver
      return taskGiver.truebit.call()
    }).then(function(_truebitAddress) {
      assert.equal(truebit.address, _truebitAddress, "Wrong truebit address in taskGiver contract");
      dataRoot = "0x0000000000000000000000000000000000000000000000000012345678901234"
      minDeposit = 1000000000000000000 //1 ETH
      value = 1000000000
      return taskGiver.createTask(dataRoot, minDeposit, {value: value, from: accounts[0]});
    }).then(function(tx) {
      taskIndex0 = 0 // zeroith task in truebit contract
      globalRoot0 = "0x0000000000000000000000000000000000000000123456789012340000000000"
      solution0 =   "0x0000000000000000000000000000000000000000000000000000000000000007"
      return taskGiver.tasks(taskIndex0);
    }).then(function(task0) {
      assert.equal(task0, "0x0000000000000000000000000000000000000000000000000000000000000000")
      return truebit.getTask(taskIndex0);
    }).then(function(task0) {
      assert.equal(task0[0], dataRoot)
      assert.equal(task0[1], taskGiver.address)
      assert.equal(task0[2].toNumber(), minDeposit)
      assert.isAbove(task0[3].toNumber(), 1, "'gasLimit'")
      assert.isFalse(task0[4], "'solved'")
      assert.isFalse(task0[5], "'processed'")
      assert.equal(task0[6], "0x0000000000000000000000000000000000000000000000000000000000000000", "globalRoot")
      assert.equal(task0[7], "0x0000000000000000000000000000000000000000000000000000000000000000", "solution")
      return truebit.cheatSolve(taskIndex0, globalRoot0, solution0, {from: accounts[0]});
    }).then(function(tx) {
      return truebit.getTask(taskIndex0);
    }).then(function(task0) {
      assert.isTrue(task0[4], "'solved'")
      assert.equal(task0[6], globalRoot0)
      assert.equal(task0[7], solution0)
      return truebit.processTask(taskIndex0, {from: accounts[0]});
    }).then(function(tx) {
      return truebit.getTask(taskIndex0);
    }).then(function(task0) {
      assert.isTrue(task0[5], "'proccessed'")
      return taskGiver.tasks(taskIndex0);
    }).then(function(taskGiverSolution) {
      assert.equal(taskGiverSolution, solution0)
      return
    });
  });
  
  it("tests listening for PostTask event", function() {
      var solver, postTaskEvent;
      return Solver.deployed().then(function(_solver) {
        solver = _solver;
        return solver.truebit.call()
      }).then(function(_truebitAddress) {
        assert.equal(truebit.address, _truebitAddress);
        return
      }).then(function() {
        //Listen for PostTask event
        postTaskEvent = truebit.PostTask(); 

        postTaskEvent.watch(function(error, result) {
          if(!error) {
            console.log("Task Posted");
            assert.equal(minDeposit, result.args.minDeposit.toNumber());
            assert.equal(1, result.args.taskId.toNumber());
            solver.postBid(result.args.minDeposit.toNumber(), result.args.taskId.toNumber());
          }else{
            console.error(error);
          }
        });
        return
      }).then(function() {
          //Emit PostTask
          taskGiver.createTask(dataRoot, minDeposit, {value: value, from: accounts[0]});
          return 
      }).then(function() {
          postTaskEvent.stopWatching()
      });
  });
});