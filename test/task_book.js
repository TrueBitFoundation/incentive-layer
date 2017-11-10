var TaskBook = artifacts.require('./TaskBook.sol');
var Web3 = require('web3');
var web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));

contract('TaskBook', function(accounts) {
  let taskBook;

  beforeEach(async () => {
      taskBook = await TaskBook.new()
  })

  describe('incentive layer', () => {
    const taskGiver = accounts[1];
    const solver = accounts[2];
    const verifier = accounts[3];

    const minDeposit = 500;
    const randomBits = 12345;

    it("should go through a Task being created, solved, and verified.", async () => {
      let deposit, bond;
      let tx, log;

      // taskGiver makes a deposit
      await taskBook.makeDeposit({from: taskGiver, value: 1000});
      deposit = await taskBook.getDeposit.call(taskGiver);
      assert.equal(deposit.toNumber(), 1000);

      // to-be solver makes a deposit
      await taskBook.makeDeposit({from: solver, value: 1000});
      deposit = await taskBook.getDeposit.call(solver);
      assert.equal(deposit.toNumber(), 1000);
      
      // to-be verifier makes a deposit
      await taskBook.makeDeposit({from: verifier, value: 1000});
      deposit = await taskBook.getDeposit.call(verifier);
      assert.equal(deposit.toNumber(), 1000);

      // taskGiver creates a task.
      // they bond part of their deposit.
      tx = await taskBook.createTask(minDeposit, 0x0, 5, {from: taskGiver});
      bond = await taskBook.getBondedDeposit.call(0, taskGiver);
      assert.equal(bond.toNumber(), 500);
      deposit = await taskBook.getDeposit.call(taskGiver);
      assert.equal(deposit.toNumber(), 500); 
      
      log = tx.logs.find(log => log.event === 'DepositBonded')
      assert.equal(log.args.taskID.toNumber(), 0);
      assert.equal(log.args.account, taskGiver);
      assert.equal(log.args.amount, minDeposit);

      log = tx.logs.find(log => log.event === 'TaskCreated')
      assert.equal(log.args.taskID.toNumber(), 0);
      assert.equal(log.args.minDeposit, minDeposit);
      // TODO: add a test for log.args.blockNumber
      
      const taskID = log.args.taskID.toNumber();
      
      // solver registers for the task.
      // they bond part of their deposit.
      tx = await taskBook.registerForTask(taskID, web3.utils.soliditySha3(randomBits), {from: solver});

      log = tx.logs.find(log => log.event === 'DepositBonded')
      assert.equal(log.args.taskID.toNumber(), taskID);
      assert.equal(log.args.account, solver);
      assert.equal(log.args.amount, minDeposit);
      deposit = await taskBook.getDeposit.call(solver);
      assert.equal(deposit.toNumber(), 500); 

      log = tx.logs.find(log => log.event === 'SolverSelected')
      assert.equal(log.args.taskID.toNumber(), taskID);
      assert.equal(log.args.solver, solver);
      assert.equal(log.args.taskData, 0x0);
      assert.equal(log.args.minDeposit, minDeposit);
      assert.equal(log.args.randomBitsHash, web3.utils.soliditySha3(randomBits));

      // solver commits their solutions.
      tx = await taskBook.commitSolution(taskID, web3.utils.soliditySha3(0x0), web3.utils.soliditySha3(0x12345), {from: solver})
      log = tx.logs.find(log => log.event === 'SolutionsCommitted')
      assert.equal(log.args.taskID.toNumber(), taskID);
      assert.equal(log.args.minDeposit, minDeposit);

      // verifier commits a challenge
      // they bond part of their deposit.
      const intent = 2;
      tx = await taskBook.commitChallenge(taskID, web3.utils.soliditySha3(intent), {from: verifier})
      log = tx.logs.find(log => log.event === 'DepositBonded')
      assert.equal(log.args.taskID.toNumber(), taskID);
      assert.equal(log.args.account, verifier);
      assert.equal(log.args.amount, minDeposit);
      deposit = await taskBook.getDeposit.call(verifier);
      assert.equal(deposit.toNumber(), 500); 

      // taskGiver triggers task state transition
      tx = await taskBook.changeTaskState(taskID, 3, {from: taskGiver});
      log = tx.logs.find(log => log.event === 'TaskStateChange')
      assert.equal(log.args.taskID.toNumber(), taskID);
      assert.equal(log.args.state.toNumber(), 3);

      // state 3: challenges accepted
      // verifier reveals their intent
      await taskBook.revealIntent(taskID, intent, {from: verifier})

      // taskGiver triggers task  state transition
      tx = await taskBook.changeTaskState(taskID, 4, {from: taskGiver});
      log = tx.logs.find(log => log.event === 'TaskStateChange')
      assert.equal(log.args.taskID.toNumber(), taskID);
      assert.equal(log.args.state.toNumber(), 4);

      // state 4: intents revealed
      tx = await taskBook.revealSolution(taskID, true, randomBits, {from: solver});
      log = tx.logs.find(log => log.event === 'SolutionRevealed')
      assert.equal(log.args.taskID.toNumber(), taskID);
      assert.equal(log.args.randomBits.toNumber(), randomBits);

      // task giver trigger's solution verification
      await taskBook.verifySolution(taskID, 12345, {from: taskGiver});

    });
  });  
});
