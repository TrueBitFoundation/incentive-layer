pragma solidity ^0.4.18;

import "./IDisputeResolutionLayer.sol";

contract DisputeResolutionLayerDummy is IDisputeResolutionLayer {

    enum State { Uninitialized, Challenged, Unresolved, SolverWon, ChallengerWon }

    struct Game {
        address solver;
        address verifier;
        State status;
    }

    mapping(bytes32 => Game) private games;

    function commitChallenge(address solver, address verifier, bytes32 spec) public returns (bytes32 gameId) {
        gameId = keccak256(solver, verifier, spec);
        Game storage g = games[gameId];
        g.solver = solver;
        g.verifier = verifier;
        g.status = State.SolverWon;
    }

    function status(bytes32 gameId) public view returns (uint) {
        return uint(games[gameId].status);
    }
}