pragma solidity ^0.4.18;

import "./JackpotManager.sol";

contract TestJackpotManager is JackpotManager {
   
    constructor (address _TRU) JackpotManager(_TRU) { }

    function distributeJackpot(address[] challengers) public {
        setJackpotReceivers(challengers);
    }
}
