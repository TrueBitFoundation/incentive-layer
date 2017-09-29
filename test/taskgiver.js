var TaskGiver = artifacts.require("./TaskGiver.sol");

//Need timeouts or else testrpc will throw invalid opcode errors nondeterministically
const util = require('util');
const setTimeoutPromise = util.promisify(setTimeout);

contract('TaskGiver tests', function(accounts) {
	//console.log(TaskGiver)

});