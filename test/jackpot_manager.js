
const IncentiveLayer = artifacts.require('IncentiveLayer.sol');
const Web3 = require('web3');
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));

contract('JackpotManager', function(accounts) {
  let jackpotManager;

  before(async () => {
      jackpotManager = await IncentiveLayer.new()
  })
  
  describe('donateToJackpot', () => {
    it('should donate to the jackpot', async () => {
      const tx = await jackpotManager.donateToJackpot({from: accounts[1], value: 1000});
      log = tx.logs.find(log => log.event === 'JackpotIncreased')
      assert.equal(log.args.amount.toNumber(), 1000);

      const jackpot = await jackpotManager.getJackpotAmount.call();
      assert.equal(jackpot.toNumber(), 1000);
    });
  })
});

