var IncentiveLayer = artifacts.require("./IncentiveLayer.sol")
var TestJackpotManager = artifacts.require("./TestJackpotManager.sol")

module.exports = function(deployer) {
  deployer.deploy(IncentiveLayer)
  deployer.deploy(TestJackpotManager)
}
