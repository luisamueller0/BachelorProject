import { Component, OnInit } from '@angular/core';
import {DecisionService} from '../../services/decision.service';
import { Options } from '@angular-slider/ngx-slider';
@Component({
  selector: 'app-decisions',
  templateUrl: './decisions.component.html',
  styleUrls: ['./decisions.component.css']
})
export class DecisionsComponent implements OnInit {

  constructor(private decisionService: DecisionService) { }

  ngOnInit() {
  }
  range: number[] = [300, 400];  // Initial range values
  options: Options = {
    floor: 1,
    ceil: 400,
    step: 1
  };
  useRange = false; // whether to use the selected range

  selectedSunburst: string=''
  SunburstOptions: string[] = ['default: Artist (preferred) nationality', 'Techniques', 'artist birthcountry', 'artist deathcountry', 'artist most exhibited country']; 
  selectedSize: string =''
  SizeOptions: string[] = ['default: Importance (Degree)', 'Amount of Exhibitions', 'Amount of different techniques', 'Amount of exhibited Artworks']; // Example array of dropdown options

  selectedOrder: string =''
  OrderOptions: string[] = ['default: Geographical', 'Amount of Exhibitions', 'Amount of different techniques', 'Amount of created Artworks']; // Example array of dropdown options

  selectedThickness: string =''
  ThicknessOptions: string[] = ['none','#exhibitions of Artist 1 and 2', 'Same techniques']; // Example array of dropdown options
  
  onSunburstChange(event: any) {
    this.decisionService.changeDecisionSunburst(event.target.value);
  }
 
  onSizeChange(event: any) {
    this.decisionService.changeDecisionSize(event.target.value);
  }
  
  onOrderChange(event: any) {
    this.decisionService.changeDecisionOrder(event.target.value);
  }
  
  onThicknessChange(event: any) {
    this.decisionService.changeDecisionThickness(event.target.value);
  }

  onRangeChange() {
    if (this.useRange) {
      this.decisionService.changeDecisionRange(this.range);
      console.log("Range confirmed: ", this.range);
      // Add a delay before resetting useRange to show the green check mark
      setTimeout(() => {
        this.useRange = false; // Reset the checkbox after action
      }, 2000);  // Adjust delay as needed
    }
  }
}
