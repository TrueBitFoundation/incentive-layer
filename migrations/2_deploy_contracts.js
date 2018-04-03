const IncentiveLayer = artifacts.require("./IncentiveLayer.sol")
const TestJackpotManager = artifacts.require("./TestJackpotManager.sol")
const TaskExchange = artifacts.require("./TaskExchange.sol")


module.exports = function(deployer) {
  deployer.deploy(IncentiveLayer)
  deployer.deploy(TestJackpotManager)
  deployer.deploy(TaskExchange)
}
