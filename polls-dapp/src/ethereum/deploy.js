const path = require('path');
const fs = require('fs-extra');
const HDWalletProvider = require('@truffle/hdwallet-provider');
const { Web3 } = require('web3'); 
const Polls = require('./build/Polls.json');

const abi = Polls.abi;
const bytecode = Polls.evm.bytecode.object;

const mnemonic = '12 words... it is private :)';

const provider = new HDWalletProvider(
  mnemonic,
  'https://sepolia.infura.io/v3/90b28c1c471344deb7ee99594c0876a7',
);

const web3 = new Web3(provider);

const deploy = async () => {
  console.log('Start deployment');
  const accounts = await web3.eth.getAccounts();

  console.log('Attempting to deploy from account', accounts[0]);
  let result;

  try {
    result = await new web3.eth.Contract(abi)
      .deploy({ data: '0x' + bytecode })
      .send({ from: accounts[0], gas: 9000000 });
  } catch (error) {
    console.error('Error: ', error);
  }

  console.log('Deployment completed');
  console.log(result.options.address);

  fs.outputFileSync(
    path.resolve(__dirname, 'contractAddress.js'),
    `const address = '${result.options.address}';\nmodule.exports = { address };\n`
  );
}

deploy();