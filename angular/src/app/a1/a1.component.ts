import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-a1',
  templateUrl: './a1.component.html',
  styleUrls: ['./a1.component.css'],
})
export class A1Component implements OnInit {
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
