pragma solidity ^0.4.4;

import './math/SafeMath.sol';

contract DepositsManager {
  using SafeMath for uint;

  mapping(address => uint) public deposits;
  uint public jackpot;
  address public owner;

  event DepositMade(address who, uint amount);
  event DepositWithdrawn(address who, uint amount);
  event JackpotIncreased(uint amount);

  function DepositsManager() {
    owner = msg.sender;
    jackpot = 0;
  }
  
  // @dev – fallback to calling makeDeposit when ether is sent directly to contract.
  function() public payable {
    makeDeposit();
  }

  function getDeposit(address who) constant public returns (uint) {
    return deposits[who];
  }

  function getJackpot() constant public returns (uint) {
    return jackpot;
  }

  function makeDeposit() public payable returns (uint) {
    deposits[msg.sender] = deposits[msg.sender].add(msg.value);
    DepositMade(msg.sender, msg.value);
    return deposits[msg.sender];
  }

  function withdrawDeposit(uint amount) public returns (uint) {
    require(deposits[msg.sender] > amount);

    deposits[msg.sender] = deposits[msg.sender].sub(amount);
    msg.sender.transfer(amount);

    DepositWithdrawn(msg.sender, amount);
    return deposits[msg.sender];
  }

  function donateToJackpot() public payable returns (uint) {
    jackpot = jackpot.add(msg.value);
    JackpotIncreased(msg.value);
    return jackpot;
  }
}
