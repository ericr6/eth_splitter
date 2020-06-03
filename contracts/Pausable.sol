pragma solidity ^0.5.0;


import "./Ownable.sol";


/**
 * @title Pausable
 * @dev Base contract which allows children to implement an emergency stop mechanism.
 */
contract Pausable is Ownable {
  event Pause();
  event Resume();

  bool private paused = false;


  /**
   * @dev Modifier to make a function callable only when the contract is not paused.
   */
  modifier whenResume() {
    require(!paused, "paused must be false");
    _;
  }

  /**
   * @dev Modifier to make a function callable only when the contract is paused.
   */
  modifier whenPaused() {
    require(paused, "paused is not true");
    _;
  }

  /**
   * @dev called by the owner to pause, triggers stopped state
   */
  function pause() onlyOwner whenResume public {
    paused = true;
    emit Pause();
  }

  /**
   * @dev called by the owner to resume, returns to normal state
   */
  function resume() onlyOwner whenPaused public {
    paused = false;
    emit Resume();
  }
}
