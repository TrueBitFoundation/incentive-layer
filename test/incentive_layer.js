var IncentiveLayer = artifacts.require('./IncentiveLayer.sol');
var Web3 = require('web3');
var web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));

contract('TBIncentiveLayer', function(accounts) {
  let incentiveLayer, deposit, bond, tx, log, taskID, intent;

  const taskGiver = accounts[1];
  const solver = accounts[2];
  const verifier = accounts[3];

  const minDeposit = 500;
  const reward = 500;
  const randomBits = 12345;

  context('incentive layer', () => {

    before(async () => {
      incentiveLayer = await IncentiveLayer.new()
    })

    it("should have participants make deposits", async () => {
      // taskGiver makes a deposit
      await incentiveLayer.makeDeposit({from: taskGiver, value: 1000});
      deposit = await incentiveLayer.getDeposit.call(taskGiver);
      assert.equal(deposit.toNumber(), 1000);

      // to-be solver makes a deposit
      await incentiveLayer.makeDeposit({from: solver, value: 1000});
      deposit = await incentiveLayer.getDeposit.call(solver);
      assert.equal(deposit.toNumber(), 1000);
      
      // to-be verifier makes a deposit
      await incentiveLayer.makeDeposit({from: verifier, value: 1000});
      deposit = await incentiveLayer.getDeposit.call(verifier);
      assert.equal(deposit.toNumber(), 1000);
    })

    it("should create task", async () => {
      // taskGiver creates a task.
      // they bond part of their deposit.
      tx = await incentiveLayer.createTask(minDeposit, reward, 0x0, 5, {from: taskGiver});
      bond = await incentiveLayer.getBondedDeposit.call(0, taskGiver);
      assert.equal(bond.toNumber(), 500);
      deposit = await incentiveLayer.getDeposit.call(taskGiver);
      assert.equal(deposit.toNumber(), 500); 
      
      log = tx.logs.find(log => log.event === 'DepositBonded')
      assert.equal(log.args.taskID.toNumber(), 0);
      assert.equal(log.args.account, taskGiver);
      assert.equal(log.args.amount, minDeposit);

      log = tx.logs.find(log => log.event === 'TaskCreated')
      assert.equal(log.args.taskID.toNumber(), 0);
      assert.equal(log.args.minDeposit, minDeposit); 
      assert.equal(log.args.blockNumber.toNumber(), 5);
      assert.equal(log.args.reward.toNumber(), reward);
      
      taskID = log.args.taskID.toNumber();
    })

    it("should select a solver", async () => {
      // solver registers for the task.
      // they bond part of their deposit.
      tx = await incentiveLayer.registerForTask(taskID, web3.utils.soliditySha3(randomBits), {from: solver});

      log = tx.logs.find(log => log.event === 'DepositBonded')
      assert.equal(log.args.taskID.toNumber(), taskID);
      assert.equal(log.args.account, solver);
      assert.equal(log.args.amount, minDeposit);
      deposit = await incentiveLayer.getDeposit.call(solver);
      assert.equal(deposit.toNumber(), 500); 

      log = tx.logs.find(log => log.event === 'SolverSelected')
      assert.equal(log.args.taskID.toNumber(), taskID);
      assert.equal(log.args.solver, solver);
      assert.equal(log.args.taskData, 0x0);
      assert.equal(log.args.minDeposit, minDeposit);
      assert.equal(log.args.randomBitsHash, web3.utils.soliditySha3(randomBits));
    })

    it("should commit a solution", async () => {
      // solver commits their solutions.
      tx = await incentiveLayer.commitSolution(taskID, web3.utils.soliditySha3(0x0), web3.utils.soliditySha3(0x12345), {from: solver})
      log = tx.logs.find(log => log.event === 'SolutionsCommitted')
      assert.equal(log.args.taskID.toNumber(), taskID);
      assert.equal(log.args.minDeposit, minDeposit);
    })

    it("should commit a challenge", async () => {
      // verifier commits a challenge
      // they bond part of their deposit.
      intent = 0;
      tx = await incentiveLayer.commitChallenge(taskID, web3.utils.soliditySha3(intent), {from: verifier})
      log = tx.logs.find(log => log.event === 'DepositBonded')
      assert.equal(log.args.taskID.toNumber(), taskID);
      assert.equal(log.args.account, verifier);
      assert.equal(log.args.amount, minDeposit);
      deposit = await incentiveLayer.getDeposit.call(verifier);
      assert.equal(deposit.toNumber(), 500);

      // taskGiver triggers task state transition
      tx = await incentiveLayer.changeTaskState(taskID, 3, {from: taskGiver});
      log = tx.logs.find(log => log.event === 'TaskStateChange')
      assert.equal(log.args.taskID.toNumber(), taskID);
      assert.equal(log.args.state.toNumber(), 3);
    })

    it("should reveal intent", async () => {
      // state 3: challenges accepted
      // verifier reveals their intent
      await incentiveLayer.revealIntent(taskID, intent, {from: verifier})

      // taskGiver triggers task  state transition
      tx = await incentiveLayer.changeTaskState(taskID, 4, {from: taskGiver});
      log = tx.logs.find(log => log.event === 'TaskStateChange')
      assert.equal(log.args.taskID.toNumber(), taskID);
      assert.equal(log.args.state.toNumber(), 4);
    })

    it("should reveal and verify solution", async () => {

      // state 4: intents revealed
      tx = await incentiveLayer.revealSolution(taskID, true, randomBits, {from: solver});
      log = tx.logs.find(log => log.event === 'SolutionRevealed')
      assert.equal(log.args.taskID.toNumber(), taskID);
      assert.equal(log.args.randomBits.toNumber(), randomBits);

      // task giver trigger's solution verification
      await incentiveLayer.verifySolution(taskID, 12345, {from: taskGiver});
    });
  });  
});
