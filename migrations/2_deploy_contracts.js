var IncentiveLayer = artifacts.require("./IncentiveLayer.sol");

module.exports = function(deployer, network, thing) {
  deployer.deploy(IncentiveLayer);
};
