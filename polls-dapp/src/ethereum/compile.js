const path = require('path');
const fs = require('fs-extra');
const solc = require('solc');

const buildPath = path.resolve(__dirname, 'build');
fs.removeSync(buildPath);

const simplePollPath = path.resolve(__dirname, 'contracts', 'SimplePoll.sol');
const pollsPath = path.resolve(__dirname, 'contracts', 'Polls.sol');

var input = {
    language: 'Solidity',
    sources: {
        'SimplePoll.sol': {
            content: fs.readFileSync(simplePollPath, 'utf8')
        },
        'Polls.sol': {
            content: fs.readFileSync(pollsPath, 'utf8')
        }
    },
    settings: {
        outputSelection: {
            '*': {
                '*': [ '*' ]
            }
        }
    }
};

var contracts = JSON.parse(solc.compile(JSON.stringify(input))).contracts;
console.log(contracts);

fs.ensureDirSync(buildPath);

// for (let contract in contracts) {
//     fs.outputJsonSync(path.resolve(buildPath, contract + '.json'), contracts[contract]);
// }

const simplePollContracts = contracts['SimplePoll.sol'];
for (let contract in simplePollContracts) {
    fs.outputJsonSync(path.resolve(buildPath, contract + '.json'), simplePollContracts[contract]);
    // fs.outputJsonSync(path.resolve(buildPath, contract + '_evm.json'), simplePollContracts[contract].evm);
    // fs.outputJsonSync(path.resolve(buildPath, contract + '.abi'), simplePollContracts[contract].abi);
    // fs.outputJsonSync(path.resolve(buildPath, contract + '_bytecode'), simplePollContracts[contract].evm.bytecode.object);
}

const pollsContracts = contracts['Polls.sol'];
for (let contract in pollsContracts) {
    fs.outputJsonSync(path.resolve(buildPath, contract + '.json'), pollsContracts[contract]);
    // fs.outputJsonSync(path.resolve(buildPath, contract + '_evm.json'), pollsContracts[contract].evm);
    // fs.outputJsonSync(path.resolve(buildPath, contract + '.abi'), pollsContracts[contract].abi);
    // fs.outputJsonSync(path.resolve(buildPath, contract + '_bytecode'), pollsContracts[contract].evm.bytecode.object);
}
