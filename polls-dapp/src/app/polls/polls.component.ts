import { Component, OnInit } from '@angular/core';
import { PollsSmartContractService } from '../services/polls-smart-contract.service';

@Component({
  selector: 'app-polls',
  templateUrl: './polls.component.html',
  styleUrls: ['./polls.component.scss'],
})
export class PollsComponent implements OnInit {
  isLoading: boolean;
  nonActivePollResults;
  activePolls;
  constructor(private pollsSmartContractService: PollsSmartContractService) {}

  ngOnInit(): void {
    this.init();
  }

  async init() {
    this.isLoading = true;

    this.activePolls = await this.pollsSmartContractService.getActivePolls();
    this.nonActivePollResults =
      await this.pollsSmartContractService.getNonActivePollResults();

      this.isLoading = false;
  }
}
