 var Requester = artifacts.require("./ExampleRequester.sol");
 var Truebit = artifacts.require("./Truebit.sol"); contract('Requester Integration', function(accounts) {
   it("get instance, check truebit address", function() {
     var truebit, requester, dataRoot, minDeposit, value, taskIndex0, globalRoot0, solutions0
     return Truebit.deployed().then(function(_truebit) {
       truebit = _truebit
       return Requester.deployed()
     }).then(function(_requester) {
       requester = _requester
       return requester.truebit.call()
     }).then(function(_trubitAddress) {
       assert.equal(truebit.address, _trubitAddress, "Wrong truebit address in requester contract");
       dataRoot = "0x0000000000000000000000000000000000000000000000000012345678901234"
       minDeposit = 1000000000000000000 //1 ETH
       value = 1000000000
       return requester.createTask(dataRoot, minDeposit, {value: value, from: accounts[0]});
     }).then(function(tx) {
       taskIndex0 = 0 // zeroith task in truebit contract
       globalRoot0 = "0x0000000000000000000000000000000000000000123456789012340000000000"
       solution0 =   "0x0000000000000000000000000000000000000000000000000000000000000007"
       return requester.tasks(taskIndex0);
     }).then(function(task0) {
       assert.equal(task0, "0x0000000000000000000000000000000000000000000000000000000000000000")
       return truebit.getTask(taskIndex0);
     }).then(function(task0) {
       assert.equal(task0[0], dataRoot)
       assert.equal(task0[1], requester.address)
       assert.equal(task0[2].toNumber(), minDeposit)
       assert.isAbove(task0[3].toNumber(), 1, "'gasLimit'")
       assert.isFalse(task0[4], "'solved'")
       assert.isFalse(task0[5], "'proccessed'")
       assert.equal(task0[6], "0x0000000000000000000000000000000000000000000000000000000000000000", "globalRoot")
       assert.equal(task0[7], "0x0000000000000000000000000000000000000000000000000000000000000000", "solution")
       return truebit.cheatSolve(taskIndex0, globalRoot0, solution0, {from: accounts[0]});
     }).then(function(tx) {
       return truebit.getTask(taskIndex0);
     }).then(function(task0) {
       assert.isTrue(task0[4], "'solved'")
       assert.equal(task0[6], globalRoot0)
       assert.equal(task0[7], solution0)
       return truebit.proccessTask(taskIndex0, {from: accounts[0]});
     }).then(function(tx) {
       return truebit.getTask(taskIndex0);
     }).then(function(task0) {
       assert.isTrue(task0[5], "'proccessed'")
       return requester.tasks(taskIndex0);
     }).then(function(requesterSolution) {
       assert.equal(requesterSolution, solution0)
       return
     });
   });
 });
