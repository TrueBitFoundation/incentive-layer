pragma solidity ^0.4.4;
import "./Requester.sol";

contract Truebit{
  mapping (uint => Task) tasks;
  uint numTasks;
  uint gasPrice = 1000000; //1 million wei/instruction 

  struct Task{
    bytes32 dataRoot;
    address requester;
    uint    minDeposit;
    uint    gasLimit;

    bool solved;
    bool proccessed;
    bytes32 globalRoot;
    bytes32 solution; //can be a root
  }

  struct Solution{
  }

  function createTask(bytes32 dataRoot, uint minDeposit) payable returns (uint){
    uint gasLimit = msg.value / gasPrice;
    tasks[numTasks] = Task(dataRoot, msg.sender, minDeposit, gasLimit, false, false, 0x0, 0x0);
    numTasks++;
    return numTasks - 1;
  }

  function proccessTask(uint taskIndex){
    Task t = tasks[taskIndex];
    require(solved(t));
    require(!t.proccessed);
    require(Requester(t.requester).proccessTask(taskIndex, t.solution));
    t.proccessed = true;
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

  function getTask(uint taskIndex) constant returns(bytes32, address, uint, uint, bool, bool, bytes32, bytes32){
    Task t = tasks[taskIndex];
    return (t.dataRoot, t.requester, t.minDeposit, t.gasLimit, t.solved, t.proccessed, t.globalRoot, t.solution);
  }
}


