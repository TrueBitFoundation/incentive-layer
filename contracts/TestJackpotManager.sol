pragma solidity ^0.4.18;

import "./JackpotManager.sol";

contract TestJackpotManager is JackpotManager {
    function distributeJackpot(address[] challengers) public {
        setJackpotReceivers(challengers);
    }
}
