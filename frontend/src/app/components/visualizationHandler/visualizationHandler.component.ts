import { Component, OnInit } from '@angular/core';
import { DecisionService } from '../../services/decision.service';
import { Subscription } from 'rxjs';
import { FocusOnClusterComponent } from '../focusOnCluster/focusOnCluster.component';
@Component({
  selector: 'app-visualizationHandler',
  templateUrl: './visualizationHandler.component.html',
  styleUrls: ['./visualizationHandler.component.css']
})
export class VisualizationHandlerComponent implements OnInit {

  private subscriptions: Subscription = new Subscription();
  public value1: string ='birthcountry';
  public value2: string = 'deathcountry'
  public value3: string = 'mostexhibited'

  private allValues: string[] = ['nationality', 'birthcountry', 'deathcountry', 'mostexhibited'];

  constructor(private decisionService: DecisionService) {}

  ngOnInit(): void {
    this.subscriptions.add(this.decisionService.currentSunburst.subscribe(currentValue => {
      const otherValues = this.allValues.filter(value => value !== currentValue);
      [this.value1, this.value2, this.value3] = otherValues;
    }));
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }
}
