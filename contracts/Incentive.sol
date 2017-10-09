pragma solidity ^0.4.17;

library Incentive {


    /**
     *  The state of a Task.
     * 
     *      NONE        -   Initial state, awaiting call to `init`.
     *      BIDDING     -   Accepting bids from solvers.
     *      SOLVING     -   Waiting for solution from solver.
     *      PENDING     -   Pending challenge from verifiers.
     *      RESOLVING   -   Resolving challenge from verifier.
     *      ACCEPTED    -   Accepted solution.
     *      EXPIRED     -   Timeout triggers, Task expired.
    **/
    enum State {
        NONE,
        BIDDING,
        SOLVING,
        PENDING,
        RESOLVING,
        ACCEPTED,
        TIMEOUT
    }


    /**
     *   Abstract Jackpot representation.
     * 
     *      @param addr         Address of this Jackpot.
     *      @param tax          Universal tax rate for this Jackpot.
     *      @param size         Current jackpot pot size.
     *      @param fe_rate      Forced Error Rate.
     *      @param active       Declares Jackpot active or inactive.
     **/
    struct Jackpot {
        address addr;
        uint tax;
        uint size;
        uint fe_rate;
        bool active;
    }
    

    /**
      * @dev Initializes a Jackpot
      * 
      * @param self         The Jackpot on which this is called.
      * @param tax          The Jackpot tax rate.
      * @param fe_rate      The forced error rate.
      * 
      * @return success    True on success.
     **/
    function init(
        Jackpot storage self,
        uint tax,
        uint fe_rate)
        onlyInactive (self)
        public returns (bool) {
    
        self.addr = msg.sender;
        self.tax = tax;
        self.fe_rate = fe_rate;
        self.active = true;
        return true;
    }

    
    /**
      * @dev Deposits a quantity into the Jackpot repository.
      * 
      * @param self         The Jackpot on which this is called.
      * @param amount       The amount deposited.
      * 
      * @return size       The resulting size of the pot.
     **/
    function deposit (
        Jackpot storage self,
        uint amount)
        onlyActive (self)
        public returns (uint) {

        self.size += amount;
        return self.size;
    }


    /**
     *  Main Task component.
     * 
     *  @param state        Current state of Task. See `State` definition above.
     *  @param jackpot      Jackpot repository with which this Task is associated. This is important when actions are triggered.
     *  @param giver        Address of Giver.
     *  @param solver       Address of elected Solver.
     *  @param init         Keccak256 hash of initial VM state, supplied by Giver.
     *  @param rand_hash    Keccak256 hash of solver's private random bits r.
     *  @param soln_hashes  Pair of Keccak256 hashes of solutions commited by solver.
     *  @param soln         Keccak256 hash of terminal VM state, revealed by solver after challenge timeout.
     *  @param soln_choice  Choice among pair `soln_hashes` designated by solver after `soln_hashes` are included in a block.
     *  @param created      Block in which this Task first appears.
     *  @param elected      Block in which a solver is first elected.
     *  @param commited     Block in which solver submits solution hashes.
     *  @param challenged   Block in which challenge is initiated, if at all.
     *  @param min_deposit  Minimum deposit amount required from solvers.
     *  @param timeout      Timeout period, in blocks, for bidding, solving, and resolving states.
     *  @param deposits     Deposits submitted by solver and verifiers.
    **/
    struct Task {
        State state;
        Jackpot jackpot;

        address giver;
        address solver;

        bytes32 init;
        bytes32 rand_hash;
        bytes32[2] soln_hashes;
        bytes32 soln;

        bool soln_choice;

        uint created;
        uint elected;
        uint commited;
        uint challenged;
        uint reward;
        uint deposit;
        uint min_deposit;
        uint timeout;
        
        mapping (address => uint) deposits;
    }
    
    /**
     *  @dev Initializes a Task for bidding.
     * 
     *  @param self             The Task on which this function is called.
     *  @param jackpot          Jackpot repository with which this Task is associated.
     *  @param init_hash        Keccak256 hash of initial VM state.
     *  @param reward           Reward offered for solution of this Task.
     *  @param min_deposit      Minimum deposit amount required from solvers and verifiers.
     *  @param timeout          Timeout period, in blocks, for bidding, solving, and resolving states.
     * 
     *  @return expiry          Block number of bidding timeout. 
    **/
    function init (
        Task storage self,
        Jackpot storage jackpot,
        bytes32 init_hash,

        uint reward,
        uint min_deposit,
        uint timeout
    ) 
        onlyState (self, State.NONE)            // Task must be uninitialized.
        onlyActive (jackpot)                    // Jackpot must be active.
        public returns (uint) {
        
        self.giver = msg.sender;
        self.jackpot = jackpot;
        self.init = init_hash;
        self.reward = reward;
        self.min_deposit = min_deposit;
        self.created = block.number;
        self.timeout = timeout;
        self.state = State.BIDDING;
        return self.created + self.timeout;
    }
    

    /**
      * @dev Places a bid on this Task, determining the Task's Solver.
      * 
      * @param self             The Task on which this is called.
      * @param amount           The quantity staked for deposit.
      * @param rand_hash        The Keccak256 hash of private random bits r.
      * 
      * @return expiry          The block number at which the solving phase will timeout.
     **/
    function bid (
        Task storage self, 
        uint amount, 
        bytes32 rand_hash
    )
        onlyState (self, State.BIDDING)
        onlyMinDeposit (self, amount)
        public returns (uint expiry) {
        require (self.created + self.timeout > block.number);
        self.state = State.SOLVING;
        self.deposit = amount;
        self.solver = msg.sender;
        self.rand_hash = rand_hash;
        return block.number + self.timeout;
    }
    
    /**
     *  @dev Makes a deposit to this Task, determining verifiers.
     * 
     *  @param self         The Task on which this is called.
     *  @param amount       The quantity deposited.
     * 
     *  @return bool        Returns true on success.
     **/
    function deposit (
        Task storage self,
        uint amount
    )
        onlyState (self, State.SOLVING)
        public returns (bool) {
    
        self.deposits[msg.sender] += amount;
    }

    
    /**
     *  @dev Commits solution hashes to this Task.
     * 
     *  @param self         The Task on which this is called.
     *  @param soln_hashes  Keccak256 hashes as defined in `Task`.
     * 
     *  @return success     Returns true on success, false on timeout.
    **/    
    function commit (
        Task storage self,
        bytes32[2] soln_hashes
    )
        onlySolver (self)
        onlyState (self, State.SOLVING)
        public returns (bool success) {
        
        // Timeout, deposit forfeited
        if (self.elected + self.timeout <= block.number) {
            self.state = State.TIMEOUT;
            // todo: handle deposit forfeit to jackpot 
            return false;
        }

        self.soln_hashes = soln_hashes;
        self.commited = block.number;
        return true;
    }


    function reveal (
      Task storage self,
      bytes32 soln
      uint steps
    ) {
      // todo 
    }

    
    
    modifier onlyActive (Jackpot storage self) {
        require (self.active);
        _;
    }

    modifier onlyInactive (Jackpot storage self) {
        require (!self.active);
        _;
    }
    
    
    modifier onlyVerifier (Task storage self) {
        require ((self.deposits[msg.sender] >= self.min_deposit) &&
                 !(self.solver == msg.sender));
        _;
    }
    
    
    modifier onlySolver (Task storage self) {
        require (self.solver == msg.sender);
        _;
    }

    modifier onlyMinDeposit (Task storage self, uint amount) {
        require (self.min_deposit <= amount);
        _;
    }


    modifier onlyState (Task storage self, State state) {
        require (self.state == state);
        _;
    }

}