import { NgClass, NgStyle } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-loading-spinner',
  imports: [
    NgStyle, NgClass
  ],
  templateUrl: './loading-spinner.component.html',
  styleUrl: './loading-spinner.component.css'
})
export class LoadingSpinnerComponent implements OnInit {
  @Input() width: string = "60px"
  @Input() height: string = "60px"
  widthNumeric: number = 60;
  ngOnInit() {
    this.widthNumeric = parseInt(this.width);
  }
}
