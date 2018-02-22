const IncentiveLayer = artifacts.require('IncentiveLayer.sol')
const Web3 = require('web3')
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"))
const mineBlocks = require('./helpers/mineBlocks')

contract('IncentiveLayer Timeouts', function(accounts) {
  let incentiveLayer, deposit, bond, tx, log, taskID, intent

  const taskGiver = accounts[1]
  const solver = accounts[2]
  const verifier = accounts[3]

  const minDeposit = 500
  const reward = 500
  const randomBits = 12345

  context('task giver calls timeout on solver for submitting solution in time', async () => {
    before( async ()=> {
      incentiveLayer = await IncentiveLayer.new()
      await incentiveLayer.makeDeposit({from: taskGiver, value: minDeposit*2})
      await incentiveLayer.makeDeposit({from: solver, value: minDeposit*2})
      tx = await incentiveLayer.createTask(minDeposit, 0x0, 5, {from: taskGiver, value: reward})
      log = tx.logs.find(log => log.event === 'TaskCreated')
      taskID = log.args.taskID.toNumber()
      await incentiveLayer.registerForTask(taskID, web3.utils.soliditySha3(randomBits), {from: solver})
    })

    it('should transfer solvers funds to jackpot', async () => {
      await mineBlocks(web3, 5)
      await incentiveLayer.taskGiverTimeout(taskID, {from: taskGiver})
      assert.equal(minDeposit, (await incentiveLayer.getDeposit.call(solver)).toNumber())
    })

    it('should unbond task giver deposit', async () => {
      tx = await incentiveLayer.unbondDeposit(taskID, {from: taskGiver})
      log = tx.logs.find(log => log.event === 'DepositUnbonded')
      assert.equal(taskID, log.args.taskID.toNumber())
      assert.equal(taskGiver, log.args.account)
      assert.equal(minDeposit, log.args.amount.toNumber())
      assert.equal(minDeposit*2, (await incentiveLayer.getDeposit.call(taskGiver)).toNumber())
    })

    it('should unbond solver deposit', async () => {
      await incentiveLayer.unbondDeposit(taskID, {from: solver})
      assert.equal(minDeposit, (await incentiveLayer.getDeposit.call(solver)).toNumber())
    })
  })
})