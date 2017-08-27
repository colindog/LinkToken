'use strict';

require('./support/helpers.js');

contract('TokenSale', () => {
  let TokenSale = artifacts.require("./contracts/TokenSale.sol");
  let deployer, owner, sale;

  before(async () => {
    deployer = Accounts[0];
    owner = Accounts[1];
    sale = await TokenSale.new(owner, {from: deployer});
  });

  it("has a limited public ABI", () => {
    let expectedABI = [
      //public attributes
      'owner',
      'active',
      //public functions
      'transferOwnership',
    ];

    checkPublicABI(TokenSale, expectedABI);
  });

  describe("initialization", () => {
    it("sets the owner not to be the deployer", async () => {
      let saleOwner = await sale.owner.call();

      assert.equal(owner, saleOwner);
    });

    it("sets the sale as deactivated", async () => {
      let active = await sale.active.call();

      assert(!active);
    });
  });
});
