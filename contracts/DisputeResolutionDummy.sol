pragma solidity ^0.4.18;

import "./IDisputeResolutionLayer.sol";
import "./IGameMaker.sol";

contract DisputeResolutionLayerDummy is IDisputeResolutionLayer {

    enum State { Uninitialized, Challenged, Unresolved, SolverWon, ChallengerWon }

    struct Game {
        address solver;
        address verifier;
        State status;
    }

    mapping(bytes32 => Game) private games;

    function commitChallenge(address solver, address verifier, bytes32 spec) external returns (bytes32 gameId) {
        gameId = keccak256(solver, verifier, spec);
        Game storage g = games[gameId];
        g.solver = solver;
        g.verifier = verifier;
        g.status = State.SolverWon;
    }

    function status(bytes32 gameId) external view returns (uint) {
        return uint(games[gameId].status);
    }

    struct Game2 {
	uint taskID;
	address solver;
	address verifier;
	bytes32 startStateHash;
	bytes32 endStateHash;
	uint size;
	uint timeout;
    }

    mapping(bytes32 => Game2) private games2;

    function make(uint taskID, address solver, address verifier, bytes32 startStateHash, bytes32 endStateHash, uint256 size, uint timeout) external returns (bytes32) {
	bytes32 gameID = keccak256(solver, verifier, startStateHash, endStateHash, size, timeout);
	Game2 storage g = games2[gameID];
	g.taskID = taskID;
	g.solver = solver;
	g.verifier = verifier;
	g.startStateHash = startStateHash;
	g.endStateHash = endStateHash;
	g.size = size;
	g.timeout = timeout;
	return gameID;
    }
}
