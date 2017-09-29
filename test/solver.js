var Solver = artifacts.require("./Solver.sol");
var solverClient = require("../scripts/solverClient.js");
var SolverClient = new solverClient();

//Need timeouts or else testrpc will throw invalid opcode errors nondeterministically
const util = require('util');
const setTimeoutPromise = util.promisify(setTimeout);

contract('Solver tests', function(accounts) {
	it("tests solver getting block hash", function() {
		console.log(SolverClient.getBlockHash());
    })
});