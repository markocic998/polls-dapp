import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { PollsSmartContractService } from '../services/polls-smart-contract.service';

@Component({
  selector: 'app-create-poll',
  templateUrl: './create-poll.component.html',
  styleUrls: ['./create-poll.component.scss'],
})
export class CreatePollComponent implements OnInit {
  subject: string = '';
  description: string = '';
  proposals: string = '';
  duration: number = 0;
  timeUnit: string = 'seconds';
  isPrivate: boolean = false;

  error: boolean = false;
  errorMessage: string = '';
  isLoading: boolean = false;

  constructor(
    private router: Router,
    private pollsSmartContractService: PollsSmartContractService
  ) {}

  ngOnInit(): void {}

  createNewPoll() {
    if (!this.doesErrorExist()) {
      const separatedProposals: string[] = this.proposals.split(', ');
      if (separatedProposals.length > 1) {
        this.error = false;
        this.errorMessage = '';
        const durationInSeconds: number = this.calculateDurationInSeconds();
        console.log(durationInSeconds);
        if (this.isPrivate) {
          this.pollsSmartContractService.createPrivatePoll(
            this.subject,
            this.description,
            separatedProposals,
            durationInSeconds
          );
        } else {
          this.pollsSmartContractService.createPublicPoll(
            this.subject,
            this.description,
            separatedProposals,
            durationInSeconds
          );
        }
        this.isLoading = true;
        this.navigate();
        this.resetValues();
        this.isLoading = false;
      } else {
        this.error = true;
        this.errorMessage = 'There need to be minimum 2 proposals.';
      }
    }
  }

  private doesErrorExist() {
    if (this.subject == '' || this.description == '' || this.proposals == '') {
      this.error = true;
      this.errorMessage =
        'Subject, description and proposals should not be empty.';
      return true;
    } else if (this.duration < 0) {
      this.error = true;
      this.errorMessage = 'Duration need to be non-negative number.';
      return true;
    } else {
      this.error = false;
      this.errorMessage = '';
      return false;
    }
  }

  private calculateDurationInSeconds(): number {
    let durationInSeconds = this.duration;
    switch (this.timeUnit) {
      case 'minutes':
        durationInSeconds *= 60;
        break;
      case 'hours':
        durationInSeconds *= 60 * 60;
        break;
      case 'days':
        durationInSeconds *= 60 * 60 * 24;
        break;
      case 'weeks':
        durationInSeconds *= 60 * 60 * 24 * 7;
        break;
      default:
        break;
    }
    return durationInSeconds;
  }

  async navigate() {
    // const lastCreatedPoll =
    //   await this.pollsSmartContractService.getLastCreatedPoll();
      //this.router.navigate([`../poll/${lastCreatedPoll}`]);
    //this.router.navigate(['../polls']);
  }

  private resetValues() {
    this.subject = '';
    this.description = '';
    this.proposals = '';
    this.duration = 0;
    this.timeUnit = 'seconds';
    this.isPrivate = false;
  
    this.error = false;
    this.errorMessage= '';
  }
}
