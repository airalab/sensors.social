import { MessageProviderIpfs, Messenger, Account } from "robonomics-js";
import moment from "moment";
import { init as initIpfs } from "../utils/ipfs";
import { parseResult, getAgents } from "../utils/utils";

class IpfsProvider {
  constructor(config) {
    this.isReady = false;
    this.whiteListAccounts = [];
    this.messenger = null;
    this.init(config).then(() => {
      this.isReady = true;
    });
  }

  async init(config) {
    const ipfs = await initIpfs(config);
    ipfs.id((_, r) => {
      if (/go/i.test(r.agentVersion)) {
        ipfs.swarm.connect("/dnsaddr/bootstrap.aira.life", console.log);
      }
    });
    this.whiteListAccounts = getAgents();
    const messageProvider = new MessageProviderIpfs(ipfs);
    await messageProvider.ready();
    this.messenger = new Messenger(
      messageProvider.createChannel("airalab.lighthouse.5.robonomics.eth")
    );
  }

  ready() {
    return new Promise((res) => {
      const t = setInterval(() => {
        if (this.isReady) {
          res();
          clearInterval(t);
        }
      }, 100);
    });
  }

  canExport() {
    return false;
  }

  getHistory() {
    return [];
  }

  watch(cb) {
    this.messenger.onResult((err, msg) => {
      if (err) {
        console.error(err.message);
        return;
      }
      if (msg.liability === "0x0000000000000000000000000000000000000000") {
        const sender = Account.recoveryMessage(msg);
        if (this.whiteListAccounts.includes(sender.toLowerCase())) {
          // console.log(`new msg from ${sender}`);
          parseResult(msg.result).then((result) => {
            if (result["/geo"]) {
              cb({
                sender,
                data: result["/data"],
                geo: result["/geo"],
                timestamp: moment().format("x"),
              });
            } else {
              console.log(`skip ${msg.result} from ${sender}`);
            }
          });
        }
      }
    });
  }
}

export default IpfsProvider;
