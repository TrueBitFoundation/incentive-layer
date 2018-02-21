pragma solidity ^0.4.4;

import 'zeppelin-solidity/contracts/math/SafeMath.sol';

contract JackpotManager {
  using SafeMath for uint;

  mapping(address => uint) public deposits;
  uint public jackpot;

  event JackpotIncreased(uint amount);

  function JackpotManager() public {

  }

  // @dev – returns the current jackpot
  // @return – the jackpot.
  function getJackpot() constant public returns (uint) {
    return jackpot;
  }

  // @dev – allows a uer to donate to the jackpot.
  // @return – the updated jackpot amount.
  function donateToJackpot() public payable returns (uint) {
    jackpot = jackpot.add(msg.value);
    JackpotIncreased(msg.value);
    return jackpot;
  }
}