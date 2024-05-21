import { Component, OnInit } from '@angular/core';
import { DecisionService } from '../../services/decision.service';
import { Options } from '@angular-slider/ngx-slider';
import { ArtistService } from '../../services/artist.service';
import { Artist } from '../../models/artist';
import { firstValueFrom } from 'rxjs';

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
      this.numberOfArtists = this.artists.length;
      console.log('fetched');
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
  showK = false;  // Show the K slider after fetching artists
  useRange = false; // whether to use the selected range
  k: number = 5;  // Initial K value
  kOptions: Options = {
    floor: 1,
    ceil: 5,
    step: 1
  };
  useK = false; // whether to use the selected K
  numberOfArtists = 0; // Number of artists
  rangeChanged = false; // Track if the range was changed
  kChanged = false; // Track if the K value was changed

  selectedSunburst: string = '';
  SunburstOptions: string[] = ['nationality', 'birthcountry', 'deathcountry', 'mostexhibited']; 
  selectedSize: string = '';
  SizeOptions: string[] = ['default: Importance (Degree)', 'Amount of Exhibitions', 'Amount of different techniques', 'Amount of exhibited Artworks'];

  selectedOrder: string = '';
  OrderOptions: string[] = ['Geographical (N,O,S,W, Others)', 'Collaborations']; //'Amount of Exhibitions', 'Amount of different techniques', 'Amount of created Artworks'];

  selectedThickness: string = '';
  ThicknessOptions: string[] = ['none', '#exhibitions of Artist 1 and 2', 'Same techniques'];

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

  async fetchArtistsAndUpdateRange() {
    try {
      // Step 1: Fetch artists based on the selected range
      const data = await firstValueFrom(this.artistService.getAmountArtistsWithNationalityTechnique(this.range));
      this.artists = data[0];
      this.numberOfArtists = this.artists.length;
      console.log('Artists fetched:', this.numberOfArtists);
  
      // Step 2: Update kOptions based on the fetched artists
      const newCeil = Math.ceil(this.artists.length / 20);
      if (newCeil < 1 && this.artists.length > 0) {
        this.kOptions = { ...this.kOptions, ceil: 1 };  // Set ceil to 1 if calculation results in less than 1
      } else {
        this.kOptions = { ...this.kOptions, ceil: newCeil };  // Create a new object for kOptions
      }
    } catch (error) {
      console.error('There was an error', error);
    }
  }
  

  async onRangeChange() {
    if (this.useRange) {
      this.rangeChanged = false;  // Reset the rangeChanged flag
      console.log("Range confirmed: ", this.range);

      // Fetch artists and update range
      await this.fetchArtistsAndUpdateRange();
      this.showK = true;  // Show the K slider after fetching artists

      // Add a delay before resetting useRange to show the green check mark
      setTimeout(() => {
        this.useRange = false; // Reset the checkbox after action
      }, 2000);  // Adjust delay as needed
    }
  }

  onKChange() {
    if (this.useK) {
      this.kChanged = false;  // Reset the kChanged flag
      this.decisionService.changeK(this.k);
      console.log('k:', this.k);
      this.showK =false;
      
    }
    // Add a delay before resetting useK to show the green check mark
    setTimeout(() => {
      this.useK = false; // Reset the checkbox after action
      this.showK =false;
    }, 2000);  // Adjust delay as needed
  }

  onRangeSliderChange() {
    this.rangeChanged = true;
  }

  onKSliderChange() {
    this.kChanged = true;
  }
}
