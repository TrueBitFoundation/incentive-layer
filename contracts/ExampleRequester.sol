pragma solidity ^0.4.4;
import "./Requester.sol";
import "./Truebit.sol";

contract ExampleRequester is Requester{
  Truebit public truebit;
  mapping (uint => bytes32) public tasks;
  modifier onlyTruebit(){ require(msg.sender == address(truebit)); _; }
  function ExampleRequester(address _truebit){
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
