// !!! VALID WITH METAMASK 7.7.9
import "./styles.css";
import { Contract, providers, utils } from "ethers";

import splitterAbi from "./abi.json";
import {
  loginHelper,
  mainContainer,
  userAddressOutput,
  AlicewalletOutput,
  BobwalletOutput,
  CarolwalletOutput,
  splitButton,
  updateButton,
  withdrawButton,
  recv1Input,
  recv2Input,
  amountI
} from "./domElements";

//Goerli
const splitterAddress = "0x42D57334b2568Ca0b4D0F89750363DdbDac8CC82";
//const splitterAddress = "0xCfEB869F69431e42cdB54A4F4f105C19C080A601";

(async () => {
  try {
    mainContainer.hidden = false;
    loginHelper.hidden = true;
    let web3provider = new providers.Web3Provider(window.ethereum);
    await window.ethereum.enable();
    const { chainId } = await web3provider.getNetwork();
    if (chainId !== 5)
      throw new Error(
        `unsupported blockchain, please switch to custom chain(5) + ${chainId}`
      );

    //  const web3signer = web3provider.getSigner();
    //  const ethAddress = await web3signer.getAddress();
    //  console.log("addr", ethAddress);

    const refreshWallets = async () => {
      console.log("call refreshWallets...");
      // Request account access if needed

      await window.ethereum.enable();
      //      let provider = new providers.Web3Provider(window.ethereum);
      //      let web3Signer = provider.getSigner();
      //     let ethAddress = web3Signer.getAddress();
      //      console.log("addr", ethAddress);

      const address = await new providers.Web3Provider(window.ethereum)
        .getSigner()
        .getAddress()
        .catch((e) => console.error(e));
      console.log(`${address}`);
      userAddressOutput.innerText = `Current wallet: ${address}`;

      const balanceAlice = await new providers.Web3Provider(window.ethereum)
        .getBalance("0xd03ea8624C8C5987235048901fB614fDcA89b117")
        .catch((e1) => console.error(e1));
      AlicewalletOutput.innerText = `Alice : ${utils.formatEther(
        balanceAlice
      )}`;

      const balanceCarol = await new providers.Web3Provider(window.ethereum)
        .getBalance("0x22d491Bde2303f2f43325b2108D26f1eAbA1e32b")
        .catch((e2) => console.error(e2));
      CarolwalletOutput.innerText = `Carol : ${utils.formatEther(
        balanceCarol
      )}`;

      const balanceBob = await new providers.Web3Provider(window.ethereum)
        .getBalance("0xFFcf8FDEE72ac11b5c542428B35EEF5769C409f0")
        .catch((e3) => console.error(e3));
      BobwalletOutput.innerText = `Bob    : ${utils.formatEther(balanceBob)}`;

      eventdetection();
    };

    const split = async () => {
      console.log("call split");
      var _receiver1 = recv1Input.value;
      var _receiver2 = recv2Input.value;
      var amount = amountI.value;
      var _amount = utils.parseEther(amount);
      let ethereum = window.ethereum;
      await ethereum.enable();
      const web3provider = new providers.Web3Provider(window.ethereum);
      const web3signer = web3provider.getSigner();
      var splitter_instance = new Contract(
        splitterAddress,
        splitterAbi,
        web3signer
      );
      const txHash = await splitter_instance.split(_receiver1, _receiver2, {
        value: _amount
      });
      const txReceipt = await txHash.wait();
      console.log("split Receipt:", txReceipt);
    };

    const withdraw = async () => {
      console.log("start withdraw");
      let ethereum = window.ethereum;
      await ethereum.enable();
      const web3provider = new providers.Web3Provider(ethereum);
      const web3signer = web3provider.getSigner();
      console.log("start withdraw 2");
      var splitter_instance = new Contract(
        splitterAddress,
        splitterAbi,
        web3signer
      );
      console.log("start withdraw 3");
      const txHash = await splitter_instance.withdraw();
      console.log("start withdraw 4");
      const txReceipt = await txHash.wait();
      console.log("withdraw Receipt:", txReceipt);
    };

    const eventdetection = async () => {
      let provider = new providers.Web3Provider(window.ethereum);
      let topic = utils.id(
        "SplitongoingEvent(address,uint256,address,address)"
      );
      let filter = {
        address: splitterAddress,
        topics: [topic]
      };

      provider.on(filter, (result) => {
        console.log("provider.on", result);
      });

      const web3provider = new providers.Web3Provider(window.ethereum);
      const web3signer = web3provider.getSigner();
      var splitter_instance = new Contract(
        splitterAddress,
        splitterAbi,
        web3signer
      );
      splitter_instance.on(
        "SplitongoingEvent",
        (from, value, to_1, to_2, event) => {
          console.log(
            "event detected at block: ",
            event.blockNumber,
            "from: ",
            from,
            "val: ",
            utils.formatEther(value),
            "to: ",
            to_1,
            to_2
          );
        }
      );
    };
    splitButton.addEventListener("click", split);
    withdrawButton.addEventListener("click", withdraw);
    updateButton.addEventListener("click", refreshWallets);

    //refreshWallets();
  } catch (e) {
    console.error(e.message);
  }
})();
