const Splitter = artifacts.require("Splitter");
const Promise = require("bluebird");
Promise.promisifyAll(web3.eth, { suffix: "Promise" });
const truffleAssert = require('truffle-assertions');
const BN = require('bn.js');
const NULL = "0x0000000000000000000000000000000000000000";


contract('Splitter', (accounts) => {

  const [bob, carol, alice] = accounts;
  let splitterInstance;

  beforeEach("should deploy Splitter", async function()
      {
          splitterInstance = await Splitter.new(bob, carol, { from: alice });
      });

  it('should split correctly', async () => {

    let txObj = await  splitterInstance.split(bob, carol, { from: alice , value: 4 });
    // Test event
    truffleAssert.eventEmitted(txObj, 'SplitongoingEvent');
    // Test split balances
    const bobBalance = (await splitterInstance.balances.call(bob, {from: alice})).toNumber();
    const carolBalance = (await splitterInstance.balances.call(carol, {from: carol})).toNumber();
    assert.equal(bobBalance, 2, "Amount wasn't correctly taken from the sender");
    assert.equal(carolBalance, 2, "Amount wasn't correctly sent to the receiver");
  });

  it("reject invalid receiver address", async function() {
     await truffleAssert.reverts(splitterInstance.split(NULL, carol, { from: alice, value: 4 }),'invalid receiver address');
     await truffleAssert.reverts(splitterInstance.split(bob, NULL,  { from: alice }),'invalid receiver address');
     await truffleAssert.reverts(splitterInstance.split(NULL, NULL, { from: alice }),'invalid receiver address');
  });

  it("reject invalid sender address", async function() {
     await truffleAssert.reverts(splitterInstance.split(bob, alice, { from: alice }),'sender cannot be recipient');
     await truffleAssert.reverts(splitterInstance.split(alice, bob, { from: alice }),'sender cannot be recipient');
  });

  it('should Two split correctly', async () => {

    let txObj = await  splitterInstance.split(bob, carol, { from: alice , value: 4 });
    let txObj2 = await  splitterInstance.split(bob, carol, { from: alice , value: 8 });
    const carolBalance = (await splitterInstance.balances.call(carol, {from: carol})).toNumber();
    assert.equal(carolBalance, 6, "Amount wasn't correctly sent to the receiver");
  });

  it('should withdraw correctly inside contract', async () => {

    let txObj = await  splitterInstance.split(bob, carol, { from: alice , value: 4 });
    const bobBalance = (await splitterInstance.balances.call(bob, {from: bob})).toNumber();
    assert.equal(bobBalance, 2, "Amount wasn't correctly sent to the receiver");
    let txObj1 = await  splitterInstance.withdraw({from: bob});
    truffleAssert.eventEmitted(txObj1, 'WithdrawEvent');
    const bobBalance2 = (await splitterInstance.balances.call(bob, {from: bob})).toNumber();
    assert.equal(bobBalance2, 0, "Amount wasn't correctly sent to the receiver");
  });

  it('should withdraw correctly, check outside contract', async () => {
    let bobBalance = new web3.utils.BN(await web3.eth.getBalance(bob));
    let txObj_split = await  splitterInstance.split(bob, carol, { from: alice , value: 4 });
    let txObj_withdraw = await  splitterInstance.withdraw({from: bob});
    let bobBalancePost = new web3.utils.BN(await web3.eth.getBalance(bob));
    let gasUsed = txObj_withdraw.receipt.gasUsed;
    let _tx = await web3.eth.getTransaction(txObj_withdraw.tx);
    let gasPrice = _tx.gasPrice;
    let withdrawCost = gasUsed * gasPrice ;
    let effectiveWithdrawal = new BN(bobBalancePost).sub(new BN(bobBalance)).add(new BN(withdrawCost)).toString(10);
    assert.equal(effectiveWithdrawal, 2, "Amount wasn't correctly sent to the receiver");
  });

});