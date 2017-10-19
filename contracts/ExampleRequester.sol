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

  function createTask(bytes a, bytes b) payable returns (uint taskIndex){
    truebit.createTask(dataRoot, minDeposit);
  }

  function proccessTask(bytes32 k) onlyTruebit returns (bool){
    tasks[taskIndex] = k;
    return true;
  }
}
