var TaskGiver = artifacts.require("./TaskGiver.sol");

//Need timeouts or else testrpc will throw invalid opcode errors nondeterministically
const util = require('util');
const setTimeoutPromise = util.promisify(setTimeout);

contract('TaskGiver API tests', function(accounts) {

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
			return TaskGiver.deployed().then(function(_taskGiver) {
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
});