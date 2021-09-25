import { Component, ElementRef, ViewChild, ChangeDetectionStrategy, OnInit, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'infopanel',
  styleUrls: ['./infopanel.component.scss'],
  templateUrl: './infopanel.component.html'
})
export class Infopanel {
  loadXyoExample(): void {    
      this.fireSearchEvent("Xyosted");
  }
  
  loadZubsolvExample(): void {
      this.fireSearchEvent("Zubsolv");
  }

  @Output() searchEvent = new EventEmitter<string>();

  fireSearchEvent(imageName: string) {
    this.searchEvent.emit(imageName);
  }
}