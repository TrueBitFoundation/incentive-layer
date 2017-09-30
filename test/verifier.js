var Verifier = artifacts.require("./Verifier.sol");

//Need timeouts or else testrpc will throw invalid opcode errors nondeterministically
const util = require('util');
const setTimeoutPromise = util.promisify(setTimeout);

contract('Verifier tests', function(accounts) {

});