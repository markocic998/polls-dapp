import { Component, OnInit } from '@angular/core';
import { Web3Service } from '../services/web3.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
})
export class NavbarComponent implements OnInit {
  constructor(private web3Service: Web3Service) {}

  ngOnInit(): void {
    
  }
}
