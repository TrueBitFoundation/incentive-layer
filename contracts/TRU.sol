pragma solidity ^0.4.24;

import "zeppelin-solidity/contracts/token/ERC20/MintableToken.sol";
import "zeppelin-solidity/contracts/token/ERC20/BurnableToken.sol";

contract TRU is MintableToken, BurnableToken  {
    string public constant name = "TRU Token";
    string public constant symbol = "TRU";
    uint8 public constant decimals = 8;

//    event Burn(address indexed from, uint256 amount);

    function () public payable {
        if (msg.value > 0) {
            balances[msg.sender] += msg.value;
            totalSupply_ = totalSupply_.add(msg.value);
        }
    }

//    function burn(address _from, uint _amount) onlyOwner returns (bool) {
//        require(balances[_from] >= _amount);
//        totalSupply_ = totalSupply_.sub(_amount);
//        balances[_from] = balances[_from].sub(_amount);
//        emit Burn(_from, _amount);
//        return true;
//    }
}
