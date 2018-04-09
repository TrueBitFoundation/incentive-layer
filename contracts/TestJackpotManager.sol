pragma solidity ^0.4.18;

import "./JackpotManager.sol";

contract TestJackpotManager is JackpotManager {
    function distributeJackpot(address[] receivers0, address[] receivers1) public {
        setJackpotReceivers(receivers0, receivers1);
    }
}