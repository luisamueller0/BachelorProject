import * as d3 from 'd3';

interface ArtistData {
    id: string | number;
    firstname: string;
    lastname: string;
    birthyear: string;
    birthplace: string;
    deathyear: string;
    deathplace: string;
    country: string;
    sex: string;
    title: string;
    techniques: string[];
    amount_techniques: number;
    europeanRegion: string;
  }

  interface ArtistNode extends d3.SimulationNodeDatum {
    id: number;
    title: Artist;
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
    country: string;
    sex: string;
    title: string;
    techniques: string[];
    amount_techniques: number;
    europeanRegion: string;
  
    constructor(data: ArtistData) {
      this.id = Number(data.id);
      this.firstname = data.firstname;
      this.lastname = data.lastname;
      this.birthyear = data.birthyear;
      this.birthplace = data.birthplace;
      this.deathyear = data.deathyear;
      this.deathplace = data.deathplace;
      this.country = data.country;
      this.sex = data.sex;
      this.title = data.title;
      this.techniques = data.techniques;
      this.amount_techniques = data.amount_techniques;
      this.europeanRegion = data.europeanRegion;
    }
  
    get fullname(): string {
      return `${this.firstname} ${this.lastname}`;
    }
  }
  
  export { Artist, ArtistData, ArtistNode };