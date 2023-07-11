import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-card',
  templateUrl: './card.component.html',
  styleUrls: ['./card.component.scss'],
})
export class CardComponent implements OnInit {
  @Input() isActive: boolean = false;
  @Input() address;
  @Input() results;
  constructor() {}

  ngOnInit(): void {}
}
