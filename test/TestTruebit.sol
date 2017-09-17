pragma solidity ^0.4.2;

import "truffle/Assert.sol";
import "truffle/DeployedAddresses.sol";
import "../contracts/Truebit.sol";

contract TestTruebit {

  function testInitialBalanceUsingDeployedContract() {
    Truebit meta = Truebit(DeployedAddresses.Truebit());

    uint expected = 10000;

    // Assert.equal(meta.getBalance(tx.origin), expected, "Owner should have 10000 Truebit initially");
  }

  function testInitialBalanceWithNewTruebit() {
    Truebit meta = new Truebit();

    uint expected = 10000;

    // Assert.equal(meta.getBalance(tx.origin), expected, "Owner should have 10000 Truebit initially");
  }

}
