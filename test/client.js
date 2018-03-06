const client = require('../client')

const timeout = require('./helpers/timeout')
const mineBlocks = require('./helpers/mineBlocks')

contract('Incentive Layer Client', function(accounts) {
  let incentiveLayer, deposit, bond, tx, log, taskID, intent, oldBalance

  let taskMonitor

  const taskGiver = accounts[1]
  const solver = accounts[2]
  const verifier = accounts[3]

  const minDeposit = 500
  const reward = client.web3.utils.toWei('1', 'ether')
  const randomBits = 12345

  context('incentive layer client', () => {

    before( async () => {
      incentiveLayer = client.incentiveLayer
    })

    after(async () => {
      console.log("Ending tests")
      clearInterval(taskMonitor)//kill interval loop
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
      taskMonitor = await client.monitorTasks({from: solver, gas: 150000})
    })

    // it("should commit a solution", async () => {
    //   // solver commits their solutions.
    //   tx = await incentiveLayer.commitSolution(taskID, web3.utils.soliditySha3(0x0), web3.utils.soliditySha3(0x12345), {from: solver})
    //   log = tx.logs.find(log => log.event === 'SolutionsCommitted')
    //   assert.equal(log.args.taskID.toNumber(), taskID)
    //   assert.equal(log.args.minDeposit, minDeposit)
    // })

    // it("should commit a challenge", async () => {
    //   // verifier commits a challenge
    //   // they bond part of their deposit.
    //   intent = 0
    //   tx = await incentiveLayer.commitChallenge(taskID, web3.utils.soliditySha3(intent), {from: verifier})
    //   log = tx.logs.find(log => log.event === 'DepositBonded')
    //   assert.equal(log.args.taskID.toNumber(), taskID)
    //   assert.equal(log.args.account, verifier)
    //   assert.equal(log.args.amount, minDeposit)
    //   deposit = await incentiveLayer.getDeposit.call(verifier)
    //   assert.equal(deposit.toNumber(), 500)

    //   await mineBlocks(web3, 20)

    //   // taskGiver triggers task state transition
    //   tx = await incentiveLayer.changeTaskState(taskID, 3, {from: taskGiver})
    //   log = tx.logs.find(log => log.event === 'TaskStateChange')
    //   assert.equal(log.args.taskID.toNumber(), taskID);
    //   assert.equal(log.args.state.toNumber(), 3)
    // })

    // it("should reveal intent", async () => {
    //   // state 3: challenges accepted
    //   // verifier reveals their intent
    //   await incentiveLayer.revealIntent(taskID, intent, {from: verifier})

    //   await mineBlocks(web3, 10)

    //   // taskGiver triggers task  state transition
    //   tx = await incentiveLayer.changeTaskState(taskID, 4, {from: taskGiver})
    //   log = tx.logs.find(log => log.event === 'TaskStateChange')
    //   assert.equal(log.args.taskID.toNumber(), taskID)
    //   assert.equal(log.args.state.toNumber(), 4)
    // })

    // it("should reveal solution", async () => {

    //   // state 4: intents revealed
    //   tx = await incentiveLayer.revealSolution(taskID, true, randomBits, {from: solver})
    //   log = tx.logs.find(log => log.event === 'SolutionRevealed')
    //   if(log) {
    //     assert.equal(log.args.taskID.toNumber(), taskID)
    //     assert.equal(log.args.randomBits.toNumber(), randomBits)
    //   } else {
    //     assert.equal((await incentiveLayer.getTaskFinality.call(taskID)).toNumber(), 2)
    //   }
    // })

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
