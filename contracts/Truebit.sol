pragma solidity ^0.4.4;
import "./TaskGiver.sol";

contract Truebit{
  mapping (uint => Task) tasks;
  uint numTasks;
  uint gasPrice = 1000000; //1 million wei/instruction 

  struct Task {
    bytes32 dataRoot;
    address taskGiver;
    uint    minDeposit;
    uint    gasLimit;

    bool solved;
    bool processed;
    bytes32 globalRoot;
    bytes32 solution; //can be a root
  }

  function solved(Task t) private returns (bool){
    return t.solved; //stub for now
  }

  function cheatSolve(uint taskIndex, bytes32 globalRoot, bytes32 solution){
    Task t = tasks[taskIndex];
    t.globalRoot = globalRoot;
    t.solution = solution;
    t.solved = true;
  }

  function createTask(bytes32 dataRoot, uint minDeposit) payable returns (uint){
    uint gasLimit = msg.value / gasPrice;
    tasks[numTasks] = Task(dataRoot, msg.sender, minDeposit, gasLimit, false, false, 0x0, 0x0);
    numTasks++;
    return numTasks - 1;
  }

  function processTask(uint taskIndex){
    Task t = tasks[taskIndex];
    require(TaskGiver(t.taskGiver).processTask(taskIndex, t.solution));
    t.processed = true;
  }

  function getTask(uint taskIndex) constant returns(bytes32, address, uint, uint, bool, bool, bytes32, bytes32){
    Task t = tasks[taskIndex];
    return (t.dataRoot, t.taskGiver, t.minDeposit, t.gasLimit, t.solved, t.processed, t.globalRoot, t.solution);
  }


}


