import { Injectable } from '@angular/core';
import { Web3Service } from './web3.service';

const PollsBuild = require('../../ethereum/build/Polls.json');
const PrivatePollBuild = require('../../ethereum/build/PrivatePoll.json');
const PublicPollBuild = require('../../ethereum/build/PublicPoll.json');

const mainAddress = '0x5c3f427011cf36258d1746bf5fe40f1df977d069';
//const testPublicPollAddress = '0xF954DD0aa09e3868824F901f893cA5fFCe704D35';

@Injectable({
  providedIn: 'root',
})
export class SmartContractService {
  private pollsContract;
  private web3;

  constructor(private web3Service: Web3Service) {
    this.web3 = this.web3Service.getInstance();
    this.pollsContract = new this.web3.eth.Contract(
      PollsBuild.abi,
      mainAddress
    );
  }

  getPollsContract() {
    return this.pollsContract;
  }

  getPrivatePollContract(pollAddress: string) {
    return new this.web3.eth.Contract(PrivatePollBuild.abi, pollAddress);
  }

  getPublicPollContract(pollAddress: string) {
    return new this.web3.eth.Contract(PublicPollBuild.abi, pollAddress);
  }

  getAccount() {
    return this.web3Service.getAccount();
  }
}
