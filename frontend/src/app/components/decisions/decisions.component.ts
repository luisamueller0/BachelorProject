import { Component, OnInit } from '@angular/core';
import {DecisionService} from '../../services/decision.service';
@Component({
  selector: 'app-decisions',
  templateUrl: './decisions.component.html',
  styleUrls: ['./decisions.component.css']
})
export class DecisionsComponent implements OnInit {

  constructor(private decisionService: DecisionService) { }

  ngOnInit() {
  }

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
  

}
