pragma solidity >=0.4.22 <0.7.0;

/**
 * Eric Rodriguez
 * er@iex.ec
 */

import "@openzeppelin/contracts/math/SafeMath.sol";
import "./Ownable.sol";
import "./Pausable.sol";

contract Splitter is Pausable{

   event SplitongoingEvent(address indexed sender, uint amount, address indexed receiverA, address indexed receiverB);
   event WithdrawEvent(address indexed sender, uint amount);

   mapping(address => uint) public balances;

   function split(address receiverA, address receiverB) public whenResume payable {
        require( receiverA != address(0x0) && receiverB != address(0x0), "invalid receiver address");
        require( receiverA != receiverB, "receivers must be different");
        require( receiverA != msg.sender && receiverB != msg.sender, "sender cannot be recipient");
        require( msg.value > 0,"to Split nothing, you dont need me.");

        uint _val = SafeMath.div(msg.value,2);
        balances[receiverA] = SafeMath.add(balances[receiverA], _val);
        balances[receiverB] = SafeMath.add(balances[receiverB], _val);
        emit SplitongoingEvent(msg.sender, msg.value, receiverA, receiverB);
        uint _back = SafeMath.mod(msg.value, 2);
        if (_back != 0){
          balances[msg.sender] = SafeMath.add(balances[msg.sender], _back);
        }
   }

    // Withdraw function.
    function withdraw() public whenResume returns (bool ret) {
        uint _sender_balance = balances[msg.sender];
        require(_sender_balance > 0);
        balances[msg.sender] = 0;
        emit WithdrawEvent(msg.sender, _sender_balance);
        (ret,) = msg.sender.call.value(_sender_balance)("");
        require(ret, "Withdraw failed");
    }

}
