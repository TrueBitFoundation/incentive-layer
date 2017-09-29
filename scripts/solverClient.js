var Web3 = require('web3');
var web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));

module.exports = function(address) {
	this.address = address;
	this.getBlockHash = function() {
		return web3.eth.getBlock(web3.eth.blockNumber).hash;
	}
}