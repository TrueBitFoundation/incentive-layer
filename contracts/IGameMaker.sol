pragma solidity ^0.4.18;

interface IGameMaker {
    function make(uint taskID, address solver, address verifier, bytes32 initHash, bytes32 result, uint256 size, uint timeout) external returns (bytes32);
}
