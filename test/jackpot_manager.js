
const TestJackpotManager = artifacts.require('TestJackpotManager.sol');
const Web3 = require('web3');
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));

const BigNumber = require('bignumber.js')

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
      assert(log.args.amount.eq(donationAmount))

      const jackpot = await jackpotManager.getJackpotAmount.call()
      assert(jackpot.eq(donationAmount))
    })

    it('should distribute jackpot', async () => {
      await jackpotManager.distributeJackpot([accounts[0], accounts[1], accounts[2], accounts[3]])

      const jackpotID = await jackpotManager.getCurrentJackpotID.call()

      assert(jackpotID.eq(1))
    })

    it('should be able to receive payment', async () => {
      oldBalance = await web3.eth.getBalance(accounts[0])
      await jackpotManager.receiveJackpotPayment(0, 0, {from: accounts[0]})
      newBalance = await web3.eth.getBalance(accounts[0])
      assert((new BigNumber(oldBalance)).isLessThan(new BigNumber(newBalance)))

      oldBalance = await web3.eth.getBalance(accounts[1])
      await jackpotManager.receiveJackpotPayment(0, 1, {from: accounts[1]})
      newBalance = await web3.eth.getBalance(accounts[1])
      assert((new BigNumber(oldBalance)).isLessThan(new BigNumber(newBalance)))

      oldBalance = await web3.eth.getBalance(accounts[2])
      await jackpotManager.receiveJackpotPayment(0, 2, {from: accounts[2]})
      newBalance = await web3.eth.getBalance(accounts[2])
      assert((new BigNumber(oldBalance)).isLessThan(new BigNumber(newBalance)))

      oldBalance = await web3.eth.getBalance(accounts[3])
      await jackpotManager.receiveJackpotPayment(0, 3, {from: accounts[3]})
      newBalance = await web3.eth.getBalance(accounts[3])
      
      assert((new BigNumber(oldBalance)).isLessThan(new BigNumber(newBalance)))
    })
  })
})
