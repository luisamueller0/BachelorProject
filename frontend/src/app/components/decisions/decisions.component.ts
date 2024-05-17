import { Component, OnInit } from '@angular/core';
import {DecisionService} from '../../services/decision.service';
import { Options } from '@angular-slider/ngx-slider';
import { ArtistService } from '../../services/artist.service';
import { Artist } from '../../models/artist';
import exhibited_with from '../../models/exhibited_with';
@Component({
  selector: 'app-decisions',
  templateUrl: './decisions.component.html',
  styleUrls: ['./decisions.component.css']
})
export class DecisionsComponent implements OnInit {

  constructor(private decisionService: DecisionService, private artistService: ArtistService) { }

  ngOnInit() {
    // Fetch default data from the database and set it as default values
    this.artistService.getAmountArtistsWithNationalityTechnique(this.range).subscribe((data) => {
      this.artists = data[0];
      console.log('fetched')
    }, (error) => {
      console.error('Error fetching default data:', error);
    });
  }

  artists: Artist[] = [];
  range: number[] = [200, 400];  // Initial range values
  options: Options = {
    floor: 1,
    ceil: 400,
    step: 1
  };
  useRange = false; // whether to use the selected range
  k: number = 5;  // Initial range values
  kOptions: Options = {
    floor: 1,
    ceil: 5,
    step: 1
  };
  useK = false; // whether to use the selected k


  selectedSunburst: string=''
  SunburstOptions: string[] = ['nationality', 'birthcountry', 'deathcountry', 'mostexhibited']; 
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

  onKChange() {
    if(this.useK) {
      this.decisionService.changeK(this.k);
      console.log('k:', this.k)
      }
      // Add a delay before resetting useRange to show the green check mark
      setTimeout(() => {
        this.useK = false; // Reset the checkbox after action
      }, 2000);  // Adjust delay as needed
  }

  onRangeChange() {
    if (this.useRange) {
    
      console.log("Range confirmed: ", this.range);

      this.artistService.getAmountArtistsWithNationalityTechnique(this.range).subscribe((data) => {
        this.artists = data[0];
        // Update dependent range options
      const newCeil = Math.ceil(this.artists.length / 15);
      if (newCeil < 1 && this.artists.length > 0) {
        this.kOptions = { ...this.kOptions, ceil: 1 };  // Set ceil to 1 if calculation results in less than 1
      } else {
        this.kOptions = { ...this.kOptions, ceil: newCeil };  // Create a new object for kOptions
      }
        this.decisionService.changeDecisionRange(this.range);
      }, (error) => {
        console.error('There was an error', error);

      });  


      

      
      // Add a delay before resetting useRange to show the green check mark
      setTimeout(() => {
        this.useRange = false; // Reset the checkbox after action
      }, 2000);  // Adjust delay as needed
    }
  }
}
