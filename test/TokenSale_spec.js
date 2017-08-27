'use strict';

require('./support/helpers.js');

contract('TokenSale', () => {
  let TokenSale = artifacts.require("./contracts/TokenSale.sol");
  let deployer, owner, purchaser, sale;

  beforeEach(async () => {
    deployer = Accounts[0];
    owner = Accounts[1];
    purchaser = Accounts[2];
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
      'withdraw',
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

  describe("the fallback function", () => {
    let purchaseAmount = toWei(10);

    context("when the contract is active", () => {
      beforeEach(async () => {
        await sale.activate({from: owner});
        let active = await sale.active.call();
        assert(active);
      });

      it("accepts the payment", async () => {
        let saleBalance = await getBalance(sale.address);

        let txid = await sendTransaction({
          from: purchaser,
          to: sale.address,
          value: purchaseAmount,
        });
        let receipt = await getTxReceipt(txid);

        let postSale = await getBalance(sale.address);
        assert.equal(saleBalance.add(purchaseAmount).toString(), postSale.toString());

        console.log(receipt);
        assert.equal(receipt.gasUsed.toString(), '21000');
      });

      it("logs a payment event reporting the purchaser and amount", async () => {
        let events = await getEvents(sale);
        assert.equal(events.length, 0);

        await sendTransaction({
          from: purchaser,
          to: sale.address,
          value: purchaseAmount,
        });

        events = await getEvents(sale);
        assert.equal(events.length, 1);

        let event = events[0];
        assert.equal(event.args.from, purchaser);
        assert.equal(event.args.amount.toString(), purchaseAmount.toString());
      });
    });

    context("when the contract is deactivated", () => {
      beforeEach(async () => {
        let active = await sale.active.call();
        assert(!active);
      });

      it("does NOT accept payment", async () => {
        let saleBalance = await getBalance(sale.address);

        await assertActionThrows(async () => {
          await sendTransaction({
            from: purchaser,
            to: sale.address,
            value: purchaseAmount,
          });
        });

        let postSale = await getBalance(sale.address);
        assert.equal(saleBalance.toString(), postSale.toString());
      });

      it("does NOT log an event", async () => {
        await assertActionThrows(async () => {
          await sendTransaction({
            from: purchaser,
            to: sale.address,
            value: purchaseAmount,
          });
        });

        let events = await getEvents(sale);
        assert.equal(events.length, 0);
      });
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

  describe("withdraw", () => {
    let ownerBalance, saleBalance;

    beforeEach(async () => {
      let purchasedAmount = toWei(1);

      await sale.activate({from: owner});
      await sendTransaction({
        from: purchaser,
        to: sale.address,
        value: purchasedAmount,
      });

      saleBalance = await getBalance(sale.address);
      assert.equal(saleBalance.toString(), purchasedAmount.toString());

      ownerBalance = await getBalance(owner);
    });

    context("when it is called by the owner", () => {
      it("moves the sale funds to the owner's account", async () => {
        await sale.withdraw({from: owner});

        let postSaleBalance = await getBalance(sale.address);
        assert.equal(postSaleBalance.toString(), '0');

        let postOwnerBalance = await getBalance(owner);
        let soldSubGas = saleBalance.minus(toWei(0.003));
        assert.isAbove(postOwnerBalance.toString(), ownerBalance.add(soldSubGas).toString(), );
      });
    });

    context("when it is called by someone other than the owner", () => {
      it("does NOT move any of the sale funds", async () => {
        await assertActionThrows(async () => {
          await sale.withdraw({from: deployer});
        });

        let postSaleBalance = await getBalance(sale.address);
        assert.equal(postSaleBalance.toString(), saleBalance.toString());
      });
    });
  });
});
