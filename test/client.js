const client = require('../client')

const timeout = require('./helpers/timeout')
const mineBlocks = require('./helpers/mineBlocks')
const web3 = require('web3')

contract('Incentive Layer Client', function(accounts) {
  let incentiveLayer, deposit, bond, tx, log, taskID, intent, oldBalance

  let solverMonitor, verifierMonitor

  const taskGiver = accounts[1]
  const solver = accounts[2]
  const verifier = accounts[3]

  const minDeposit = 500
  const reward = web3.utils.toWei('1', 'ether')
  const randomBits = 12345

  context('incentive layer client', () => {

    before( async () => {
      incentiveLayer = client.incentiveLayer
    })

    after(async () => {
      console.log("Ending tests")
      clearInterval(solverMonitor)//kill interval loop
      clearInterval(verifierMonitor)
    })

    it("should have participants make deposits", async () => {
      const amount = 1000

      assert.equal((await client.newDeposit({from: taskGiver, value: amount})).amount, amount)
      assert.equal((await client.newDeposit({from: solver, value: amount})).amount, amount)
      assert.equal((await client.newDeposit({from: verifier, value: amount})).amount, amount)
    })

    it("should create task", async () => {
      taskID = await client.newTask(minDeposit, 0x0, 5, {from: taskGiver, value: reward, gas: 300000})
      assert.notEqual(null, taskID)
    })

    it("should be monitoring for new tasks", async () => {
      solverMonitor = await client.monitorTasks({from: solver, gas: 150000})
    })

    it("should be monitoring for solutions", async () => {
      verifierMonitor = await client.monitorSolutions({from: verifier, gas: 150000})
    })

    //TODO::
    //See incentive_layer for examples
    // assert commit solution
    // assert commit challenge
    // assert change task state 3
    // assert reveal verifier intent
    // assert change task state 4
    // assert solver reveal solution

    // it('should run verification game', async () => {
    //   await incentiveLayer.runVerificationGame(taskID, {from: verifier})

    //   await incentiveLayer.finalizeTask(taskID, {from: taskGiver})

    //   assert.equal((await incentiveLayer.getTaskFinality.call(taskID)).toNumber(), 1)
    // })

    // it('should unbond solver deposit', async () => {
    //   await incentiveLayer.unbondDeposit(taskID, {from: solver})
    //   assert.equal(1000, (await incentiveLayer.getDeposit.call(solver)).toNumber())
    // })

    // it('should unbond task giver deposit', async () => {
    //   await incentiveLayer.unbondDeposit(taskID, {from: taskGiver})
    //   assert.equal(1000, (await incentiveLayer.getDeposit.call(taskGiver)).toNumber())
    // })

    // it('should unbond verifier deposit', async () => {
    //   await incentiveLayer.unbondDeposit(taskID, {from: verifier})
    //   assert.equal(1000, (await incentiveLayer.getDeposit.call(verifier)).toNumber())
    // })

    // it('should be higher than original balance', async () => {
    //   const newBalance = await web3.eth.getBalance(solver)
    //   assert(oldBalance < newBalance)
    // })
  })
})
