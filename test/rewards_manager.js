const TRU = artifacts.require('TRU.sol');
const RewardsManager = artifacts.require('./TestRewardsManager.sol');
const Web3 = require('web3');
const web3 = new Web3(Web3.providers.HttpProvider('http://localhost:8545'));

contract('RewardsManager', function (accounts) {
    let rewardsManager, token, tx, log, oldBalance, newBalance

    const user = accounts[1];
    const depositAmount = 1000;
    const taskID = 12345;
    const payee = accounts[2];

    before (async() => {
        token = await TRU.new({from: accounts[0]})
        rewardsManager = await RewardsManager.new(token.address, {from: accounts[0]})
        await token.sendTransaction({from: user, value: web3.utils.toWei('1', 'ether')})
        await token.approve(rewardsManager.address, depositAmount, {from: user})
    })


    it ('Should make deposit', async () => {
        oldBalance = await token.balanceOf(user)

        tx = await rewardsManager.depositReward(taskID, depositAmount, {from: user})
    
        log = tx.logs.find(log => log.event == 'RewardDeposit')
        assert(log.args.task.eq(taskID))
        assert.equal(log.args.who, user)
        assert(log.args.amount.eq(depositAmount))

        newBalance = await token.balanceOf(user)

        assert(newBalance.lt(oldBalance))
    })

    it('should pay out reward for task', async () => {
        oldBalance = await token.balanceOf(payee)

        tx = await rewardsManager.testPayReward(taskID, payee, {from: accounts[0]})
    
        log = tx.logs.find(log => log.event == 'RewardClaimed')
        assert(log.args.task.eq(taskID))
        assert.equal(log.args.who, payee)
        assert(log.args.amount.eq(depositAmount))

        newBalance = await token.balanceOf(payee)

        assert(newBalance.gt(oldBalance))
    }) 

})
