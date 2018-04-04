pragma solidity ^0.4.18;

import "./IDisputeResolutionLayer.sol";

contract DisputeResolutionLayerDummy is IDisputeResolutionLayer {

    struct Game {
        address solver;
        address verifier;
        uint numSteps;
        uint status;
    }

    mapping(bytes32 => Game) private games;

    function newGame(address solver, address verifier, uint numSteps) public returns (bytes32 gameId) {
        gameId = keccak256(solver, verifier, numSteps);
        Game storage g = games[gameId];
        g.solver = solver;
        g.verifier = verifier;
        g.numSteps = numSteps;
        g.status = 1;// Solver has already won
    }

    function status(bytes32 gameId) public view returns (uint) {
        return games[gameId].status;
    }
}