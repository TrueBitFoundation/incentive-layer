pragma solidity ^0.4.4;

contract AccountManager {
  
  mapping(address => uint) balances;
  function AccountManager() {
    
  }

  function getBalance() returns (uint) {
    return balances[msg.sender];
  }

  function submitDeposit() payable returns (bool) {
    uint balance = balances[msg.sender];
    balances[msg.sender] = balance + msg.value;
    log0(sha3(msg.sender));
  }

}
