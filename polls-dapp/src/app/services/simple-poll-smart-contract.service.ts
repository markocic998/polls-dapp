import { Injectable } from '@angular/core';
import { SmartContractService } from './smart-contract.service';
import { GAS, addressZero } from '../helpers/constants';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SimplePollSmartContractService {
  private simplePollContract;
  private account;
  isPrivateSubject = new Subject<boolean>();
  private isPrivate: boolean;

  constructor(private smartContractService: SmartContractService) {
    this.account = this.smartContractService.getAccount();
  }

  async setSimplePollContract(pollAddress: string) {
    this.isPrivate = true;
    this.isPrivateSubject.next(this.isPrivate);
    this.simplePollContract =
      this.smartContractService.getPrivatePollContract(pollAddress);
    const creator = await this.getCreator();
    const voter = await this.getVoter(creator);
    if (!voter.canVote) {
      this.isPrivate = false;
      this.isPrivateSubject.next(this.isPrivate);
      this.simplePollContract =
        this.smartContractService.getPublicPollContract(pollAddress);
    }
  }

  async getCreator() {
    const creator = await this.simplePollContract.methods['creator']().call();
    return creator;
  }

  async getVoter(voterAddress: string) {
    const voter = await this.simplePollContract.methods['voters'](
      voterAddress
    ).call();
    return voter;
  }

  async getTopic() {
    const topic = await this.simplePollContract.methods['topic']().call();
    return topic;
  }

  async getDescription() {
    const description = await this.simplePollContract.methods[
      'description'
    ]().call();
    return description;
  }

  async getDeadline() {
    const deadline = await this.simplePollContract.methods['deadline']().call();
    return deadline;
  }

  async getResults() {
    const results = await this.simplePollContract.methods[
      'getResults'
    ]().call();
    return results;
  }

  async isDeadlineExpired() {
    const isDeadlineExpired = await this.simplePollContract.methods[
      'isDeadlineExpired'
    ]().call();
    return isDeadlineExpired;
  }

  async getWinnerName() {
    const winnerName = await this.simplePollContract.methods[
      'winnerName'
    ]().call();
    return winnerName;
  }

  async hasVoted() {
    const hasVoted = await this.simplePollContract.methods['hasVoted'](
      this.account
    ).call();
    return hasVoted;
  }

  async giveRightToVote(to: string) {
    await this.simplePollContract.methods['giveRightToVote'](to).send({
      from: this.account,
      gas: GAS,
    });
  }

  async vote(proposalIndex: number) {
    await this.simplePollContract.methods['vote'](proposalIndex).send({
      from: this.account,
      gas: GAS,
    });
  }

  async delegate(to: string) {
    await this.simplePollContract.methods['delegate'](to).send({
      from: this.account,
      gas: GAS,
    });
  }
}
