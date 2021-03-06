const Splitter = artifacts.require("Splitter");
const Promise = require("bluebird");
Promise.promisifyAll(web3.eth, { suffix: "Promise" });
const truffleAssert = require('truffle-assertions');
const BN = web3.utils.BN
const NULL = "0x0000000000000000000000000000000000000000";


contract('Splitter', (accounts) => {

  const [bob, carol, alice, jack] = accounts;
  let splitterInstance;

  beforeEach("deploy Splitter", async function()
      {
          splitterInstance = await Splitter.new(bob, carol, { from: alice });
      });
  it('check split correctly', async () => {

     const txObj = await  splitterInstance.split(bob, carol, { from: alice , value: 4 });
     truffleAssert.eventEmitted(txObj, 'SplitongoingEvent', (ev) => { return ev.sender === alice && ev.amount.toString() === "4" && ev.receiverA === bob && ev.receiverB === carol;});
     const bobBalance = (await splitterInstance.balances.call(bob, {from: alice})).toString();
     const carolBalance = (await splitterInstance.balances.call(carol, {from: carol})).toString();
     assert.strictEqual(bobBalance, "2", "Amount wasn't correctly sent to the receiverA");
     assert.strictEqual(carolBalance, "2", "Amount wasn't correctly sent to the receiverB");
  });

  it("reject call with invalid receiver address", async function() {

     await truffleAssert.reverts(splitterInstance.split(NULL, carol, { from: alice, value: 4 }),'invalid receiver address');
     await truffleAssert.reverts(splitterInstance.split(bob, NULL,  { from: alice }),'invalid receiver address');
     await truffleAssert.reverts(splitterInstance.split(NULL, NULL, { from: alice }),'invalid receiver address');
  });

  it("reject call with invalid sender address", async function() {

     await truffleAssert.reverts(splitterInstance.split(bob, alice, { from: alice }),'sender cannot be recipient');
     await truffleAssert.reverts(splitterInstance.split(alice, bob, { from: alice }),'sender cannot be recipient');
  });

  it('accept two successive split calls', async () => {

    const txObj = await  splitterInstance.split(bob, carol, { from: alice , value: 4 });
    const txObj2 = await  splitterInstance.split(jack, carol, { from: alice , value: 8 });
    const carolBalance = (await splitterInstance.balances.call(carol, {from: carol})).toString();
    const bobBalance = (await splitterInstance.balances.call(bob, {from: carol})).toString();
    const jackBalance = (await splitterInstance.balances.call(jack, {from: jack})).toString();
    assert.strictEqual(carolBalance, "6", "not sent correctly to the receiver carol");
    assert.strictEqual(jackBalance, "4", "not sent correctly to the receiver jack");
    assert.strictEqual(bobBalance, "2", "not sent correctly to the receiver bob ");
  });

  it('correctly split test with 2 operations', async () => {
    const txObj0 = await  splitterInstance.split(bob, jack, { from: alice , value: 1 });
    const bobBalance1 = (await splitterInstance.balances.call(bob, {from: bob})).toString();
    const txObj = await  splitterInstance.split(bob, carol, { from: alice , value: 4 });
    const bobBalance2 = (await splitterInstance.balances.call(bob, {from: bob})).toString();
    assert.equal( new BN(bobBalance2).sub(new BN(bobBalance1)), 2, "check during the split f");
  });

  it('correctly withdrawn inside the contract, check event and withdraw call, odd case ', async () => {
    const txObj = await  splitterInstance.split(bob, carol, { from: alice , value: 12 });
    const txObj1 = await  splitterInstance.withdraw({from: bob});
    truffleAssert.eventEmitted(txObj1, 'WithdrawEvent', (ev) => { return ev.sender === bob && ev.amount.toString() === "6" ;});
    const bobBalance3 = (await splitterInstance.balances.call(bob, {from: bob})).toString();
    assert.strictEqual(bobBalance3, "0", "withdraw check");
  });


  it('correctly withdrawn inside the contract, even case', async () => {

    const txObj = await  splitterInstance.split(bob, carol, { from: alice , value: 5 });
    truffleAssert.eventEmitted(txObj, 'SplitongoingEvent', (ev) => { return ev.sender === alice && ev.amount.toString() === "5" && ev.receiverA === bob && ev.receiverB === carol;});
    const bobBalance = (await splitterInstance.balances.call(bob, {from: bob})).toString();
    assert.strictEqual(bobBalance, "2", "not sent correctly to the receiverA");
    const txObj1 = await  splitterInstance.withdraw({from: bob});
    truffleAssert.eventEmitted(txObj1, 'WithdrawEvent', (ev) => { return ev.sender === bob && ev.amount.toString() === "2" ;});

    const bobBalance2 = (await splitterInstance.balances.call(bob, {from: bob})).toString();
    assert.strictEqual(bobBalance2, "0", "not withdrawn correctly by the receiverA");
  });

  it('the sender should withdraw correctly inside contract, even case', async () => {

    const txObj = await  splitterInstance.split(bob, carol, { from: alice , value: 5 });
    const aliceBalance = (await splitterInstance.balances.call(alice, {from: alice})).toString();
    assert.strictEqual(aliceBalance, "1", "not saved correctly for the sender");
    const txObj1 = await  splitterInstance.withdraw({from: alice});
    const aliceBalance2 = (await splitterInstance.balances.call(alice, {from: alice})).toString();
    assert.strictEqual(aliceBalance2, "0", "not withdrawn correctly by the sender");
  });

  it('a receiver should withdraw correctly, check outside contract, gas included', async () => {

    const bobBalance = new BN(await web3.eth.getBalance(bob));
    const txObj_split = await  splitterInstance.split(bob, carol, { from: alice , value: 4 });
    const txObj_withdraw = await  splitterInstance.withdraw({from: bob});
    const bobBalancePost = new BN(await web3.eth.getBalance(bob));
    const gasUsed = txObj_withdraw.receipt.gasUsed;
    const _tx = await web3.eth.getTransaction(txObj_withdraw.tx);
    const gasPrice = _tx.gasPrice;
    const withdrawCost = gasUsed * gasPrice ;
    const effectiveWithdrawal = new BN(bobBalancePost).sub(new BN(bobBalance)).add(new BN(withdrawCost)).toString(10);
    assert.equal(effectiveWithdrawal, 2, "not correctly withdrawn, gas checked ");
  });

  it('a receiver should withdraw correctly, check outside contract, gas included, alternative test', async () => {

      const txObj_split = await splitterInstance.split(bob, carol, { from: alice , value: 4 });
      const bobBalanceBefore = new BN(await web3.eth.getBalance(bob));
      const txObj_withdraw = await splitterInstance.withdraw({from: bob});
      const bobBalanceAfter = new BN(await web3.eth.getBalance(bob));
      const _tx = await web3.eth.getTransaction(txObj_withdraw.tx);
      const gasUsed = txObj_withdraw.receipt.gasUsed;
      const gasPrice = _tx.gasPrice;
      const withdrawCost = new BN(gasUsed) * new BN(gasPrice) ;
      const rhs = new BN(bobBalanceBefore).add(new BN("2")).sub(new BN(withdrawCost)).toString(10);
      assert.equal(new BN(bobBalanceAfter), rhs, "not correctly withdrawn, gas checked, alternative test");
    });
});
