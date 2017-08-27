'use strict';

require('./support/helpers.js');

contract('TokenSale', () => {
  let TokenSale = artifacts.require("./contracts/TokenSale.sol");
  let deployer, owner, sale;

  beforeEach(async () => {
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
      'activate',
      'deactivate',
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

  describe("#activate", () => {
    beforeEach(async () => {
      let active = await sale.active.call();
      assert(!active);
    });

    context("when it is called by the owner", () => {
      it("sets the contract to activated", async () => {
        await sale.activate({from: owner});

        let active = await sale.active.call();
        assert(active);
      });
    });

    context("when it is called by someone other than the owner", () => {
      it("does NOT change the state of the contract", async () => {
        await assertActionThrows(async () => {
          await sale.activate({from: deployer});
        });

        let active = await sale.active.call();
        assert(!active);
      });
    });
  });

  describe("#deactivate", () => {
    beforeEach(async () => {
      await sale.activate({from: owner});
      let active = await sale.active.call();
      assert(active);
    });

    context("when it is called by the owner", () => {
      it("sets the contract to deactivated", async () => {
        await sale.deactivate({from: owner});

        let active = await sale.active.call();
        assert(!active);
      });
    });

    context("when it is called by someone other than the owner", () => {
      it("does NOT change the state of the contract", async () => {
        await assertActionThrows(async () => {
          await sale.deactivate({from: deployer});
        });

        let active = await sale.active.call();
        assert(active);
      });
    });
  });
});
