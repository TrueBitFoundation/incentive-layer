var TBIncentiveLayer = artifacts.require("./TBIncentiveLayer.sol");

module.exports = function(deployer, network, thing) {
  deployer.deploy(TBIncentiveLayer);
};
