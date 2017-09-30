var TaskGiver = artifacts.require("./TaskGiver.sol");
var Truebit = artifacts.require("./Truebit.sol");
const util = require('util');
const setTimeoutPromise = util.promisify(setTimeout);

module.exports = function(address) {
	this.address = address;
	this.taskGiver = null;
	this.truebit = null;
	this.postBidEvent = null;
	this.solvers = [];

	//Set all values that derive from promises
	this.initialize = function() {
		return new Promise(function(resolve, reject) {
			TaskGiver.at(address).then(function(_tg) {
				this.taskGiver = _tg;
				return this.taskGiver;
			}).then(function(_tg) {
				return _tg.truebit.call();
			}).then(function(tb_address) {
				return Truebit.at(tb_address);
			}).then(function(tb) {
				this.truebit = tb;
				return this.truebit;
			}).then(function(tb) {
				this.postBidEvent = this.truebit.PostBid()
				return
			});
			resolve(this);
		});
	}

	this.randomlyChooseSolver = function() {
		return solvers[Math.random() * solvers.length]
	}

	this.startBiddingTime = function(timeout) {
		setTimeoutPromise(timeout, function() {
			this.postBidEvent.stopWatching();
			return randomlyChooseSolver()
		});
	}

	this.addSolver = function(address) {
		this.solvers.push(address);
	}

}