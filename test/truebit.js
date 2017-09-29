var Truebit = artifacts.require("./Truebit.sol");
var Solver = artifacts.require("./Solver.sol");
var SolverClient = require("../scripts/solverClient.js");
var TaskGiver = artifacts.require("./TaskGiver.sol");
var TaskGiverClient = require("../scripts/taskGiverClient.js");

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

  var solverAddress;
  
  it("tests solver listening for PostTask event", function() {
      var solver, sc;
      return Solver.deployed().then(function(_solver) {
        solver = _solver;
        return solver.truebit.call()
      }).then(function(_truebitAddress) {
        assert.equal(truebit.address, _truebitAddress);
        return
      }).then(function() {
        solverAddress = solver.address;
        sc = new SolverClient(solver.address);
        return sc.initialize();
      }).then(function(_sc) {
        _sc.postTaskEvent.watch(function(err, result) {
          if(!err) {
            assert.equal(0, result.args.taskId.toNumber());
            assert.equal(1000000000000000000, result.args.minDeposit.toNumber());
            _sc.solver.postBid(result.args.taskId.toNumber(), result.args.minDeposit.toNumber());
          }
        });
        return
      });
  });

  it("tests task giver for receiving bids", function() {
    return TaskGiver.deployed().then(function(_taskGiver) {
      tg = new TaskGiverClient(_taskGiver.address);
      return tg.initialize();
    }).then(function(_tg) {
      _tg.postBidEvent.watch(function(err, result) {//event handlers seem to like the returned promise
        if(!err) {
          assert.equal(solverAddress, result.args.from);
          assert.equal(0, result.args.taskId.toNumber());
          tg.addSolver(result.args.from);//Normal method calls don't like the promise, but do work with global object
        }
      });
    });
  });

  console.log("Press ctrl+c to exit tests");
});