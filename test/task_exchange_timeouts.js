const TaskExchange = artifacts.require('./TaskExchange.sol')
const Web3 = require('web3')
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"))
const DisputeResolutionLayerDummy = artifacts.require('./DisputeResolutionLayerDummy.sol')

const timeout = require('./helpers/timeout')
const mineBlocks = require('./helpers/mineBlocks')

contract('TaskExchange timeouts', function(accounts) {
  let taskExchange, deposit, bond, tx, log, taskID, intent, oldBalance

  const taskGiver = accounts[1]
  const solver = accounts[2]
  const verifier = accounts[3]

  const minDeposit = 500
  const reward = web3.utils.toWei('1', 'ether')
  const randomBits = 12345

  context('timing out with no selected solver', () => {

    before(async () => {
      taskExchange = await TaskExchange.new()
      oldBalance = await web3.eth.getBalance(solver)
      disputeRes = await DisputeResolutionLayerDummy.at(DisputeResolutionLayerDummy.address)
    })

    it("should have participants make deposits", async () => {
      // taskGiver makes a deposit
      await taskExchange.makeDeposit({from: taskGiver, value: 1000})
      deposit = await taskExchange.getDeposit.call(taskGiver)
      assert(deposit.eq(1000))

      // to-be solver makes a deposit
      await taskExchange.makeDeposit({from: solver, value: 1000})
      deposit = await taskExchange.getDeposit.call(solver)
      assert(deposit.eq(1000))

      // to-be verifier makes a deposit
      await taskExchange.makeDeposit({from: verifier, value: 1000})
      deposit = await taskExchange.getDeposit.call(verifier)
      assert(deposit.eq(1000))
    })

    it("should create task", async () => {
      // taskGiver creates a task.
      // they bond part of their deposit.
      tx = await taskExchange.createTask(minDeposit, 0x010203040506070809, [20, 40, 60], 9, DisputeResolutionLayerDummy.address, {from: taskGiver, value: reward})
      bond = await taskExchange.getBondedDeposit.call(0, taskGiver)
      assert(bond.eq(500))
      deposit = await taskExchange.getDeposit.call(taskGiver)
      assert(deposit.eq(500))

      log = tx.logs.find(log => log.event === 'DepositBonded')
      assert(log.args.taskID.eq(0))
      assert.equal(log.args.account, taskGiver)
      assert(log.args.amount.eq(minDeposit))

      log = tx.logs.find(log => log.event === 'TaskCreated')
      assert(log.args.taskID.isZero())
      assert(log.args.minDeposit.eq(minDeposit))

      taskID = log.args.taskID
    })

    it('should timeout with no solver selected', async () => {
      await mineBlocks(web3, 25)

      await taskExchange.timeout(taskID, {from: taskGiver})

      await taskExchange.unbondDeposit(taskID, {from: taskGiver})
    })
  })

  context('timing out with selected solver and no solution submitted', () => {

    before(async () => {
      taskExchange = await TaskExchange.new()
      oldBalance = await web3.eth.getBalance(solver)
      disputeRes = await DisputeResolutionLayerDummy.at(DisputeResolutionLayerDummy.address)
    })

    it("should have participants make deposits", async () => {
      // taskGiver makes a deposit
      await taskExchange.makeDeposit({from: taskGiver, value: 1000})
      deposit = await taskExchange.getDeposit.call(taskGiver)
      assert(deposit.eq(1000))

      // to-be solver makes a deposit
      await taskExchange.makeDeposit({from: solver, value: 1000})
      deposit = await taskExchange.getDeposit.call(solver)
      assert(deposit.eq(1000))

      // to-be verifier makes a deposit
      await taskExchange.makeDeposit({from: verifier, value: 1000})
      deposit = await taskExchange.getDeposit.call(verifier)
      assert(deposit.eq(1000))
    })

    it("should create task", async () => {
      // taskGiver creates a task.
      // they bond part of their deposit.
      tx = await taskExchange.createTask(minDeposit, 0x010203040506070809, [20, 40, 60], 9, DisputeResolutionLayerDummy.address, {from: taskGiver, value: reward})
      bond = await taskExchange.getBondedDeposit.call(0, taskGiver)
      assert(bond.eq(500))
      deposit = await taskExchange.getDeposit.call(taskGiver)
      assert(deposit.eq(500))

      log = tx.logs.find(log => log.event === 'DepositBonded')
      assert(log.args.taskID.eq(0))
      assert.equal(log.args.account, taskGiver)
      assert(log.args.amount.eq(minDeposit))

      log = tx.logs.find(log => log.event === 'TaskCreated')
      assert(log.args.taskID.isZero())
      assert(log.args.minDeposit.eq(minDeposit))

      taskID = log.args.taskID
    })

    it("should select a solver", async () => {
      // solver registers for the task.
      // they bond part of their deposit.
      tx = await taskExchange.registerForTask(taskID, {from: solver})

      log = tx.logs.find(log => log.event === 'DepositBonded')
      assert(log.args.taskID.eq(taskID))
      assert.equal(log.args.account, solver)
      assert(log.args.amount.eq(minDeposit))
      deposit = await taskExchange.getDeposit.call(solver)
      assert(deposit.eq(500))

      log = tx.logs.find(log => log.event === 'SolverSelected')
      assert(log.args.taskID.eq(taskID))
      assert.equal(log.args.solver, solver)
      assert(log.args.minDeposit.eq(minDeposit))
    })

    it('should timeout with solver selected', async () => {
      await mineBlocks(web3, 45)

      await taskExchange.timeout(taskID, {from: taskGiver})

      await taskExchange.unbondDeposit(taskID, {from: taskGiver})
    })
  })

  context('timing out with no selected solver', () => {

    before(async () => {
      taskExchange = await TaskExchange.new()
      oldBalance = await web3.eth.getBalance(solver)
      disputeRes = await DisputeResolutionLayerDummy.at(DisputeResolutionLayerDummy.address)
    })

    it("should have participants make deposits", async () => {
      // taskGiver makes a deposit
      await taskExchange.makeDeposit({from: taskGiver, value: 1000})
      deposit = await taskExchange.getDeposit.call(taskGiver)
      assert(deposit.eq(1000))

      // to-be solver makes a deposit
      await taskExchange.makeDeposit({from: solver, value: 1000})
      deposit = await taskExchange.getDeposit.call(solver)
      assert(deposit.eq(1000))

      // to-be verifier makes a deposit
      await taskExchange.makeDeposit({from: verifier, value: 1000})
      deposit = await taskExchange.getDeposit.call(verifier)
      assert(deposit.eq(1000))
    })

    it("should create task", async () => {
      // taskGiver creates a task.
      // they bond part of their deposit.
      tx = await taskExchange.createTask(minDeposit, 0x010203040506070809, [20, 40, 60], 9, DisputeResolutionLayerDummy.address, {from: taskGiver, value: reward})
      bond = await taskExchange.getBondedDeposit.call(0, taskGiver)
      assert(bond.eq(500))
      deposit = await taskExchange.getDeposit.call(taskGiver)
      assert(deposit.eq(500))

      log = tx.logs.find(log => log.event === 'DepositBonded')
      assert(log.args.taskID.eq(0))
      assert.equal(log.args.account, taskGiver)
      assert(log.args.amount.eq(minDeposit))

      log = tx.logs.find(log => log.event === 'TaskCreated')
      assert(log.args.taskID.isZero())
      assert(log.args.minDeposit.eq(minDeposit))

      taskID = log.args.taskID
    })

    it("should select a solver", async () => {
      // solver registers for the task.
      // they bond part of their deposit.
      tx = await taskExchange.registerForTask(taskID, {from: solver})

      log = tx.logs.find(log => log.event === 'DepositBonded')
      assert(log.args.taskID.eq(taskID))
      assert.equal(log.args.account, solver)
      assert(log.args.amount.eq(minDeposit))
      deposit = await taskExchange.getDeposit.call(solver)
      assert(deposit.eq(500))

      log = tx.logs.find(log => log.event === 'SolverSelected')
      assert(log.args.taskID.eq(taskID))
      assert.equal(log.args.solver, solver)
      assert(log.args.minDeposit.eq(minDeposit))
    })

    it("should commit a solution", async () => {
      // solver commits their solutions.
      tx = await taskExchange.commitSolution(taskID, web3.utils.soliditySha3(0x12345), {from: solver})
      log = tx.logs.find(log => log.event === 'SolutionCommitted')
      assert(log.args.taskID.eq(taskID))
      assert(log.args.minDeposit.eq(minDeposit))
    })

    it('should unbond deposit with solution committed selected', async () => {
      await mineBlocks(web3, 65)

      await taskExchange.finalizeTask(taskID, {from: solver})

      await taskExchange.unbondDeposit(taskID, {from: taskGiver})
    })
  })
})
