import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-a3',
  templateUrl: './a3.component.html',
  styleUrls: ['./a3.component.css'],
})
export class A3Component implements OnInit {
  key: string = 'token';
  token = window.localStorage.getItem(this.key);

  constructor() {}

  ngOnInit(): void {
    this.token = window.localStorage.getItem(this.key);
  }

  updateToken(): void {
    this.token = crypto.randomUUID();
    window.localStorage.setItem(this.key, this.token);
  }
}
