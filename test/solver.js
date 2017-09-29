var Solver = artifacts.require("./Solver.sol");
var SolverClient = require("../scripts/solverClient.js");


contract('Solver tests', function(accounts) {

	it("tests solver getting block hash", function() {
		var sc;
		Solver.deployed().then(function(_solver) {
			sc = new SolverClient(_solver.address);
			return sc.initialize();
		}).then(function(_sc) {
			var randomHash = sc.createRandomHash();
			if(sc.submittingCorrectSolution()) {
				console.log("Solving task, posting correct solution");
			}else{
				console.log("Solving task partially, submitting incorrect solution");
			}
		});
	});
});