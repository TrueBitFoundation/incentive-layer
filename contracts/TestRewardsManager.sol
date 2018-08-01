pragma solidity ^0.4.18;

import "./RewardsManager.sol";

contract TestRewardsManager is RewardsManager {

    constructor (address _tru) RewardsManager(_tru) { }

    function testPayReward(uint taskID, address to) public returns (bool) {
        return payReward(taskID, to);
    }
}
