const Splitter = artifacts.require("Splitter");
const Promise = require("bluebird");
Promise.promisifyAll(web3.eth, { suffix: "Promise" });
const truffleAssert = require('truffle-assertions');
const BN = require('bn.js');
const NULL = "0x0000000000000000000000000000000000000000";


contract('Splitter', (accounts) => {

  const [bob, carol, alice] = accounts;
  let splitterInstance;

  beforeEach("deploy Splitter", async function()
      {
          splitterInstance = await Splitter.new(bob, carol, { from: alice });
      });

  it('check split correctly', async () => {

     let txObj = await  splitterInstance.split(bob, carol, { from: alice , value: 4 });
     truffleAssert.eventEmitted(txObj, 'SplitongoingEvent');
     const bobBalance = (await splitterInstance.balances.call(bob, {from: alice})).toNumber();
     const carolBalance = (await splitterInstance.balances.call(carol, {from: carol})).toNumber();
     assert.equal(bobBalance, 2, "Amount wasn't correctly sent to the receiverA");
     assert.equal(carolBalance, 2, "Amount wasn't correctly sent to the receiverB");
  });

  it("reject call with invalid receiver address", async function() {

     await truffleAssert.reverts(splitterInstance.split(NULL, carol, { from: alice, value: 4 }),'invalid receiver address');
     await truffleAssert.reverts(splitterInstance.split(bob, NULL,  { from: alice }),'invalid receiver address');
     await truffleAssert.reverts(splitterInstance.split(NULL, NULL, { from: alice }),'invalid receiver address');
  });

  it("reject calll with invalid sender address", async function() {

     await truffleAssert.reverts(splitterInstance.split(bob, alice, { from: alice }),'sender cannot be recipient');
     await truffleAssert.reverts(splitterInstance.split(alice, bob, { from: alice }),'sender cannot be recipient');
  });

  it('accept two successive split calls', async () => {

    let txObj = await  splitterInstance.split(bob, carol, { from: alice , value: 4 });
    let txObj2 = await  splitterInstance.split(bob, carol, { from: alice , value: 8 });
    const carolBalance = (await splitterInstance.balances.call(carol, {from: carol})).toNumber();
    assert.equal(carolBalance, 6, "not sent correctly to the receiver");
  });

  it('correctly withdrawn inside the contract, odd case ', async () => {

    let txObj = await  splitterInstance.split(bob, carol, { from: alice , value: 4 });
    const bobBalance = (await splitterInstance.balances.call(bob, {from: bob})).toNumber();
    assert.equal(bobBalance, 2, "not sent correctly to the receiver");
    let txObj1 = await  splitterInstance.withdraw({from: bob});
    truffleAssert.eventEmitted(txObj1, 'WithdrawEvent');
    const bobBalance2 = (await splitterInstance.balances.call(bob, {from: bob})).toNumber();
    assert.equal(bobBalance2, 0, "not sent correctly to the receiver");
  });

  it('correctly withdrawn inside the contract, even case', async () => {

    let txObj = await  splitterInstance.split(bob, carol, { from: alice , value: 5 });
    const bobBalance = (await splitterInstance.balances.call(bob, {from: bob})).toNumber();
    assert.equal(bobBalance, 2, "not sent correctly to the receiverA");
    let txObj1 = await  splitterInstance.withdraw({from: bob});
    truffleAssert.eventEmitted(txObj1, 'WithdrawEvent');
    const bobBalance2 = (await splitterInstance.balances.call(bob, {from: bob})).toNumber();
    assert.equal(bobBalance2, 0, "not withdrawn correctly by the receiverA");
  });

  it('the sender should withdraw correctly inside contract, even case', async () => {

    let txObj = await  splitterInstance.split(bob, carol, { from: alice , value: 5 });
    const aliceBalance = (await splitterInstance.balances.call(alice, {from: alice})).toNumber();
    assert.equal(aliceBalance, 1, "not saved correctly for the sender");
    let txObj1 = await  splitterInstance.withdraw({from: alice});
    const aliceBalance2 = (await splitterInstance.balances.call(alice, {from: alice})).toNumber();
    assert.equal(aliceBalance2, 0, "not withdrawn correctly by the sender");
  });


  it('a receiver should withdraw correctly, check outside contract, gas included', async () => {

    let bobBalance = new web3.utils.BN(await web3.eth.getBalance(bob));
    let txObj_split = await  splitterInstance.split(bob, carol, { from: alice , value: 4 });
    let txObj_withdraw = await  splitterInstance.withdraw({from: bob});
    let bobBalancePost = new web3.utils.BN(await web3.eth.getBalance(bob));
    let gasUsed = txObj_withdraw.receipt.gasUsed;
    let _tx = await web3.eth.getTransaction(txObj_withdraw.tx);
    let gasPrice = _tx.gasPrice;
    let withdrawCost = gasUsed * gasPrice ;
    let effectiveWithdrawal = new BN(bobBalancePost).sub(new BN(bobBalance)).add(new BN(withdrawCost)).toString(10);
    assert.equal(effectiveWithdrawal, 2, "not correctly withdrawn, gas checked ");
  });

});