import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-a2',
  templateUrl: './a2.component.html',
  styleUrls: ['./a2.component.css'],
})
export class A2Component implements OnInit {
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
