import { Component, ElementRef, ViewChild, ChangeDetectionStrategy, OnInit, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'infopanel',
  styleUrls: ['./infopanel.component.scss'],
  templateUrl: './infopanel.component.html'
})
export class Infopanel {
  loadJanumetExample(): void {    
      this.fireSearchEvent("Janumet");
  }
  
  loadHydreaExample(): void {
      this.fireSearchEvent("Hydrea");
  }

  @Output() searchEvent = new EventEmitter<string>();

  fireSearchEvent(imageName: string) {
    this.searchEvent.emit(imageName);
  }
}