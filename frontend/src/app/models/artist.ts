import * as d3 from 'd3';

interface ArtistData {
  id: number;
  firstname: string;
  lastname: string;
  birthyear:string;
  birthplace: string;
  deathyear: string;
  deathplace: string;
  nationality: string;
  sex: string;
  artist: string;
  techniques: string[];
  amount_techniques: number;
  distinct_techniques: string[];
  techniques_freq: Map<string, number>; 
  europeanRegionNationality: string;
  most_exhibited_in:string;
  europeanRegionMostExhibited: string;
  most_exhibited_in_amount:number;
  total_exhibited_artworks:number;
  deathcountry:string;
  europeanRegionDeath: string;
  birthcountry:string;
  europeanRegionBirth: string;
  total_exhibitions:number;
  cluster: number;
  overall_avg_date: string;
  avg_start_date: string;
  avg_end_date: string;
  avg_duration: number;
  participated_in_exhibition:number[];
  }

  interface ArtistNode extends d3.SimulationNodeDatum{
    id: number;
    artist: Artist;
    angle: number;
    radius: number;
    color: string | number;
    countryData: {
        startAngle: number,
        endAngle: number,
        middleAngle: number,
        color: string | number,
        country: string
    };
  }

  interface ClusterNode extends d3.SimulationNodeDatum {
    clusterId: number;
    artists: Artist[];
    outerRadius: number;
    innerRadius: number;
    x: number;
    y: number;
    meanDate: Date;
    totalExhibitedArtworks: number;
  }
  
  
  class Artist {
    id: number;
    firstname: string;
    lastname: string;
    birthyear:Date;
    birthplace: string;
    deathyear: string;
    deathplace: string;
    nationality: string;
    sex: string;
    artist: string;
    techniques: string[];
    amount_techniques: number;
    distinct_techniques: string[];
    techniques_freq: Map<string, number>; 
    europeanRegionNationality: string;
    most_exhibited_in:string;
    europeanRegionMostExhibited: string;
    most_exhibited_in_amount:number;
    total_exhibited_artworks:number;
    deathcountry:string;
    europeanRegionDeath: string;
    birthcountry:string;
    europeanRegionBirth: string;
    total_exhibitions:number;
    cluster: number;
    overall_avg_date: Date;
    avg_start_date: Date;
    avg_end_date: Date;
    avg_duration: number;
    participated_in_exhibition:number[];
  
    constructor(data: ArtistData) {
      this.id = Number(data.id);
      this.firstname = data.firstname;
      this.lastname = data.lastname;
      this.birthyear = new Date(data.birthyear);
      this.birthplace = data.birthplace;
      this.deathyear = data.deathyear;
      this.deathplace = data.deathplace;
      this.nationality = data.nationality;
      this.sex = data.sex;
      this.artist = data.artist;
      this.techniques = data.techniques;
      this.amount_techniques = data.amount_techniques;
      this.distinct_techniques = data.distinct_techniques;
      this.techniques_freq = this.convertToMap(data.techniques_freq);
      this.europeanRegionNationality = data.europeanRegionNationality;
      this.most_exhibited_in = data.most_exhibited_in;
      this.europeanRegionMostExhibited = data.europeanRegionMostExhibited;
      this.most_exhibited_in_amount = data.most_exhibited_in_amount;
      this.total_exhibited_artworks = data.total_exhibited_artworks;
      this.deathcountry = data.deathcountry;
      this.europeanRegionDeath = data.europeanRegionDeath;
      this.birthcountry = data.birthcountry;
      this.europeanRegionBirth = data.europeanRegionBirth;
      this.total_exhibitions = data.total_exhibitions;
      this.cluster = data.cluster;
      this.overall_avg_date = new Date(data.overall_avg_date);
      this.avg_start_date = new Date (data.avg_start_date);
      this.avg_end_date = new Date (data.avg_end_date);
      this.avg_duration = data.avg_duration;
      this.participated_in_exhibition = data.participated_in_exhibition;
    }
  
  
    
    convertToMap(data:any): Map<string, number> {// Iterate through each data object
      const techniquesFreqMap = new Map<string, number>(); // Create a new Map
      data.forEach((item:any) => {
        // Iterate through the keys of each object
        Object.keys(item).forEach(key => {
          // Check if the key already exists in the map
          if (techniquesFreqMap.has(key)) {
            // If it exists, add the value to the existing value
            techniquesFreqMap.set(key, techniquesFreqMap.get(key) + item[key]);
          } else {
            // If it doesn't exist, set the value for the key
            techniquesFreqMap.set(key, item[key]);
          }
        });
      });
      return techniquesFreqMap; // Return the Map
    }
     
    get fullname(): string {
      return `${this.firstname} ${this.lastname}`;
    }
  }
  

  
  export { Artist, ArtistData, ArtistNode, ClusterNode};