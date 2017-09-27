var TaskGiver = artifacts.require("./TaskGiver.sol");
var Truebit = artifacts.require("./Truebit.sol");

//Need timeouts or else testrpc will throw invalid opcode errors nondeterministically
const util = require('util');
const setTimeoutPromise = util.promisify(setTimeout);

contract('Truebit Integration', function(accounts) {

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
      taskIndex0 = 0;// zeroith task in truebit contract
      globalRoot0 = "0x0000000000000000000000000000000000000000123456789012340000000000"
      solution0 =   "0x0000000000000000000000000000000000000000000000000000000000000007"
      return taskIndex0;
    }).then(function(taskIndex0) {
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
      return 0;
    }).then(function(tx) {
      return truebit.getTask(taskIndex0);
    });
  });
});