var TaskGiver = artifacts.require("./TaskGiver.sol");
var TaskGiverClient = require("../scripts/taskGiverClient.js");

contract('TaskGiver tests', function(accounts) {
	it("tests initialization of TaskGiver client", function() {
		var tg;
		TaskGiver.deployed().then(function(_tg) {
			tg = new TaskGiverClient(_tg.address);
			return tg.initialize();
		}).then(function(_tg) {
			assert.equal(TaskGiver.deployed().address, tg.address);
		});
	});
});