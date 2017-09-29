var Web3 = require('web3');
var web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
var Solver = artifacts.require("./Solver.sol");
var crypto = require('crypto');

module.exports = function(address) {
	this.r = null;
	this.hash = null;
	this.address = address;
	this.solver = Solver.at(address);

	//Create hash of random bytes and hash of last block
	this.createRandomHash = function() {
		this.r = crypto.randomBytes(10).toString('hex');
		this.hash = web3.sha3(web3.eth.getBlock(web3.eth.blockNumber).hash + this.r);
		return this.hash;
	}

	//Check if hash is even or odd
	this.submittingCorrectSolution = function() {
		return parseInt(this.hash, 16) % 2 == 0;
	}
}