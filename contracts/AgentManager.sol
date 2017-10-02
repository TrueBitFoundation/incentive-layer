pragma solidity ^0.4.4;

contract AgentManager {
  
  mapping(address => uint) balances;
  function AgentManager() {
    balances[tx.origin] = 0;
  }

  function getBalance() returns (uint) {
  	return balances[tx.origin];
  }

  function submitDeposit() payable returns (bool) {
  	uint balance = balances[tx.origin];
  	balances[tx.origin] = balance + msg.value;
  }
}
