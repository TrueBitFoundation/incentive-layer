var Truebit = artifacts.require("./Truebit.sol");
var ExampleRequester = artifacts.require("./ExampleRequester.sol");
var TaskGiver = artifacts.require("./TaskGiver.sol");
var Solver = artifacts.require("./Solver.sol");

module.exports = function(deployer, network, thing) {
  deployer.deploy(Truebit).then(function() {
    return deployer.deploy(ExampleRequester, Truebit.address);
  });
  deployer.deploy(TaskGiver);
  deployer.deploy(Solver);
  // deployer.link(ConvertLib, MetaCoin);
  // deployer.deploy(MetaCoin);
};
