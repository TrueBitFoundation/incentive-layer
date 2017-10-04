/**
  *  A sketch of the incentive layer as a library.
  *
**/
pragma solidity ^0.4.17;

library Incentive {

    /**
      * State variable capturing the evolving state of a task
      * for conditional execution of operations.
     **/
    enum State {
        BIDDING,
        SOLVING,
        PENDING,
        ACCEPTED,
        CHALLENGED,
        VERIFIED,
        REJECTED,
        FAILED
    }


   /**
      *     A 'Task' encapsulating the features needed to verifiably communicate
      *     the status of submitted computations.
      *
      *         giver            -  The address requesting the Task, supplying values for init, min_deposit,
      *                             and blk_timeout. 
      * 
      * 
      *         state            -  One of the above States corresponding to the stage of the protocol
      *                             in which the Task is in. Tasks begin in the 'BIDDING' state, and
      *                             remain this way until either a solver is elected or a timeout is reached.
      *
      *         init            -   Keccak-256 hash of the initial VM state supplied by `giver`. This is used by the solver to
      *                             initialize an off-chain execution.
      *
      *         deposit         -  The amount deposited in escrow for this Task. This does not include the
      *                             quantity provided as verification tax.
      * 
      *         min_deposit     -  The minimum deposit required of prospective solvers.
      * 
      *         blk_submit      -  The block number at which this Task was submitted.
      * 
      *         blk_timeout     -  The number of blocks in each phase among bidding, solving,
      *                             and challenging. For the moment, this is
      *
      *                                 1) supplied by the task giver, and 
      *                                 2) uniform across phases.
      *
      *                              This will require tuning to achieve optimality, and it
      *                              may be preferable to select timeout parameters globally.
      * 
      *                              Timeouts are measured in blocks, since block timestamps
      *                              need not correspond to the correct total ordering of blocks,
      *                              even though they typically do.
      * 
      *         solver          -   The address elected to solve the Task. The selection process described
      *                             in the white paper resolves, from the perspective of a contract in which
      *                             this Task is found, to the first bidder satisfying the conditions for
      *                             solving this Task.
      * 
      *         solutions        -   The keccak-256 hashes of the terminal VM states supplied by `solver`. These
      *                              correspond to correct and incorrect solutions, with the choice revealed once
      *                              the next block is mined and the solver is able to decide.
      *                          
      * 
      *         steps           -   The number of computation steps executed by the solver in obtaining `solution`.
      *     
    **/
  struct Task {
      State state;        

        address giver;      
        address solver;

        uint reward;
        uint deposit;
        uint min_deposit;
        
        
        bytes32 init;
        bytes32[2] solutions;

        uint blk_start;
        uint blk_timeout;

        uint steps;
  }


  /**
    *  The Jackpot with it's key features
    *
    *     balance -
    *
    *     rate -
    *
  **/

  struct Jackpot {
      uint  balance;
      uint  rate;
      uint  tax;
      uint  count;
  }


  /**
   * @dev Creates a task for computation
   * 
   * @param init -        keccak-256 hash of initial VM state
   * @param deposit -     the quantity deposited
   * @param min_deposit - the minimum deposit to accept from bidders
  *  @param reward      - the reward for solving the task
  **/
  function create (
        bytes32 init,
        uint deposit,
        uint min_deposit,
        uint reward
    ) 
      public returns (Task) {
        return Task(State.BIDDING,
                                 msg.sender,
                                 msg.sender,
                                 reward,
                                 deposit,
                                 min_deposit,
                                 init,
                                 0,
                                 tasks[size].blk_start,
                                 tasks[size].blk_timeout,
                                 0);

        size++;
    }

    /**
      * @dev Places a bid on a given task if the sender meets the requirements for solving.
      * 
      * @param id   - the id of the task
     **/
    function bid (Task storage task) 
        public
        onlyBidding ()
        returns (bool success)
    {
        Task storage task = self.tasks[id];
        
        if (self.solver == 0) {
          self.solver = msg.sender;
          self.state = State.SOLVING;
          self.blk_start = block.number;
          Elected(task.solver, id);
        }
        return true;
    }

    /**
      * @dev Submits a pair of solutions to the given task.
      *
      * @param self       -  A task 
      * @param solutions   - The solutions, supplied as hashes of the terminal VM states.
      * @param steps      - The number of steps run this function's execution.
  **/
    function solve (
        Task storage self,
        bytes32[2] solution,
        uint steps
    )
      onlySolving (tasks[id])
      onlySolver (tasks[id])
      public returns (uint) {
        self.solution[0] = solution[0];
        self.solution[1] = solution[1];
        self.steps = steps;
    }



    

    event Submitted(address indexed giver);
    event Elected(address indexed solver);
    event Solved (address indexed solver);

    // Only during the bidding phase of a task.
    modifier onlyBidding (Task storage task) {
        require (block.number < task.blk_start + task.blk_timeout);
        _;
    }

    // Only the solver of the task 
    modifier onlySolver (Task storage task) {
      require (task.solver == msg.sender);
      _;
    }


    // Only during the solving phase of a task
    modifier onlySolving (Task storage task) {
        require ((task.state == State.SOLVING) &&
                (block.number >= task.blk_start + task.blk_timeout) &&
                (block.number < task.blk_start + 2*task.blk_timeout));
        _;
    }
    

}
