# Truebit Contracts

[Truebit](https://truebit.io) seeks to extend the class of computations that can, with high probability, be performed 'correctly' in a decentralized network of financially rational processors.

This working sketch follows section 4 of the [whitepaper](https://people.cs.uchicago.edu/~teutsch/papers/truebit.pdf) in an implementation of the Incentive layer contracts. 

## Implementation

There are many ways in which this can be implemented; this first draft assumes a library-driven structure, consisting of three core struct: Jackpot, Task, and TaskBook. 


### Jackpot 

To incentivize verifiers, a [progressive jackpot](https://en.wikipedia.org/wiki/Progressive_jackpot) is established prior to the negotiation of Tasks. The idea here is to collect a verification tax as a fixed fraction of a Task's difficulty, awarding a fixed fraction of its holdings when a 'forced error' is in effect. 

In order to facilitate multiple methods of payment, the rules and operation of the Jackpot are defined here in terms of arbitrary quantities of type `uint256`. The intention here is
to enable the construction of Jackpots, and subsequently Tasks, whose payment structure is defined in separate contracts.



#### Properties 


| Type | Name | Description |
|------|------|-------------|
| `address` | addr | Address of the Jackpot repository. |
| `uint` | tax | Universal Tax rate to be applied for this jackpot. |
| `uint` | fe_rate | Forced error rate, determining the frequency of payouts. |
| `bool` | active | Set when this Jackpot is initialized in a contract. |


#### Methods

##### `init(uint tax, uint fe_rate)`

##### `deposit (uint amount)`

#### Events



***

### Task

The main item encapsulating the properties, operations, and events appearing across the lifecycle of a Task. 

*Thought* - Perhaps the numerous `uint`'s can be collected into a list of 'critical block times'.


#### Properties


| Type | Name | Description |
|------|------|-------------|
| `State` | state| The current state of this Task. |
| `Jackpot` | jackpot | Jackpot repository with which this Task is associated. This is important for when Jackpot actions are triggered. |
| `address` | giver | The address responsible for the creation of this Task. |
| `address` | solver | The address elected to solve this Task. |
| `uint` | reward | The reward offered for correct solution of this Task. The method of payment is to be determined by the importing contract. |
| `uint` | min_deposit | The minimum deposit required from a solver of this Task. |
| `uint` | created | The block number at which this Task was created. |
| `uint` | elected | The block number at which a solver is first elected. |
| `uint` | commited | The block number at which a solver submit his solution hashes. |
| `uint` | challenged | The block number at which a challenge is initiated. |   
| `uint` | timeout | The timeout period between state transitions. Failure to comply with the protocol in a timely manner results in deposits forfeited to the Jackpot. |
| `bytes32` | init | Keccak-256 hash of the initial VM state, supplied by Giver. |
| `bytes32[2]` | solution_hashes | Keccak-256 hashes of correct and incorrect terminal VM states, supplied by Solver. |
| `bytes32` | rand_hash | Keccak-256 hash of the solver's random bits r. |
| `bytes32` | solution | Keccak-256 hash. |
| `bool` | solution_choice | Choice of one of the two above solution hashes, provided by the Solver upon revelation of the block hash following the submission of `solution_hashes`. |
| `mapping (address => uint)` | deposits | Deposit amounts supplied by solver and verifiers. |



#### Methods

##### `init()`

##### `bid()`

##### `commit()`

##### `reveal()`

##### `challenge()`

##### Events

***

### TaskBook 

A TaskBook simply collects Tasks together in order to expose a unified interface for prospective solvers and verifiers.