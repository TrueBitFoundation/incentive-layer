var TaskBook = artifacts.require("./TaskBook.sol");

module.exports = function(deployer, network, thing) {
  deployer.deploy(TaskBook);
};
