const IncentiveLayer = artifacts.require("./IncentiveLayer.sol")
const TestJackpotManager = artifacts.require("./TestJackpotManager.sol")
const TaskExchange = artifacts.require("./TaskExchange.sol")
const DisputeResolutionLayerDummy = artifacts.require("./DisputeResolutionLayerDummy.sol")
const TRU = artifacts.require('./TRU.sol')


module.exports = function(deployer, network, accounts) {
    deployer.deploy(TestJackpotManager)
    deployer.deploy(TaskExchange)
    deployer.deploy(DisputeResolutionLayerDummy)
    deployer.deploy(TRU).then( function () {
        deployer.deploy(IncentiveLayer, TRU.address, {from: accounts[0]});
    });
        
}
