var Truebit = artifacts.require("./Truebit.sol");

contract('Truebit', function(accounts) {
  it("get instance", function() {
    return Truebit.deployed().then(function(instance) {

    });
  });
});
