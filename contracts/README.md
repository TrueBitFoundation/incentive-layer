# Contracts

## DepositsManager.sol
This contract is essentially described by its name. This contract handles deposits made by stakers in the incentive layer. Users only call `makeDeposit()` or fallback `function ()` in order to become staked.

## JackpotManager.sol
Jackpot is donated to through `donateToJackpot() payable`. The function adds to the current `jackpots[currentJackpotID]` and emits a `JackpotIncreased(msg.value)` event.

Verifiers receive the jackpot by calling the `receiveJackpotPayment(uint jackpotID, uint receiverGroup, uint index)` with the jackpot they are trying to claim and their index in the list of jackpot receivers. In the current implementation the jackpot is split _equally_ among the verifiers that show up. **TODO: change the jackpot to pay out with the exponential drop-off instead to prevent the jackpot being zeroed.** 


## IncentiveLayer.sol
This file defines `contract IncentiveLayer is JackpotManager, DepositsManager`. The contract handles all functions of the incentive layer from task givers submitting tasks to starting the dispute resolution layer. A task giver arrives and is forced to have made a deposit through `makeDeposit()` before submitting a task. 
The task giver can then call `createTask(uint minDeposit, bytes32 taskData, uint numBlocks) payable` specifying the minimum deposit that all stakers (solvers and verifiers) must make to take part in this task and the number of blocks to adjust for task difficulty. 
**TODO: remove the need for task giver to also stake money in order to submit a task. Related to them having to do a state update after commit challenges**

To become a solver, stakers all try to call `registerForTask(uint taskID, bytes32 randomBitHash)` with only the first staker being chosen. All other calls to the function fail because the requirement of no solver being present is no longer true. Along with registering for the task the staked amount that they have put up is now bonded to this task. This prevents them for registering for multiple tasks with the same deposit. When the computation is complete, the solver calls `commitSolution(uint taskID, bytes32 solutionHash0, bytes32 solutionHash1)` with a commitment to two different answers. One is the right answer and the other is the wrong answer which is used in case of a force error. The task state updates to indicate that the a committed solution was submitted by the solver.

One the solution is commited to, other stakes can call `commitChallenge(uint taskID, bytes32 intentHash)` in order to register their intent to challenge or not to for a particular task. We want that verifiers also indicated their intention not to challenge so that other verifiers can't monitor the challenges and only show up for forced error. Instead, they see `commitChallenge` calls for every task and have to check every solution. The task giver in this case has to force the state transition of the task once verifiers have challenged. This is why the task giver currently is required to initiate a state transition when verifiers have challenge.
**TODO: remove this requirement.**

Verifers reveal intent with `revealIntent(uint taskID, uint intent)` which tells which solution they want to challenge, the first or the second. 
**TODO: don't know if current implementation forced devlaring intent to not challenge either which might need to be added explicitly for clarity of readers.**

Intents are revealed and the solutions are also revealed by the solver calling `revealSolution(uint taskID, bool solution0Correct, uint originalRandomBits)`. This function also reveals random bits and checks if a forced error is in effect. If it is in effect then the jackpot is automatically paid out through `rewardJackpot(uint taskID)` to all verifiers that challenged this task.

Finally, the verification game is called by the verifier, `runVerificationGame(uint taskID)`. Once the game is complete the task giver calls `finalizeTask(uint taskID)`. The function only finalized the task once every challenger has played the verification game with the solver. Only then the task is finalized and the reward is distributed.

Stakers can finaly call `unbondDeposit` in order to get their stake out of this task to be used in another task.
