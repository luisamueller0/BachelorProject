import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DecisionService {
  private sunburstSource = new BehaviorSubject<string>('');
  private orderSource = new BehaviorSubject<string>('');
  private sizeSource = new BehaviorSubject<string>('');
  private thicknessSource = new BehaviorSubject<string>('');

  currentSunburst = this.sunburstSource.asObservable();
  currentOrder = this.orderSource.asObservable();
  currentSize = this.sizeSource.asObservable();
  currentThickness = this.thicknessSource.asObservable();

  changeDecisionSunburst(sunburst: string) {
    this.sunburstSource.next(sunburst);
  }
  changeDecisionOrder(order: string) {
    this.orderSource.next(order);
  }

  changeDecisionSize(size: string) {
    this.sizeSource.next(size);
  }

  changeDecisionThickness(thickness: string) {
    this.thicknessSource.next(thickness);
  }
}
