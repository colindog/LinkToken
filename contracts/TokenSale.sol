pragma solidity ^0.4.11;


import "./Ownable.sol";


/**
 * @title TokenSale
 * @dev The TokenSale contract accepts payments when it is active and rejects them otherwise.
 * Only the owner can activate, deactivate, and withdraw funds from the token sale contract.
 */

contract TokenSale is Ownable {
  bool public active;

  event Payment(address indexed from, uint indexed amount);

  /**
   * @dev The TokenSale constructor constructor sets the owner.
   */
  function TokenSale(address _owner)
  public {
    transferOwnership(_owner);
  }

  function ()
  public payable onlyActive {
    Payment(msg.sender, msg.value);
  }

  /**
   * @dev Allows the owner to activate the contract, enabling payments to be received.
   */
  function activate()
  public onlyOwner {
    active = true;
  }

  /**
   * @dev Allows the owner to deactivate the contract, disabling payments.
   */
  function deactivate()
  public onlyOwner {
    active = false;
  }

  /**
   * @dev Allows the owner to withdraw the sale funds.
   */
  function withdraw()
  public onlyOwner {
    owner.transfer(this.balance);
  }


  // MODIFIERS

  modifier onlyActive {
    require(active);
    _;
  }

}
