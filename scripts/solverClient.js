var Web3 = require('web3');
var web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
var Solver = artifacts.require("./Solver.sol");

module.exports = function(address) {
	this.address = address;
	this.r = null;

	this.getBlockHash = function() {
		return web3.eth.getBlock(web3.eth.blockNumber).hash;
	}
}