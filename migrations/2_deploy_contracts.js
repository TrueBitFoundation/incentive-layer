var Truebit = artifacts.require("./Truebit.sol");

module.exports = function(deployer) {
  deployer.deploy(Truebit);
  // deployer.link(ConvertLib, MetaCoin);
  // deployer.deploy(MetaCoin);
};
