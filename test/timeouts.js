const TRU = artifacts.require('TRU.sol');
const IncentiveLayer = artifacts.require('IncentiveLayer.sol')
const ExchangeRateOracle = artifacts.require('ExchangeRateOracle.sol')
const Web3 = require('web3')
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"))
const mineBlocks = require('./helpers/mineBlocks')

contract('IncentiveLayer Timeouts', function(accounts) {
  let incentiveLayer, deposit, bond, tx, log, taskID, intent, token, oracle

  const taskGiver = accounts[1]
  const solver = accounts[2]
  const verifier = accounts[3]

  const minDeposit = 500
  const maxDifficulty = 500
  const reward = 500
  const randomBits = 12345

  context('task giver calls timeout on solver for submitting solution in time', async () => {
    before( async ()=> {
      token = await TRU.new({from: accounts[5]})
      oracle = await ExchangeRateOracle.new({from: accounts[6]})
      await oracle.updateExchangeRate(1000, {from: accounts[6]})
      
      incentiveLayer = await IncentiveLayer.new(token.address, oracle.address)
      await token.transferOwnership(incentiveLayer.address, {from: accounts[5]})

      await token.sendTransaction({from: taskGiver, value: web3.utils.toWei('1', 'ether')})
      await token.sendTransaction({from: solver, value: web3.utils.toWei('1', 'ether')})
      await token.sendTransaction({from: verifier, value: web3.utils.toWei('1', 'ether')})

      await token.approve(incentiveLayer.address, reward + (minDeposit * 2 * 5), {from: taskGiver})
      await token.approve(incentiveLayer.address, minDeposit * 2, {from: solver})
      await token.approve(incentiveLayer.address, minDeposit * 2, {from: verifier})

      await incentiveLayer.makeDeposit(minDeposit * 2 * 5,{from: taskGiver})
      await incentiveLayer.makeDeposit(minDeposit * 2, {from: solver})
      tx = await incentiveLayer.createTask(minDeposit, 0x0, 5, reward, {from: taskGiver})
      log = tx.logs.find(log => log.event === 'TaskCreated')
      taskID = log.args.taskID.toNumber()
      await incentiveLayer.registerForTask(taskID, web3.utils.soliditySha3(randomBits), {from: solver})
    })

    it('should transfer solvers funds to jackpot', async () => {
      await mineBlocks(web3, 5)
      await incentiveLayer.taskGiverTimeout(taskID, {from: taskGiver})
      assert((await incentiveLayer.getDeposit.call(solver)).eq(minDeposit))
    })

    //it('should unbond task giver deposit', async () => {
    //  tx = await incentiveLayer.unbondDeposit(taskID, {from: taskGiver})
    //  log = tx.logs.find(log => log.event === 'DepositUnbonded')
    //  assert(log.args.taskID.eq(taskID))
    //  assert.equal(taskGiver, log.args.account)
    //  assert(log.args.amount.eq(minDeposit))
    //  assert((await incentiveLayer.getDeposit.call(taskGiver)).eq(minDeposit*2))
    //})

    it('should unbond solver deposit', async () => {
      await incentiveLayer.unbondDeposit(taskID, {from: solver})
      assert((await incentiveLayer.getDeposit.call(solver)).eq(minDeposit))
    })
  })
})
