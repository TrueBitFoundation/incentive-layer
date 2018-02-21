pragma solidity ^0.4.4;

import 'zeppelin-solidity/contracts/math/SafeMath.sol';

contract JackpotManager {
  using SafeMath for uint;

  struct Jackpot {
    uint finalAmount;
    uint amount;
    address[] receivers0;
    address[] receivers1;
    uint redeemedCount;
  }

  mapping(uint => Jackpot) jackpots;//keeps track of versions of jackpots

  uint internal currentJackpotID;

  event JackpotIncreased(uint amount);

  // @dev – returns the current jackpot
  // @return – the jackpot.
  function getJackpotAmount() constant public returns (uint) {
    return jackpots[currentJackpotID].amount;
  }

  function getCurrentJackpotID() constant public returns (uint) {
    return currentJackpotID;
  }

  // @dev – allows a uer to donate to the jackpot.
  // @return – the updated jackpot amount.
  function donateToJackpot() public payable {
    jackpots[currentJackpotID].amount = jackpots[currentJackpotID].amount.add(msg.value);
    JackpotIncreased(msg.value);
  }

  function setJackpotReceivers(address[] _receivers0, address[] _receivers1) internal returns (uint) {
    jackpots[currentJackpotID].finalAmount = jackpots[currentJackpotID].amount;
    jackpots[currentJackpotID].receivers0 = _receivers0;
    jackpots[currentJackpotID].receivers1 = _receivers1;
    currentJackpotID = currentJackpotID + 1;
    return currentJackpotID - 1;
  }

  function receiveJackpotPayment(uint jackpotID, uint receiverGroup, uint index) public {
    Jackpot storage j = jackpots[jackpotID];

    if (receiverGroup == 0) {
      require(j.receivers0[index] == msg.sender);
    } else {
      require(j.receivers1[index] == msg.sender);
    }

    uint transferAmount = j.finalAmount.div(j.receivers0.length + j.receivers1.length);

    //transfer jackpot payment
    
  }
}