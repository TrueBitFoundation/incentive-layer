pragma solidity ^0.4.18;

interface IDisputeResolutionLayer {
    function status(bytes32 gameId) public view returns (uint);
    function newGame(address solver, address verifier, uint numSteps) public returns (bytes32 gameId);
}