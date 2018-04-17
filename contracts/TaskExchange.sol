pragma solidity ^0.4.18;

import "./DepositsManager.sol";
import "./IDisputeResolutionLayer.sol";

contract TaskExchange is DepositsManager {

    uint private numTasks = 0;

    event DepositBonded(uint taskID, address account, uint amount);
    event DepositUnbonded(uint taskID, address account, uint amount);
    event TaskCreated(uint taskID, uint minDeposit);
    event SolverSelected(uint indexed taskID, address solver, uint minDeposit);
    event SolutionCommitted(uint taskID, uint minDeposit, bytes32 solution);
    event VerificationCommitted(uint taskID, bytes32 gameId);

    enum State { Register, Solve, Solved, Verify, Timeout }

    struct Task {
        address owner;
        address selectedSolver;
        uint minDeposit;
        uint reward;
        bytes taskData;
        State state;
        uint taskCreationBlockNumber;
        mapping(address => uint) bondedDeposits;
        address currentChallenger;
        bytes32 currentGame;
        bytes32 solution;
        uint[3] intervals;
        IDisputeResolutionLayer disputeRes;
        uint numSteps;
        bool finalized;
    }

    function getSolution(uint taskID) public view returns(bytes32 solution) {
        return solution;
    }

    function getTaskData(uint taskID) public view returns(bytes taskData, uint numSteps, uint state, uint[3] intervals) {
        Task storage t = tasks[taskID];
        return (t.taskData, t.numSteps, uint(t.state), t.intervals);
    }

    mapping(uint => Task) private tasks;

    // @dev - private method to check if the denoted amount of blocks have been mined (time has passed).
    // @param taskID - the task id.
    // @param numBlocks - the difficulty weight for the task
    // @return - boolean
    function stateChangeTimeoutReached(uint taskID) private view returns (bool) {
        Task storage t = tasks[taskID];
        return block.number.sub(t.taskCreationBlockNumber) >= t.intervals[uint(t.state)];
    }

    function timeout(uint taskID) public {
        Task storage t = tasks[taskID];
        require(msg.sender == t.owner);
        require(t.solution == 0x0);
        require(stateChangeTimeoutReached(taskID));
        t.state = State.Timeout;
    }

    // @dev – locks up part of the a user's deposit into a task.
    // @param taskID – the task id.
    // @param account – the user's address.
    // @param amount – the amount of deposit to lock up.
    // @return – the user's deposit bonded for the task.
    function bondDeposit(uint taskID, address account, uint amount) private returns (uint) {
        Task storage task = tasks[taskID];
        require(deposits[msg.sender] >= amount);
        deposits[account] = deposits[account].sub(amount);
        task.bondedDeposits[account] = task.bondedDeposits[account].add(amount);
        DepositBonded(taskID, account, amount);
        return task.bondedDeposits[account];
    }

    // @dev – unlocks a user's bonded deposits from a task.
    // @param taskID – the task id.
    // @param account – the user's address.
    // @return – the user's deposit which was unbonded from the task.
    function unbondDeposit(uint taskID) public returns (uint) {
        Task storage task = tasks[taskID];
        require(block.number.sub(task.taskCreationBlockNumber) >= task.intervals[2] || task.state == State.Timeout);
        uint bondedDeposit = task.bondedDeposits[msg.sender];
        delete task.bondedDeposits[msg.sender];
        deposits[msg.sender] = deposits[msg.sender].add(bondedDeposit);
        DepositUnbonded(taskID, msg.sender, bondedDeposit);
        
        return bondedDeposit;
    }

    // @dev – returns the user's bonded deposits for a task.
    // @param taskID – the task id.
    // @param account – the user's address.
    // @return – the user's bonded deposits for a task.
    function getBondedDeposit(uint taskID, address account) constant public returns (uint) {
        return tasks[taskID].bondedDeposits[account];
    }

    // @dev – taskGiver creates tasks to be solved.
    // @param minDeposit – the minimum deposit required for engaging with a task as a solver or verifier.
    // @param reward - the payout given to solver
    // @param taskData – tbd. could be hash of the wasm file on a filesystem.
    // @param numBlocks – the number of blocks to adjust for task difficulty
    // @return – boolean
    function createTask(uint minDeposit, bytes taskData, uint[3] intervals, uint numSteps, IDisputeResolutionLayer disputeRes) public payable returns (bool) {
        require(deposits[msg.sender] >= minDeposit);
        require(msg.value > 0);
        Task storage t = tasks[numTasks];
        t.owner = msg.sender;
        t.minDeposit = minDeposit;
        t.reward = msg.value;
        t.taskData = taskData;
        t.taskCreationBlockNumber = block.number;
        t.intervals = intervals;
        t.disputeRes = disputeRes;
        t.numSteps = numSteps;
        bondDeposit(numTasks, msg.sender, minDeposit);
        log0(keccak256(msg.sender)); // possible bug if log is after event
        TaskCreated(numTasks, minDeposit);
        numTasks = numTasks.add(1);
        return true;
    }

    // @dev – solver registers for tasks, if first to register than automatically selected solver
    // @param taskID – the task id.
    // @return – boolean
    function registerForTask(uint taskID) public returns(bool) {
        Task storage t = tasks[taskID];
        
        require(!(t.owner == 0x0));
        require(t.state == State.Register);
        require(t.selectedSolver == 0x0);
        
        bondDeposit(taskID, msg.sender, t.minDeposit);
        t.selectedSolver = msg.sender;
        t.state = State.Solve;

        SolverSelected(taskID, msg.sender, t.minDeposit);
        return true;
    }

    // @dev – selected solver submits a solution to the exchange
    // @param taskID – the task id.
    // @param solution - the submitted solution
    // @return – boolean
    function commitSolution(uint taskID, bytes32 solution) public returns (bool) {
        Task storage t = tasks[taskID];
        require(t.selectedSolver == msg.sender);
        require(t.state == State.Solve);
        require(block.number < t.taskCreationBlockNumber.add(t.intervals[uint(t.state)]));

        t.solution = solution;
        t.state = State.Solved;
        SolutionCommitted(taskID, t.minDeposit, t.solution);
        return true;
    }

    // @dev – verifier submits a challenge to the solution provided for a task
    // verifiers can call this until task giver changes state or timeout
    // @param taskID – the task id.
    // @return – boolean
    function commitChallenge(uint taskID) public returns (bool) {
        Task storage t = tasks[taskID];
        require(t.state == State.Solved);
        require(block.number.sub(t.taskCreationBlockNumber) < t.intervals[2]);

        bondDeposit(taskID, msg.sender, t.minDeposit);
        t.currentChallenger = msg.sender;
        t.state = State.Verify;
        t.currentGame = t.disputeRes.newGame(t.selectedSolver, msg.sender, t.numSteps);
        VerificationCommitted(taskID, t.currentGame);
        return true;
    }

    function convictSolver(uint taskID, bytes32 gameId) public {
        Task storage t = tasks[taskID];
        uint status = t.disputeRes.status(t.currentGame);
        require(status == 3);
        uint solverAmount = t.bondedDeposits[t.selectedSolver];
        t.bondedDeposits[t.selectedSolver] = t.bondedDeposits[t.selectedSolver].sub(solverAmount);
        t.bondedDeposits[t.currentChallenger] = t.bondedDeposits[t.currentChallenger].add(solverAmount);
        t.state = State.Timeout;
    }

    function convictVerifier(uint taskID, bytes32 gameId) public {
        Task storage t = tasks[taskID];
        uint status = t.disputeRes.status(t.currentGame);
        require(status == 2);
        uint verifierAmount = t.bondedDeposits[t.currentChallenger];
        t.bondedDeposits[t.currentChallenger] = t.bondedDeposits[t.currentChallenger].sub(verifierAmount);
        t.bondedDeposits[t.selectedSolver] = t.bondedDeposits[t.selectedSolver].add(verifierAmount);
        t.state = State.Solved;
    }

    function finalizeTask(uint taskID) public {
        Task storage t = tasks[taskID];
        require(block.number.sub(t.taskCreationBlockNumber) >= t.intervals[2]);
        uint status = t.disputeRes.status(t.currentGame);
        //Game never started or Solver won
        require(status == 0 || status == 2);
        t.finalized = true; // Task has been completed
        distributeReward(t);
    }

    function getTaskFinality(uint taskID) public view returns (bool) {
        return tasks[taskID].finalized;
    }

    function distributeReward(Task t) internal {
        t.selectedSolver.transfer(t.reward);
    }

}