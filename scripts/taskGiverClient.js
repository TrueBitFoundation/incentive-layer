var TaskGiver = artifacts.require("./TaskGiver.sol");
const util = require('util');
const setTimeoutPromise = util.promisify(setTimeout);

module.exports = function() {
	this.taskGiver = TaskGiver.deployed()
	this.postTask = function(task, minDeposit, timeout) {
		setTimeoutPromise(timeout, function() {
			console.log("Bidding timeout triggered")
		});
	}
}