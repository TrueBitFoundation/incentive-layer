pragma solidity ^0.4.24;

import "zeppelin-solidity/contracts/token/ERC20/MintableToken.sol";
import "zeppelin-solidity/contracts/token/ERC20/BurnableToken.sol";

contract TRU is MintableToken, BurnableToken  {
    string public constant name = "TRU Token";
    string public constant symbol = "TRU";
    uint8 public constant decimals = 8;

    event Mint(address indexed to, uint256 amount);
    event Burn(address indexed from, uint256 amount);

    function () public payable {
        if (msg.value > 0) {
            balances[msg.sender] += msg.value;
        }
    }

//    function mint(address _to, uint _amount) internal returns (bool) {
//        totalSupply_ = totalSupply_.add(_amount);
//        balances[_to] = balances[_to].add(_amount);
//        emit Mint(_to, _amount);
//        emit Transfer(address(0), _to, _amount);
//        return true;
//    }
//
//    function burn(address _from, uint _amount) internal returns (bool) {
//        totalSupply_ = totalSupply_.sub(_amount);
//        balances[_from] = balances[_from].sub(_amount);
//        emit Burn(_from, _amount);
//        emit Transfer(_from, address(0), _amount);
//        return true;
//    }    
}
