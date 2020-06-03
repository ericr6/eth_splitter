pragma solidity >=0.4.22 <0.7.0;

/**
 * @title Owner
 * @dev Set & change owner
 */
contract Splitter {

   event SplitongoingEvent(address sender, uint amount, address receiverA, address receiverB);
   event WithdrawEvent(address sender, uint amount);

   mapping(address => uint) public balances;
   
   function split(address receiverA, address receiverB) public payable {
        require( receiverA != address(0x0) && receiverB != address(0x0), "invalid receiver address");
        require( receiverA != receiverB, "receivers must be different");
        require( receiverA != msg.sender && receiverB != msg.sender, "sender cannot be recipient");
        require( msg.value > 0,"to Split nothing, you dont need me.");

        //roundo-off error not adressed.  
        uint _val = msg.value/2;
        balances[receiverA] += _val;
        balances[receiverB] += _val;

        emit SplitongoingEvent(msg.sender, msg.value, receiverA, receiverB);
    }
    
    // Withdraw function.
    function withdraw() public {
        require(balances[msg.sender] >0);
        uint _val = balances[msg.sender];
        balances[msg.sender] = 0;
        msg.sender.transfer(_val);
        emit WithdrawEvent(msg.sender, _val);
    }

    function getBalance() public view returns  (uint) {
        return (balances[msg.sender]);
    }
}
