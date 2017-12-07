
const TBIncentiveLayer = artifacts.require('TBIncentiveLayer.sol');
const Web3 = require('web3');
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));

contract('DepositsManager', function(accounts) {
  let depositsManager;

  beforeEach(async () => {
      depositsManager = await TBIncentiveLayer.new()
  })
  
  describe('fallback', () => {
    it('should make a deposit', async () => {
      // TODO: this is throwing an 'invalid opcode' error.
      // Seems like it might be an issue with testrpc
      // https://github.com/ethereumjs/testrpc/issues/84

      // const tx = await web3.eth.sendTransaction({to: depositsManager.address, from: accounts[1], value: web3.toWei(1, 'ether')});
      // const deposit = await depositsManager.getDeposit.call(accounts[1]);
      // assert.equal(deposit.toNumber(), 1);
      return;
    });
  })

  describe('makeDeposit', () => {
    it('should make a deposit', async () => {
      let tx;

      tx = await depositsManager.makeDeposit({from: accounts[1], value: 1000});
      log = tx.logs.find(log => log.event === 'DepositMade')
      assert.equal(log.args.who, accounts[1]);
      assert.equal(log.args.amount, 1000);

      const deposit = await depositsManager.getDeposit.call(accounts[1]);
      assert.equal(deposit.toNumber(), 1000);
    });
  })

  describe('withdrawDeposit', () => {
    it("should withdraw the desired amount from the account's deposit", async () => {
      let deposit;

      // make a deposit
      await depositsManager.makeDeposit({from: accounts[1], value: 1000});
      deposit = await depositsManager.getDeposit.call(accounts[1]);
      assert.equal(deposit.toNumber(), 1000);

      // withdraw part of the deposit
      const tx = await depositsManager.withdrawDeposit(500, {from: accounts[1]});
      log = tx.logs.find(log => log.event === 'DepositWithdrawn')
      assert.equal(log.args.who, accounts[1]);
      assert.equal(log.args.amount.toNumber(), 500);
      
      deposit = await depositsManager.getDeposit.call(accounts[1]);
      assert.equal(deposit.toNumber(), 500);
    });

    it("should throw an error if withdrawing more than existing deposit", async () => { 
      let deposit;

      // make a deposit
      await depositsManager.makeDeposit({from: accounts[1], value: 1000});
      deposit = await depositsManager.getDeposit.call(accounts[1]);
      assert.equal(deposit.toNumber(), 1000);

      // withdraw part of the deposit
      try {
        await depositsManager.withdrawDeposit(2000, {from: accounts[1]})
      } catch(error) {
        assert.match(error, /VM Exception [a-zA-Z0-9 ]+/);
      }

      // deposit should not have changed.
      deposit = await depositsManager.getDeposit.call(accounts[1]);
      assert.equal(deposit.toNumber(), 1000);
    });
  });
  
  describe('donateToJackpot', () => {
    it('should donate to the jackpot', async () => {
      const tx = await depositsManager.donateToJackpot({from: accounts[1], value: 1000});
      log = tx.logs.find(log => log.event === 'JackpotIncreased')
      assert.equal(log.args.amount.toNumber(), 1000);

      const jackpot = await depositsManager.getJackpot.call();
      assert.equal(jackpot.toNumber(), 1000);
    });
  })
});

