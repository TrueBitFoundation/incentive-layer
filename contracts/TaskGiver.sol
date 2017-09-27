pragma solidity ^0.4.4;

contract TaskGiver {

  /*
  	Task Data Spec
  	--------------------
    0 bytes32 dataRoot
    1 address taskGiver
    2 uint    minDeposit
    3 uint    reward
    4 uint timeout
  */

  function proccessTask(uint taskIndex, bytes32 solution) returns(bool){}

  function postTask(bytes32 dataRoot, uint timeout, uint reward, uint minDeposit) returns(bytes32, address, uint, uint, uint) {
  	return (dataRoot, msg.sender, minDeposit, reward, timeout);
  }
}