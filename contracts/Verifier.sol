pragma solidity ^0.4.4;
import "./Truebit.sol";

contract Verifier {

  Truebit public truebit;
  mapping (uint => bytes32) public tasks;
  modifier onlyTruebit(){ require(msg.sender == address(truebit)); _; }

  function Solver(address _truebit){
    truebit = Truebit(_truebit);
  }

}