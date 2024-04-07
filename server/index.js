const express = require("express");
const app = express();
const cors = require("cors");
const port = 3042;
const { secp256k1 } = require("ethereum-cryptography/secp256k1.js");
const { keccak256 } = require("ethereum-cryptography/keccak");
const { utf8ToBytes } = require("ethereum-cryptography/utils");

app.use(cors());
app.use(express.json());

const balances = {
  "0x1": 100,
  "0x2": 50,
  "0x3": 75,
};

const PrivateKeys = {
  "0x1": secp256k1.utils.randomPrivateKey(),
  "0x2": secp256k1.utils.randomPrivateKey(),
  "0x3": secp256k1.utils.randomPrivateKey(),
};

const PublicKeys = {
  "0x1": secp256k1.getPublicKey(PrivateKeys["0x1"]),
  "0x2": secp256k1.getPublicKey(PrivateKeys["0x2"]),
  "0x3": secp256k1.getPublicKey(PrivateKeys["0x3"]),
};

app.get("/balance/:address", (req, res) => {
  const { address } = req.params;
  const balance = balances[address] || 0;
  res.send({ balance });
});

app.post("/send", (req, res) => {
  const { sender, recipient, amount } = req.body;

  setInitialBalance(sender);
  setInitialBalance(recipient);

  //Generate message hash and sign it
  const message = utf8ToBytes(`Transfer ${amount} from ${sender} to ${recipient}`);
  const messageHash = keccak256(message);
  const signature = secp256k1.sign(messageHash, PrivateKeys[sender]);

  //Verify the signature
  const isValid = secp256k1.verify(signature, messageHash, PublicKeys[sender]);
  if (!isValid) {
    res.status(400).send({ message: "Invalid Signature!" });
  }
  else {
    if (balances[sender] < amount) {
      res.status(400).send({ message: "Not enough funds!" });
    } else {
      balances[sender] -= amount;
      balances[recipient] += amount;
      res.send({ balance: balances[sender] });
    }
  }


});

app.listen(port, () => {
  console.log(`Listening on port ${port}!`);
});

function setInitialBalance(address) {
  if (!balances[address]) {
    balances[address] = 0;
  }
}
