var TaskGiver = artifacts.require("./TaskGiver.sol");

contract('TaskGiver', function(accounts) {
  it("get instance", function() {
    return TaskGiver.deployed().then(function(instance) {

    });
  });
});