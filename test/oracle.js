const ExchangeRateOracle = artifacts.require('./ExchangeRateOracle.sol')
const Web3 = require('web3')
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"))

const timeout = require('./helpers/timeout')
const mineBlocks = require('./helpers/mineBlocks')

const BigNumber = require('bignumber.js')

contract('ExchangeRateOracle', function(accounts) {
    let oracle

    const TRUperUSD = 1000
    const owner = accounts[1];
    const notOwner = accounts[2];
    const taskDifficulty = 1000;
    const expectedDeposit = 1000;

    before(async () => {
      oracle = await ExchangeRateOracle.new({from: owner})
    })

    it('1000 TRU per USD is 1 TRU per cycle', async () => {
        // owner updates exchange rate
        tx = await oracle.updateExchangeRate(TRUperUSD, {from: owner})
        
        log = tx.logs.find(log => log.event == 'ExchangeRateUpdate')
        assert(log.args.TRUperUSD.eq(TRUperUSD))
        assert.equal(log.args.owner, owner)

        // check TRU per cycle
        TRUperCycle = await oracle.priceOfCycleTRU.call()
        assert(TRUperCycle.eq(1))
    })

    it('price of task is one to one in TRU', async () => {
        minDeposit = await oracle.getMinDeposit(taskDifficulty)
        
        assert(minDeposit.eq(expectedDeposit))
    })

})
