pragma solidity ^0.4.18;

interface IDisputeResolutionLayer {
    function status(bytes32 id) public view returns (uint); //returns State enum
    function commitChallenge(address solver, address verifier) public returns (bytes32 gameId);
}