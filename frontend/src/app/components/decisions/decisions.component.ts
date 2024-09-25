import { Component, OnInit } from '@angular/core';
import { DecisionService } from '../../services/decision.service';
import { Options } from '@angular-slider/ngx-slider';
import { ArtistService } from '../../services/artist.service';
import { Artist } from '../../models/artist';
import { Subscription, firstValueFrom } from 'rxjs';
import Fuse from 'fuse.js';

interface SearchedArtist {
  id: number;
  name: string;
  artworks: number;
}

@Component({
  selector: 'app-decisions',
  templateUrl: './decisions.component.html',
  styleUrls: ['./decisions.component.css']
})
export class DecisionsComponent implements OnInit {
  public linkExists: boolean = false;
  public searchedArtist: SearchedArtist | null = null;
  public allArtists: Map<number, { name: string; artworks: number }> = new Map();
  public notInCurrentRange: boolean = false;
  public searchQuery: string = '';
  public filteredArtists: { id: number; name: string; artworks: number }[] = [];
  public isLoadingK: boolean = false;
public isLoadingRange: boolean = false;


  private fuse: Fuse<{ id: number; name: string; artworks: number }>;

  constructor(private decisionService: DecisionService, private artistService: ArtistService) {
    this.fuse = new Fuse([], {
      keys: ['name'],
      threshold: 0.3, // Adjust threshold for error tolerance
    });
  }

  ngOnInit() {
    this.subscription.add(this.decisionService.currentLoadingBackendK.subscribe(bool => {
      if(!bool){
        this.useK = false; // Reset the checkbox after action
        this.showK = false;
        this.isLoadingK = false; // Hide spinner  
        
      }
    }));
    
    // Fetch default data from the database and set it as default values
    this.artistService.getArtistsWithRange(this.range).subscribe(
      (data) => {
        this.artists = data[0];
        this.numberOfArtists = this.artists.length;
    
      },
      (error) => {
        console.error('Error fetching default data:', error);
      }
    );

    this.artistService.getAllArtists().subscribe(
      (array) => {
        this.allArtists = this.artistService.turnIntoMap(array);
        const allArtistArray = Array.from(this.allArtists, ([id, value]) => ({
          id,
          ...value,
        }));
        // Initialize Fuse.js for fuzzy search with actual data
        this.fuse.setCollection(allArtistArray);
   
      },
      (error) => {
        console.error('Error fetching default data:', error);
      }
    );
  }

  artists: Artist[] = [];
  range: number[] = [200, 2217]; // Initial range values
  options: Options = {
    floor: 1,
    ceil: 2217,
    step: 1,
  };
  showK = false; // Show the K slider after fetching artists
  useRange = false; // whether to use the selected range
  k: number = 7; // Initial K value
  kOptions: Options = {
    floor: 1,
    ceil: 11,
    step: 1,
  };
  private subscription: Subscription = new Subscription();

  useK = false; // whether to use the selected K
  numberOfArtists = 0; // Number of artists
  rangeChanged = false; // Track if the range was changed
  kChanged = false; // Track if the K value was changed

  selectRanking: string ='artworks';
  RankingOptions: { label: string, value: string }[] = [
    { label: 'Amount of Exhibitions', value: 'exhibitions' },
    { label: 'Variety of Used Techniques', value: 'techniques' },
    { label: 'Amount of Exhibited Artworks', value: 'artworks' },
    { label: 'Average Birthyear', value: 'birthyear' },
    { label: 'Average Deathyear', value: 'deathyear' },
    { label: 'Average Exhibition Time', value: 'time' }



  ];
  selectedSunburst: string = 'birthcountry';
  SunburstOptions: { label: string, value: string }[] = [
    { label: 'Nationality', value: 'nationality' },
    { label: 'Country of Birth', value: 'birthcountry' },
    { label: 'Country of Death', value: 'deathcountry' },
    { label: 'Most Exhibited Country', value: 'mostexhibited' } // Alternatively: 'Country of Most Exhibitions'
  ];
    selectedSize: string = '';
 

