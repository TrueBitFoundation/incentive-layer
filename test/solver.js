var Solver = artifacts.require("./Solver.sol");

//Need timeouts or else testrpc will throw invalid opcode errors nondeterministically
const util = require('util');
const setTimeoutPromise = util.promisify(setTimeout);

contract('Solver tests', function(accounts) {

});