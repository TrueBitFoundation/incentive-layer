var Truebit = artifacts.require("./Truebit.sol");
var TaskGiver = artifacts.require("./TaskGiver.sol");
var Solver = artifacts.require("./Solver.sol")
var Verifier = artifacts.require("./Verifier.sol")

module.exports = function(deployer, network, thing) {
  deployer.deploy(Truebit).then(function() {
    return deployer.deploy(TaskGiver, Truebit.address);
  }).then(function() {
  	return deployer.deploy(Solver, Truebit.address);
  }).then(function() {
	return deployer.deploy(Verifier, Truebit.address);
  });
};