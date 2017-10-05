pragma solidity ^0.4.4;

contract AccountManager {
  
  mapping(address => uint) balances;
  function AccountManager() {
    
  }

  function getBalance(address addr) returns (uint) {
  	return balances[addr];
  }

  function submitDeposit(address addr) payable returns (bool) {
  	uint balance = balances[addr];
  	balances[addr] = balance + msg.value;
  }

  //from: https://ethereum.stackexchange.com/questions/884/how-to-convert-an-address-to-bytes-in-solidity
  function toBytes(address a) constant returns (bytes b){
   assembly {
        let m := mload(0x40)
        mstore(add(m, 20), xor(0x140000000000000000000000000000000000000000, a))
        mstore(0x40, add(m, 52))
        b := m
   }
  }
}
