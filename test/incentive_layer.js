const IncentiveLayer = artifacts.require('./IncentiveLayer.sol')
const TRU = artifacts.require('./TRU.sol')
const ExchangeRateOracle = artifacts.require('./ExchangeRateOracle.sol')
const DisputeResolutionLayer = artifacts.require('./DisputeResolutionLayerDummy.sol')
const Web3 = require('web3')
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"))

const timeout = require('./helpers/timeout')
const mineBlocks = require('./helpers/mineBlocks')

const BigNumber = require('bignumber.js')

contract('IncentiveLayer', function(accounts) {
    let incentiveLayer, deposit, bond, tx, log, taskID, intent, oldBalance, token, oracle, balance

    const taskGiver = accounts[1]
    const solver = accounts[2]
    const verifier = accounts[3]
    const randomUser = accounts[4]
    const backupSolver = accounts[5]
    const oracleOwner = accounts[6]

    const minDeposit = 100000
    const maxDifficulty = 50000
    //const reward = web3.utils.toWei('1', 'ether')
    const reward = 100000000
    const randomBits = 12345
    const TRUperUSD = 2000

    context('incentive layer', () => {

        before(async () => {
            token = await TRU.new({from: accounts[5]}); 
            oracle = await ExchangeRateOracle.new({from: oracleOwner});
	    disputeResolutionLayer = await DisputeResolutionLayer.new({from: accounts[5]})
            incentiveLayer = await IncentiveLayer.new(token.address, oracle.address, disputeResolutionLayer.address);
            await token.transferOwnership(incentiveLayer.address, {from: accounts[5]})
            let owner = await token.owner();
            assert.equal(owner, incentiveLayer.address);


            oldBalance = await web3.eth.getBalance(solver)

            tx = await oracle.updateExchangeRate(TRUperUSD, {from: oracleOwner})
            await token.sendTransaction({from: taskGiver, value: web3.utils.toWei('1', 'ether')}) 
            await token.sendTransaction({from: solver, value: web3.utils.toWei('1', 'ether')}) 
            await token.sendTransaction({from: verifier, value: web3.utils.toWei('1', 'ether')}) 

            await token.approve(incentiveLayer.address, reward + (minDeposit * 5), {from: taskGiver})
            await token.approve(incentiveLayer.address, minDeposit, {from: solver})
            await token.approve(incentiveLayer.address, minDeposit, {from: verifier})

        })

        it("should have participants make deposits", async () => {
            // taskGiver makes a deposit to fund taxes
            //await incentiveLayer.makeDeposit(reward + (minDeposit * 5), {from: taskGiver})
            await incentiveLayer.makeDeposit(minDeposit * 5, {from: taskGiver})
            deposit = await incentiveLayer.getDeposit.call(taskGiver)
            //assert(deposit.eq(reward + (minDeposit * 5)))
            assert(deposit.eq(minDeposit * 5))
            let layerBalance = await token.balanceOf(incentiveLayer.address);
            assert(layerBalance.eq(minDeposit * 5));

            // to-be solver makes a deposit
            await incentiveLayer.makeDeposit(minDeposit, {from: solver})
            deposit = await incentiveLayer.getDeposit.call(solver)
            assert(deposit.eq(minDeposit))

            // to-be verifier makes a deposit
            await incentiveLayer.makeDeposit(minDeposit, {from: verifier})
            deposit = await incentiveLayer.getDeposit.call(verifier)
            assert(deposit.eq(minDeposit))
        })

        it("should create task", async () => {
            // taskGiver creates a task.
            // they bond part of their deposit.
            tx = await incentiveLayer.createTask(0x0, 0, 0, 0x0, maxDifficulty, reward, {from: taskGiver})

            //log = tx.logs.find(log => log.event === 'DepositBonded')
            //assert(log.args.taskID.eq(0))
            //assert.equal(log.args.account, taskGiver)
            //assert(log.args.amount.eq(minDeposit))

            log = tx.logs.find(log => log.event === 'TaskCreated')
            assert(log.args.taskID.isZero())
            assert(log.args.minDeposit.eq(minDeposit))
            //assert(log.args.blockNumber.eq(5))
            assert(log.args.reward.eq(reward))
            assert(log.args.tax.eq(minDeposit * 5))
	    assert(log.args.codeType.eq(0))
	    assert(log.args.storageType.eq(0))
	    assert(log.args.storageAddress == 0x0)

            deposit = await incentiveLayer.getDeposit.call(taskGiver)
            assert(deposit.eq(minDeposit * 5))

            taskID = log.args.taskID
            balance = await incentiveLayer.getTaskReward.call(taskID)
            assert(balance.eq(reward))
        })

        it("should select a solver", async () => {
            // solver registers for the task.
            // they bond part of their deposit.
            tx = await incentiveLayer.registerForTask(taskID, web3.utils.soliditySha3(randomBits), {from: solver})

            log = tx.logs.find(log => log.event === 'DepositBonded')
            assert(log.args.taskID.eq(taskID))
            assert.equal(log.args.account, solver)
            assert(log.args.amount.eq(minDeposit))
            deposit = await incentiveLayer.getDeposit.call(solver)
            assert(deposit.eq(0))

            log = tx.logs.find(log => log.event === 'SolverSelected')
            assert(log.args.taskID.eq(taskID))
            assert.equal(log.args.solver, solver)
            assert.equal(log.args.taskData, 0x0)
            assert(log.args.minDeposit.eq(minDeposit))
            assert.equal(log.args.randomBitsHash, web3.utils.soliditySha3(randomBits))

            deposit = await incentiveLayer.getDeposit.call(taskGiver)
            assert(deposit.eq(0))
        })

        it("should commit a solution", async () => {
            // solver commits their solutions.
            tx = await incentiveLayer.commitSolution(taskID, web3.utils.soliditySha3(0x0), web3.utils.soliditySha3(0x12345), {from: solver})
            log = tx.logs.find(log => log.event === 'SolutionsCommitted')
            assert(log.args.taskID.eq(taskID))
            assert(log.args.minDeposit.eq(minDeposit))
        })

        it("should commit a challenge", async () => {
            // verifier commits a challenge
            // they bond part of their deposit.
            intent = 0
            tx = await incentiveLayer.commitChallenge(taskID, web3.utils.soliditySha3(intent), {from: verifier})
            log = tx.logs.find(log => log.event === 'DepositBonded')
            assert(log.args.taskID.eq(taskID))
            assert.equal(log.args.account, verifier)
            assert(log.args.amount.eq(minDeposit))
            deposit = await incentiveLayer.getDeposit.call(verifier)
            assert(deposit.eq(0))
	})

	it("should change task state to 3", async () => {

            await mineBlocks(web3, 20)	    

            // solver triggers task state transition as he wants solution to be finalized
            tx = await incentiveLayer.changeTaskState(taskID, 3, {from: solver})
            log = tx.logs.find(log => log.event === 'TaskStateChange')
            assert(log.args.taskID.eq(taskID))
            assert(log.args.state.eq(3))
        })

        it("should reveal intent", async () => {
            // state 3: challenges accepted
            // verifier reveals their intent
            await incentiveLayer.revealIntent(taskID, intent, {from: verifier})

            await mineBlocks(web3, 10)

            // verifier triggers task  state transition as they want to challenge
            tx = await incentiveLayer.changeTaskState(taskID, 4, {from: verifier})
            log = tx.logs.find(log => log.event === 'TaskStateChange')
            assert(log.args.taskID.eq(taskID))
            assert(log.args.state.eq(4))
        })

        it("should reveal solution", async () => {

            // state 4: intents revealed
            tx = await incentiveLayer.revealSolution(taskID, true, randomBits, {from: solver})
            log = tx.logs.find(log => log.event === 'SolutionRevealed')
            if(log) {
                assert(log.args.taskID.eq(taskID))
                assert(log.args.randomBits.eq(randomBits))
            } else {
                assert((await incentiveLayer.getTaskFinality.call(taskID)).eq(2))
            }
        })

        it('should run verification game', async () => {
            tx = await incentiveLayer.runVerificationGame(taskID, {from: verifier})
        
            log = tx.logs.find(log => log.event == 'VerificationGame')
            assert.equal(log.args.solver, solver)
            assert(log.args.currentChallenger.eq(1))

            oldBalance = await token.balanceOf(solver)
            
            tx = await incentiveLayer.finalizeTask(taskID, {from: taskGiver})

            log = tx.logs.find(log => log.event = 'RewardClaimed')
            assert(log.args.task.eq(taskID))
            assert.equal(log.args.who, solver)
            assert(log.args.amount.eq(reward))

            newBalance = await token.balanceOf(solver);
            assert(newBalance.gt(oldBalance))

            assert((await incentiveLayer.getTaskFinality.call(taskID)).eq(1))
        })

        it('should unbond solver deposit', async () => {
            await incentiveLayer.unbondDeposit(taskID, {from: solver})
            assert((await incentiveLayer.getDeposit.call(solver)).eq(minDeposit))
        })

//        it('should unbond task giver deposit', async () => {
//          await incentiveLayer.unbondDeposit(taskID, {from: taskGiver})
//          assert((await incentiveLayer.getDeposit.call(taskGiver)).eq(minDeposit))
//        })

        it('should unbond verifier deposit', async () => {
          await incentiveLayer.unbondDeposit(taskID, {from: verifier})
          //assert((await incentiveLayer.getDeposit.call(verifier)).eq(0))
        })

        it('should be higher than original balance', async () => {
          const newBalance = await web3.eth.getBalance(solver)

          assert((new BigNumber(oldBalance)).isLessThan(new BigNumber(newBalance)))
        })
    })

    context('arbit penalty', () => {
        before(async () => {
            //token = await TRU.new();
            //oracle = await ExchangeRateOracle.new({from: oracleOwner})
            //await oracle.updateExchangeRate(2000, {from: oracleOwner})
            //incentiveLayer = await IncentiveLayer.new(token.address, oracle.address)
            //oldBalance = await web3.eth.getBalance(solver)
            
            token = await TRU.new({from: accounts[5]})
            oracle = await ExchangeRateOracle.new({from: oracleOwner})
	    disputeResolutionLayer = await DisputeResolutionLayer.new({from: accounts[5]})
            incentiveLayer = await IncentiveLayer.new(token.address, oracle.address, disputeResolutionLayer.address)
            await token.transferOwnership(incentiveLayer.address, {from: accounts[5]})
            let owner = await token.owner()
            assert.equal(owner, incentiveLayer.address)


            oldBalance = await web3.eth.getBalance(solver)

            tx = await oracle.updateExchangeRate(TRUperUSD, {from: oracleOwner})
            await token.sendTransaction({from: taskGiver, value: web3.utils.toWei('1', 'ether')}) 
            await token.sendTransaction({from: solver, value: web3.utils.toWei('1', 'ether')}) 
            await token.sendTransaction({from: verifier, value: web3.utils.toWei('1', 'ether')}) 
            await token.sendTransaction({from: backupSolver, value: web3.utils.toWei('1', 'ether')}) 

            await token.approve(incentiveLayer.address, reward + (minDeposit * 5), {from: taskGiver})
            await token.approve(incentiveLayer.address, minDeposit, {from: solver})
            await token.approve(incentiveLayer.address, minDeposit, {from: verifier})
            await token.approve(incentiveLayer.address, minDeposit, {from: backupSolver})

        })
        it("should have participants make deposits", async () => {
            // taskGiver makes a deposit to fund taxes
            await incentiveLayer.makeDeposit(minDeposit * 5, {from: taskGiver})
            deposit = await incentiveLayer.getDeposit.call(taskGiver)
            assert(deposit.eq(minDeposit * 5))
            let layerBalance = await token.balanceOf(incentiveLayer.address);
            assert(layerBalance.eq(minDeposit * 5))

            // to-be solver makes a deposit
            await incentiveLayer.makeDeposit(minDeposit, {from: solver})
            deposit = await incentiveLayer.getDeposit.call(solver)
            assert(deposit.eq(minDeposit))

            // to-be verifier makes a deposit
            await incentiveLayer.makeDeposit(minDeposit, {from: verifier})
            deposit = await incentiveLayer.getDeposit.call(verifier)
            assert(deposit.eq(minDeposit))

            // to-be backup solver makes a deposit
            await incentiveLayer.makeDeposit(minDeposit, {from: backupSolver})
            deposit = await incentiveLayer.getDeposit.call(backupSolver)
            assert(deposit.eq(minDeposit))
        })

        it("should create task", async () => {
            // taskGiver creates a task.
            // they bond part of their deposit.
	    tx = await incentiveLayer.createTask(0x0, 0, 0, 0x0, maxDifficulty, reward, {from: taskGiver})            
            //log = tx.logs.find(log => log.event === 'DepositBonded')
            //assert(log.args.taskID.eq(0))
            //assert.equal(log.args.account, taskGiver)
            //assert(log.args.amount.eq(maxDifficulty * 2))

            log = tx.logs.find(log => log.event === 'TaskCreated')

            taskID = log.args.taskID
        })

        it("should select a solver", async () => {
            // solver registers for the task.
            // they bond part of their deposit.
            tx = await incentiveLayer.registerForTask(taskID, web3.utils.soliditySha3(randomBits), {from: solver})

            log = tx.logs.find(log => log.event === 'DepositBonded')
            assert(log.args.taskID.eq(taskID))
            assert.equal(log.args.account, solver)
            assert(log.args.amount.eq(minDeposit))
            deposit = await incentiveLayer.getDeposit.call(solver)
            assert(deposit.eq(0))

            log = tx.logs.find(log => log.event === 'SolverSelected')
            assert(log.args.taskID.eq(taskID))
            assert.equal(log.args.solver, solver)
            assert.equal(log.args.taskData, 0x0)
            assert(log.args.minDeposit.eq(minDeposit))
            assert.equal(log.args.randomBitsHash, web3.utils.soliditySha3(randomBits))

            deposit = await incentiveLayer.getDeposit.call(taskGiver)
            assert(deposit.eq(0))
        })

        it("solver penalized for revealling random bits", async () => {
            deposit = await incentiveLayer.getBondedDeposit.call(taskID, solver)
            assert(deposit.eq(minDeposit))       

            oldDeposit = await incentiveLayer.getDeposit(randomUser)

            // random user submits random bits pre-image
            tx = await incentiveLayer.prematureReveal(taskID, randomBits, {from: randomUser})
            
            log = tx.logs.find(log => log.event == 'SolverDepositBurned')
            assert(log.args.taskID.eq(taskID))
            assert.equal(log.args.solver, solver)
            
            log = tx.logs.find(log => log.event == 'TaskCreated')
            assert(log.args.taskID.isZero())
            assert(log.args.minDeposit.eq(minDeposit))
            //assert(log.args.blockNumber.eq(5))
            assert(log.args.reward.eq(reward))

            deposit = await incentiveLayer.getBondedDeposit.call(taskID, solver)
            assert(deposit.eq(0))

            newDeposit = await incentiveLayer.getDeposit.call(randomUser)
            assert(newDeposit.gt(oldDeposit))
        })

        it('new solver should be selected', async () => {
            tx = await incentiveLayer.registerNewSolver(taskID, web3.utils.soliditySha3(randomBits), {from: backupSolver})
            log = tx.logs.find(log => log.event === 'DepositBonded')
            assert(log.args.taskID.eq(taskID))
            assert.equal(log.args.account, backupSolver)
            assert(log.args.amount.eq(minDeposit))
            deposit = await incentiveLayer.getDeposit.call(backupSolver)
            assert(deposit.eq(0))
            
            log = tx.logs.find(log => log.event === 'SolverSelected')
            assert(log.args.taskID.eq(taskID))
            assert.equal(log.args.solver, backupSolver)
            assert.equal(log.args.taskData, 0x0)
            assert(log.args.minDeposit.eq(minDeposit))
            assert.equal(log.args.randomBitsHash, web3.utils.soliditySha3(randomBits))
        })
    })
})
