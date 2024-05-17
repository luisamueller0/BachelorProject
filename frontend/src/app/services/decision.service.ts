import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs'
import { Artist } from '../models/artist';
import relationship from '../models/exhibited_with'

@Injectable({
  providedIn: 'root'
})
export class DecisionService {
  private sunburstSource = new BehaviorSubject<string>('nationality');
  private orderSource = new BehaviorSubject<string>('');
  private sizeSource = new BehaviorSubject<string>('');
  private thicknessSource = new BehaviorSubject<string>('');
  private rangeSource = new BehaviorSubject<number[]>([200,400]); // Default range
  private kSource = new BehaviorSubject<number>(5); 

  currentSunburst = this.sunburstSource.asObservable();
  currentOrder = this.orderSource.asObservable();
  currentSize = this.sizeSource.asObservable();
  currentThickness = this.thicknessSource.asObservable();
  currentRange = this.rangeSource.asObservable();
  currentK = this.kSource.asObservable();

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

 
  changeDecisionRange(range: number[]) {
    this.rangeSource.next(range);
  }
  changeK(k: number) {
    this.kSource.next(k);
  }

  getDecisionSunburst(): string {
    return this.sunburstSource.getValue();
  }
  getDecisionOrder(): string {
    return this.orderSource.getValue();
  }
  getDecisionSize(): string {
    return this.sizeSource.getValue();
  }
  getDecisionThickness(): string {
    return this.thicknessSource.getValue();
  }
  getDecisionRange(): number[] {
    return this.rangeSource.getValue();
  }
  getK(): number {
    return this.kSource.getValue();
  }

  
}
