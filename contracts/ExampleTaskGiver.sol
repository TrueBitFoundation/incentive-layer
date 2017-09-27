pragma solidity ^0.4.4;
import "./TaskGiver.sol";
import "./Truebit.sol";

contract ExampleTaskGiver is TaskGiver{
  Truebit public truebit;
  mapping (uint => bytes32) public tasks;
  modifier onlyTruebit(){ require(msg.sender == address(truebit)); _; }

  function ExampleTaskGiver(address _truebit){
    truebit = Truebit(_truebit);
  }

  function createTask(bytes32 dataRoot, uint minDeposit) payable returns (uint taskIndex){
    taskIndex = truebit.createTask.value(msg.value)(dataRoot, minDeposit);
  }

  function proccessTask(uint taskIndex, bytes32 solution) onlyTruebit returns (bool){
    tasks[taskIndex] = solution;
    return true;
  }
}