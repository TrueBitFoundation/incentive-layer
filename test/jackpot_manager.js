const TRU = artifacts.require("TRU.sol");
const TestJackpotManager = artifacts.require('TestJackpotManager.sol');
const Web3 = require('web3');
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));

const BigNumber = require('bignumber.js')

contract('JackpotManager', function(accounts) {
    let jackpotManager, oldBalance, newBalance, token, tx

    const donationAmount = web3.utils.toWei('1', 'ether');

    before(async () => {
        token = await TRU.new({from: accounts[5]})
        jackpotManager = await TestJackpotManager.new(token.address)
        await token.transferOwnership(jackpotManager.address, {from: accounts[5]})
    })

    describe('interact with Test Jackpot Manager', () => {
//        it('should donate to the jackpot', async () => {
//            const tx = await jackpotManager.donateToJackpot({from: accounts[1], value: donationAmount})
//            log = tx.logs.find(log => log.event === 'JackpotIncreased')
//            assert(log.args.amount.eq(donationAmount))
//
//            const jackpot = await jackpotManager.getJackpotAmount.call()
//            assert(jackpot.eq(donationAmount))
//        })
        it('should donate to the jackpot', async () => {
            const tx = await jackpotManager.increaseJackpot(donationAmount, {from: accounts[1]})
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
            oldBalance = await token.balanceOf(accounts[0])
            tx = await jackpotManager.receiveJackpotPayment(0, 0, {from: accounts[0]})
            newBalance = await token.balanceOf(accounts[0])
            assert((new BigNumber(oldBalance)).isLessThan(new BigNumber(newBalance)))

            oldBalance = await token.balanceOf(accounts[1])
            tx = await jackpotManager.receiveJackpotPayment(0, 1, {from: accounts[1]})
            newBalance = await token.balanceOf(accounts[0])
            assert((new BigNumber(oldBalance)).isLessThan(new BigNumber(newBalance)))

            oldBalance = await token.balanceOf(accounts[2])
            tx = await jackpotManager.receiveJackpotPayment(0, 2, {from: accounts[2]})
            newBalance = await token.balanceOf(accounts[0])
            assert((new BigNumber(oldBalance)).isLessThan(new BigNumber(newBalance)))

            oldBalance = await token.balanceOf(accounts[3])
            tx = await jackpotManager.receiveJackpotPayment(0, 3, {from: accounts[3]})
            newBalance = await token.balanceOf(accounts[0])

            assert((new BigNumber(oldBalance)).isLessThan(new BigNumber(newBalance)))
        })
    })
})
