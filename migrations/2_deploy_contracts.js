const IncentiveLayer = artifacts.require("./IncentiveLayer.sol")
const TestJackpotManager = artifacts.require("./TestJackpotManager.sol")
const TaskExchange = artifacts.require("./TaskExchange.sol")
const DisputeResolutionLayerDummy = artifacts.require("./DisputeResolutionLayerDummy.sol")


module.exports = function(deployer) {
  deployer.deploy(IncentiveLayer)
  deployer.deploy(TestJackpotManager)
  deployer.deploy(TaskExchange)
  deployer.deploy(DisputeResolutionLayerDummy)
}
