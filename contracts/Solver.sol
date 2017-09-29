pragma solidity ^0.4.4;
import "./Truebit.sol";

contract Solver {

  Truebit public truebit;
  mapping (uint => bytes32) public tasks;
  modifier onlyTruebit(){ require(msg.sender == address(truebit)); _; }

  function Solver(address _truebit){
    truebit = Truebit(_truebit);
  }

  //Where solver posts deposit and hash
  //TODO generate hash of random bits
  function postBid(uint taskId, uint minDeposit) payable {
  	bool result = truebit.postBid.value(msg.value)(msg.sender, taskId, minDeposit);
  	require(result);
  }
  
}