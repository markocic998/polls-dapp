import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SimplePollSmartContractService } from '../services/simple-poll-smart-contract.service';
import { Subscription } from 'rxjs';
import { PollsSmartContractService } from '../services/polls-smart-contract.service';
import { addressZero } from '../helpers/constants';

@Component({
  selector: 'app-poll',
  templateUrl: './poll.component.html',
  styleUrls: ['./poll.component.scss'],
})
export class PollComponent implements OnInit, OnDestroy {
  address!: string;
  account: string;
  isPrivatePoll: boolean;
  subject: string;
  description: string;
  creator: string;
  rating;
  deadline;
  isDeadlineExpired: boolean;
  proposals;
  winner: string;
  rate: number;
  myVote: number = 0;
  delegatedTo: string;
  grantTo: string;
  hasRated;
  addressForLoading: string;
  private sub: Subscription;

  voter;

  isLoading: boolean;

  voteTooltip: string = '';
  delegateTooltip: string = '';
  grantTooltip: string = '';

  constructor(
    private route: ActivatedRoute,
    private simplePollSmartContractService: SimplePollSmartContractService,
    private pollsSmartContractService: PollsSmartContractService
  ) {}

  ngOnInit(): void {
    this.address = this.route.snapshot.paramMap.get('id');
    this.sub = this.simplePollSmartContractService.isPrivateSubject.subscribe(
      (value) => {
        this.isPrivatePoll = value;
      }
    );
    this.account = this.pollsSmartContractService.getAccount();
    if (this.address != null) {
      this.simplePollSmartContractService.setSimplePollContract(this.address);
      this.init();
    }
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  async loadPoll() {
    if (this.addressForLoading != null) {
      this.simplePollSmartContractService.setSimplePollContract(
        this.addressForLoading
      );
      this.init();
      this.address = this.addressForLoading;
    } else {
      alert('Enter a contract address of poll you want to load.');
    }
  }

  private async init() {
    this.isLoading = true;

    this.subject = await this.simplePollSmartContractService.getTopic();
    this.creator = await this.simplePollSmartContractService.getCreator();
    this.description =
      await this.simplePollSmartContractService.getDescription();
    this.deadline =
      Number(await this.simplePollSmartContractService.getDeadline()) * 1000;
    this.rating = await this.pollsSmartContractService.getRating(this.creator);
    this.isDeadlineExpired =
      await this.simplePollSmartContractService.isDeadlineExpired();
    this.proposals = await this.simplePollSmartContractService.getResults();
    this.voter = await this.simplePollSmartContractService.getVoter(
      this.account
    );
    this.hasRated = await this.pollsSmartContractService.hasRated(
      this.creator,
      this.address
    );
    this.winner = await this.simplePollSmartContractService.getWinnerName();

    if (this.shouldDisableVoteButton()) {
      if (this.voter.delegate == addressZero) {
        this.voteTooltip =
          'You have already voted for: ' + this.proposals[this.voter.vote].name;
        this.myVote = Number(this.voter.vote);
      } else {
        this.voteTooltip = 'You have already delegated your vote';
        this.myVote = 0;
      }
    } else {
      this.voteTooltip = '';
      this.myVote = 0;
    }

    if (this.shouldDisableDelegateButton()) {
      if (this.voter.delegate != addressZero) {
        this.delegateTooltip =
          'You have already delegated to: ' + this.voter.delegate;
        this.delegatedTo = this.voter.delegate;
      } else {
        this.delegateTooltip =
          'You have already voted, so you can not delegate anymore';
          this.delegatedTo = '';
      }
    } else {
      this.delegateTooltip = '';
      this.delegatedTo = '';
    }

    if (this.shouldDisableGrantButton()) {
      this.grantTooltip =
        'You are not creator, so you can not give rights to vote';
    } else {
      this.grantTooltip = '';
    }

    this.isLoading = false;
  }

  rateCreator() {
    if (this.rate > 0 && this.rate < 6) {
      this.pollsSmartContractService.rate(this.address, this.rate);
    } else {
      alert('Rate should be between 1 and 5.');
    }
  }

  vote() {
    this.simplePollSmartContractService.vote(this.myVote);
  }

  delegate() {
    if (this.delegatedTo != this.account) {
      this.simplePollSmartContractService.delegate(this.delegatedTo);
    } else {
      alert('Self-delegation is not allowed.');
    }
  }

  giveRightToVote() {
    if (this.grantTo != this.account) {
      this.simplePollSmartContractService.giveRightToVote(this.grantTo);
    } else {
      alert('Self-grant is not allowed.');
    }
  }

  shouldDisableVoteButton() {
    return (
      this.voter.voted ||
      (this.isPrivatePoll && !this.voter.canVote) ||
      (!this.isPrivatePoll && this.voter.delegate != addressZero)
    );
  }

  shouldDisableDelegateButton() {
    return this.voter.voted;
  }

  shouldDisableGrantButton() {
    return this.account != this.creator;
  }

  shouldDisableRateButton() {
    return this.creator == this.account || this.hasRated || !this.voter.voted;
  }
}
