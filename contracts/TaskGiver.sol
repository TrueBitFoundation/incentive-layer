pragma solidity ^0.4.4;
import "./Truebit.sol";

contract TaskGiver {

  Truebit public truebit;
  modifier onlyTruebit(){ require(msg.sender == address(truebit)); _; }

  function TaskGiver(address _truebit){
    truebit = Truebit(_truebit);
  }

  function createTask(bytes32 dataRoot, uint minDeposit) payable returns (uint taskIndex){
    taskIndex = truebit.createTask.value(msg.value)(dataRoot, minDeposit);
    return taskIndex;
  }

  function processTask(uint taskIndex, bytes32 solution) onlyTruebit returns (bool){
    return true;
  }

  /*
  	Task Data Spec
  	--------------------
    0 bytes32 dataRoot
    1 address taskGiver
    2 uint    minDeposit
    3 uint    reward
    4 uint timeout
  */

  function postTask(bytes32 dataRoot, uint timeout, uint reward, uint minDeposit) returns(bytes32, address, uint, uint, uint) {
  	return (dataRoot, msg.sender, minDeposit, reward, timeout);
  }
}