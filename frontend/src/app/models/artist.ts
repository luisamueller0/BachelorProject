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
  europeanRegionNationality: string;
  most_exhibited_in:string;
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
    europeanRegionNationality: string;
    most_exhibited_in:string;
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
      this.europeanRegionNationality = data.europeanRegionNationality;
      this.most_exhibited_in = data.most_exhibited_in;
      this.most_exhibited_in_amount = data.most_exhibited_in_amount;
      this.total_exhibited_artworks = data.total_exhibited_artworks;
      this.deathcountry = data.deathcountry;
      this.europeanRegionDeath = data.europeanRegionDeath;
      this.birthcountry = data.birthcountry;
      this.europeanRegionBirth = data.europeanRegionBirth;
      this.total_exhibitions = data.total_exhibitions;
    }
  
    get fullname(): string {
      return `${this.firstname} ${this.lastname}`;
    }
  }
  
  export { Artist, ArtistData, ArtistNode };