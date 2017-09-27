var Truebit = artifacts.require("./Truebit.sol");
var ExampleRequester = artifacts.require("./ExampleRequester.sol");
var TaskGiver = artifacts.require("./TaskGiver.sol")

module.exports = function(deployer, network, thing) {
  deployer.deploy(Truebit).then(function() {
    return deployer.deploy(ExampleRequester, Truebit.address);
  });

  deployer.deploy(TaskGiver);
  // deployer.link(ConvertLib, MetaCoin);
  // deployer.deploy(MetaCoin);
};