  SizeOptions: { label: string, value: string }[] = [
    { label: 'Amount of Exhibitions', value: 'Amount of Exhibitions' },
    { label: 'Variety of Used Techniques', value: 'Amount of different techniques' },
    { label: 'Amount of Exhibited Artworks', value: 'Amount of exhibited Artworks' }
  ];
  
  // 'default: Importance (Degree)',

  selectedOrder: string = '';
  OrderOptions: string[] = [
    'Geographical (N,O,S,W, Others)',
    'Collaborations',
  ]; //'Amount of Exhibitions', 'Amount of different techniques', 'Amount of created Artworks'];

  selectedThickness: string = '';
  ThicknessOptions: string[] = ['none', '#exhibitions of Artist 1 and 2', 'Same techniques'];

  onSunburstChange(event: any) {
    this.decisionService.changeDecisionSunburst(event.target.value);
  }
  onRankingChange(event: any) {
    this.decisionService.changeDecisionRanking(event.target.value);
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
      const data = await firstValueFrom(this.artistService.getArtistsWithRange(this.range));
      this.artists = data[0];
      this.numberOfArtists = this.artists.length;

      // Step 2: Update kOptions based on the fetched artists
      const newCeil = Math.ceil(this.artists.length / 8);
      if (newCeil < 1 && this.artists.length > 0) {
        this.kOptions = { ...this.kOptions, ceil: 1 }; // Set ceil to 1 if calculation results in less than 1
      } else {
        this.kOptions = { ...this.kOptions, ceil: newCeil }; // Create a new object for kOptions
      }
    } catch (error) {
      console.error('There was an error', error);
    }
  }

  async onRangeChange() {
    if (this.useRange) {
      this.rangeChanged = false; // Reset the rangeChanged flag
      this.isLoadingRange = true; // Show spinner
      this.decisionService.changeLoadingBackendRange(true);
  
      // Fetch artists and update range
      await this.fetchArtistsAndUpdateRange();
      this.showK = true; // Show the K slider after fetching artists
      this.decisionService.changeDecisionRange(this.range);
  
      // Add a delay before resetting useRange to show the green check mark
      
        this.useRange = false; // Reset the checkbox after action
        this.isLoadingRange = false; // Hide spinner
        this.decisionService.changeLoadingBackendRange(false);
      // Adjust delay as needed
    }
  }
  
  onKChange() {
    if (this.useK) {
      this.kChanged = false; // Reset the kChanged flag
      this.isLoadingK = true; // Show spinner
      this.decisionService.changeK(this.k);
      this.decisionService.changeLoadingBackendK(true);
  
      this.showK = false;
      // Add a delay before resetting useK to show the green check mark
      
  
     // Adjust delay as needed
    }
  }
  

  onRangeSliderChange() {
    this.rangeChanged = true;
  }

  onKSliderChange() {
    this.kChanged = true;
  }

  onArtistSearch() {
    if (this.searchQuery.trim() === '') {
      this.filteredArtists = [];
      this.notInCurrentRange = false;
      this.decisionService.changeSearchedArtistId(null);
      return;
    }
  
    // Perform fuzzy search
    const results = this.fuse.search(this.searchQuery);
    this.filteredArtists = results.map((result) => result.item);
  }

  selectArtist(artist: { id: number; name: string; artworks: number }) {
   
    this.searchedArtist = artist;
    this.searchQuery = artist.name;
    this.filteredArtists = [];
       // Check if the artist is in the current range
    
  const artistInRange = this.artists.find(a => a.id.toString() === artist.id.toString());

  if (artistInRange) {
    this.notInCurrentRange = false;
    this.decisionService.changeSearchedArtistId(artist.id.toString());
  } else {
    this.decisionService.changeSearchedArtistId(null);
    this.notInCurrentRange = true;
  }

    
  }
}
