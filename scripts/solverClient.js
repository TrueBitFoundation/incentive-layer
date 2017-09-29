var Web3 = require('web3');
var web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
var Solver = artifacts.require("./Solver.sol");
var crypto = require('crypto');

module.exports = function() {
	this.r = null;

	this.submitRandomHash = function() {
		this.r = crypto.randomBytes(10).toString('hex');
		return web3.sha3(web3.eth.getBlock(web3.eth.blockNumber).hash + this.r);
	}
}