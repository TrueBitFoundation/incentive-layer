const IncentiveLayer = artifacts.require("./IncentiveLayer.sol")
const TestJackpotManager = artifacts.require("./TestJackpotManager.sol")
const TestRewardsManager = artifacts.require("./TestRewardsManager.sol")
const TaskExchange = artifacts.require("./TaskExchange.sol")
const DisputeResolutionLayerDummy = artifacts.require("./DisputeResolutionLayerDummy.sol")
const TRU = artifacts.require('./TRU.sol')
const ExchangeRateOracle = artifacts.require('./ExchangeRateOracle.sol')
const RewardsManager = artifacts.require('./RewardsManager.sol')

module.exports = async (deployer, network, accounts) => {
    await deployer.deploy(DisputeResolutionLayerDummy)
    //await deployer.deploy(ExchangeRateOracle)    
    await deployer.deploy(TRU)
    await deployer.deploy(TestRewardsManager, TRU.address)
    await deployer.deploy(TestJackpotManager, TRU.address)
    //await deployer.deploy(TaskExchange, TRU.address)
    await deployer.deploy(ExchangeRateOracle)
    await deployer.deploy(IncentiveLayer, TRU.address, ExchangeRateOracle.address, {from: accounts[5]});
}
    
