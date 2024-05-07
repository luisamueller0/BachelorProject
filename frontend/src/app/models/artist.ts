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
  techniques_freq: { [key: string]: number }[]; 
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
  }

  interface ArtistNode extends d3.SimulationNodeDatum {
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
  
  class Artist {
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
    techniques_freq: { [key: string]: number }[]; 
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
  
    constructor(data: ArtistData) {
      this.id = Number(data.id);
      this.firstname = data.firstname;
      this.lastname = data.lastname;
      this.birthyear = data.birthyear;
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
    }
  
     // Method to convert array to map
     convertToMap(techniquesFreq:any) {
      const techniquesMap = new Map();
      try {
          const dataObj = JSON.parse(techniquesFreq);
          for (const technique in dataObj) {
              if (Object.hasOwnProperty.call(dataObj, technique)) {
                  const frequency = dataObj[technique];
                  techniquesMap.set(technique, frequency);
              }
          }
      } catch (error) {
          console.error('Error parsing techniquesFreq:', error);
      }
      console.log('map', techniquesMap)
      return techniquesMap;
  }
    get fullname(): string {
      return `${this.firstname} ${this.lastname}`;
    }
  }
  
  export { Artist, ArtistData, ArtistNode };