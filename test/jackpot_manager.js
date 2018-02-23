
const TestJackpotManager = artifacts.require('TestJackpotManager.sol');
const Web3 = require('web3');
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));

contract('JackpotManager', function(accounts) {
  let jackpotManager, oldBalance, newBalance

  const donationAmount = web3.utils.toWei('1', 'ether');

  before(async () => {
      jackpotManager = await TestJackpotManager.new()
  })
  
  describe('interact with Test Jackpot Manager', () => {
    it('should donate to the jackpot', async () => {
      const tx = await jackpotManager.donateToJackpot({from: accounts[1], value: donationAmount})
      log = tx.logs.find(log => log.event === 'JackpotIncreased')
      assert.equal(log.args.amount.toNumber(), donationAmount)

      const jackpot = await jackpotManager.getJackpotAmount.call()
      assert.equal(jackpot.toNumber(), donationAmount)
    })

    it('should distribute jackpot', async () => {
      await jackpotManager.distributeJackpot([accounts[0], accounts[1]], [accounts[2], accounts[3]])

      const jackpotID = (await jackpotManager.getCurrentJackpotID.call()).toNumber()

      assert.equal(jackpotID, 1)
    })

    it('should be able to receive payment', async () => {
      oldBalance = await web3.eth.getBalance(accounts[0])
      await jackpotManager.receiveJackpotPayment(0, 0, 0, {from: accounts[0]})
      newBalance = await web3.eth.getBalance(accounts[0])
      assert(oldBalance < newBalance)

      oldBalance = await web3.eth.getBalance(accounts[1])
      await jackpotManager.receiveJackpotPayment(0, 0, 1, {from: accounts[1]})
      newBalance = await web3.eth.getBalance(accounts[1])
      assert(oldBalance < newBalance)

      oldBalance = await web3.eth.getBalance(accounts[2])
      await jackpotManager.receiveJackpotPayment(0, 1, 0, {from: accounts[2]})
      newBalance = await web3.eth.getBalance(accounts[2])
      assert(oldBalance < newBalance)

      oldBalance = await web3.eth.getBalance(accounts[3])
      await jackpotManager.receiveJackpotPayment(0, 1, 1, {from: accounts[3]})
      newBalance = await web3.eth.getBalance(accounts[3])
      assert(oldBalance < newBalance)
    })
  })
})