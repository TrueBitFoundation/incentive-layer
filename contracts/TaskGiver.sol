pragma solidity ^0.4.4;
import "./Truebit.sol";

contract TaskGiver {

  Truebit public truebit;
  mapping (uint => bytes32) public tasks;
  modifier onlyTruebit(){ require(msg.sender == address(truebit)); _; }

  function TaskGiver(address _truebit){
    truebit = Truebit(_truebit);
  }

  //TaskGiver client posts task onto Truebit contract
  function createTask(bytes32 dataRoot, uint minDeposit) payable returns (uint taskIndex){
    taskIndex = truebit.createTask.value(msg.value)(dataRoot, minDeposit);
    return taskIndex;
  }

  //Called by Truebit contract to send the solution back
  function processTask(uint taskIndex, bytes32 solution) onlyTruebit returns (bool){
    tasks[taskIndex] = solution;
    return true;
  }
}