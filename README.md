# Truebit Contracts

[Truebit](https://truebit.io) seeks to extend the class of computations that can, with high probability, be performed 'correctly' in a decentralized network of financially rational processors.


This working sketch follows section 4 of the [whitepaper](https://people.cs.uchicago.edu/~teutsch/papers/truebit.pdf) in an implementation of the Incentive layer contracts. The structure is aimed at a core library of common elements to be used by core Truebit contracts, integrating aspects unsupported by libraries (e.g. payable functions). This is why the balances used in the library code are agnostic to interpretation, making it easy to support both ETH or other tokens [though this is not yet complete].



***

### Incentive Layer


#### [`Incentive`](contracts/Incentive.sol)

Contains common components needed throughout the lifecycle of a Task.



***

##### `create(bytes32 init, uint deposit, uint min_deposit, uint reward)`

*// todo*


*Inputs*



*Outputs*



***

##### `bid(Task storage Task)`

*// todo*

*Inputs*



*Outputs*

***

##### `solve(bytes32[2] solution, uint steps)`

*// todo*

*Inputs*



*Outputs*


***


##### Jackpots

##### Taxes

##### Deposits

##### Forced Errors

##### Solver and Verifier Selection