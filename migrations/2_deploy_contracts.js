var Truebit = artifacts.require("./Truebit.sol");
var ExampleRequester = artifacts.require("./ExampleRequester.sol");

module.exports = function(deployer, network, thing) {
  deployer.deploy(Truebit).then(function() {
    return deployer.deploy(ExampleRequester, Truebit.address);
  });
  // deployer.deploy(Requester);
  // deployer.link(ConvertLib, MetaCoin);
  // deployer.deploy(MetaCoin);
};
