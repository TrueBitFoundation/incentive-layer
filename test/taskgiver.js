var TaskGiver = artifacts.require("./ExampleTaskGiver.sol");
var Truebit = artifacts.require("./Truebit.sol");
var TaskGiver2 = artifacts.require("./TaskGiver.sol");

//Need timeouts or else testrpc will throw invalid opcode errors nondeterministically
const util = require('util');
const setTimeoutPromise = util.promisify(setTimeout);

contract('TaskGiver Integration', function(accounts) {

	it("get instance", function() {
		return TaskGiver.deployed()
	});

	setTimeoutPromise(10).then(function(){
		it("post task", function() {
			var dataRoot = "0x0000000000000000000000000000000000000000000000000012345678901234";
			var minDeposit = 1000000000000000000 //1 ETH
			var reward = 1000000000
			var timeout = 20; //20 seconds
			var taskGiver;
			return TaskGiver2.deployed().then(function(_taskGiver) {
				taskGiver = _taskGiver
				return taskGiver.postTask(dataRoot, timeout, reward, minDeposit);
			}).then(function(task) {
	      assert.equal(task[0], dataRoot)
	      assert.equal(task[1], taskGiver.address)
	      assert.equal(task[2].toNumber(), minDeposit)
	      assert.equal(task[3].toNumber(), reward, "'reward'")
	      assert.equal(task[4].toNumber(), timeout)
			});
		});
	});

  it("get instance, check truebit address", function() {
    var truebit, taskGiver, dataRoot, minDeposit, value, taskIndex0, globalRoot0, solutions0
    return Truebit.deployed().then(function(_truebit) {
      truebit = _truebit
      return TaskGiver.deployed()
    }).then(function(_taskGiver) {
      taskGiver = _taskGiver
      return taskGiver.truebit.call()
    }).then(function(_trubitAddress) {
      assert.equal(truebit.address, _trubitAddress, "Wrong truebit address in taskGiver contract");
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
      assert.isFalse(task0[5], "'proccessed'")
      assert.equal(task0[6], "0x0000000000000000000000000000000000000000000000000000000000000000", "globalRoot")
      assert.equal(task0[7], "0x0000000000000000000000000000000000000000000000000000000000000000", "solution")
      return truebit.cheatSolve(taskIndex0, globalRoot0, solution0, {from: accounts[0]});
    }).then(function(tx) {
      return truebit.getTask(taskIndex0);
    }).then(function(task0) {
      assert.isTrue(task0[4], "'solved'")
      assert.equal(task0[6], globalRoot0)
      assert.equal(task0[7], solution0)
      return truebit.proccessTask(taskIndex0, {from: accounts[0]});
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
});