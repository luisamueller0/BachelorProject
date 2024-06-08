import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, shareReplay } from 'rxjs';
import { Artist } from '../models/artist';
import exhibited_with from '../models/exhibited_with';
import * as d3 from 'd3';

@Injectable({
  providedIn: 'root'
})

export class ArtistService {
  private dataUrl = 'http://localhost:3000'




  constructor(private http: HttpClient) { }


  getAllArtists(): Observable<any[]> {
    return this.http.get<any[]>(this.dataUrl + '/artist/').pipe(shareReplay());
  }

  turnIntoMap(array: any[]): Map<number, { name: string, artworks: number }> {
    const idNameMap = new Map<number, { name: string, artworks: number }>();
  
    array.forEach((item: any) => {
      const { id, firstname, lastname, artworks } = item; // Assuming the array elements have an age property
      idNameMap.set(id, { name: `${firstname} ${lastname}`, artworks: artworks});
    });
  
    return idNameMap;
  }
  

  getArtistsWithRange(range:number[]):Observable<any[][]>{
    console.log(range)
    const [minLimit, maxLimit] = range;
    const params = new HttpParams()
      .set('minLimit', minLimit.toString())
      .set('maxLimit', maxLimit.toString());
    return this.http.get<any[][]>(this.dataUrl+ '/artist/amount', { params }).pipe(shareReplay());
  }
  clusterAmountArtists(range:number[], k:number):Observable<any[][]>{
    const params = new HttpParams()
    .set('minLimit', JSON.stringify(range[0]))
    .set('maxLimit', JSON.stringify(range[1]))
    .set('k', JSON.stringify(k));

  return this.http.get<[any[][]]>(this.dataUrl+ '/artist/cluster', { params }).pipe(shareReplay());

  }

  getArtistsWithNationalityTechnique():Observable<any[][]>{
    return this.http.get<any[][]>(this.dataUrl+ '/artist/nationality/technique').pipe(shareReplay())
  }

  getAmountArtistsWithNationalityTechnique(range:number[]):Observable<any[][]>{
    console.log(range)
    const [minLimit, maxLimit] = range;
    const params = new HttpParams()
      .set('minLimit', minLimit.toString())
      .set('maxLimit', maxLimit.toString());
    return this.http.get<any[][]>(this.dataUrl+ '/artist/amount/nationality/technique', { params }).pipe(shareReplay());
  
  }

  getArtistsWithBirthcountryTechnique():Observable<any[][]>{
    return this.http.get<any[][]>(this.dataUrl+ '/artist/birthcountry/technique').pipe(shareReplay())
  }

  getAmountArtistsWithBirthcountryTechnique(range:number[]):Observable<any[][]>{
    const [minLimit, maxLimit] = range;
    const params = new HttpParams()
      .set('minLimit', minLimit.toString())
      .set('maxLimit', maxLimit.toString());
    return this.http.get<any[][]>(this.dataUrl+ '/artist/amount/birthcountry/technique', { params }).pipe(shareReplay());
  
  }

  getArtistsWithDeathcountryTechnique():Observable<any[][]>{
    return this.http.get<any[][]>(this.dataUrl+ '/artist/deathcountry/technique').pipe(shareReplay())
  }

  getAmountArtistsWithDeathcountryTechnique(range:number[]):Observable<any[][]>{
    const [minLimit, maxLimit] = range;
    const params = new HttpParams()
      .set('minLimit', minLimit.toString())
      .set('maxLimit', maxLimit.toString());
    return this.http.get<any[][]>(this.dataUrl+ '/artist/amount/deathcountry/technique', { params }).pipe(shareReplay());
  
  }

  getArtistsWithMostExhibitedInTechnique():Observable<any[][]>{
    return this.http.get<any[][]>(this.dataUrl+ '/artist/mostexhibitedincountry/technique').pipe(shareReplay())
  }

  getAmountArtistsWithMostExhibitedInTechnique(range:number[]):Observable<any[][]>{
   
    const [minLimit, maxLimit] = range;
    const params = new HttpParams()
      .set('minLimit', minLimit.toString())
      .set('maxLimit', maxLimit.toString());
    return this.http.get<any[][]>(this.dataUrl+ '/artist/amount/mostexhibitedincountry/technique', { params }).pipe(shareReplay());
  
  }

  getArtistsWithTechnique():Observable<any[][]>{
    return this.http.get<any[][]>(this.dataUrl+ '/artist/technique').pipe(shareReplay())
  }

  clusterArtists(artists:Artist[],relationships:exhibited_with[], k:number):Observable<any[]>{
    const params = new HttpParams()
      .set('minLimit', JSON.stringify(artists))
      .set('maxLimit', JSON.stringify(relationships))
      .set('k', k);
    return this.http.get<any[][]>(this.dataUrl+ '/artist/cluster',{ params }).pipe(shareReplay())
  }

  clusterAmountArtistsNationality(range:number[], k:number):Observable<any[][]>{
    const params = new HttpParams()
      .set('minLimit', JSON.stringify(range[0]))
      .set('maxLimit', JSON.stringify(range[1]))
      .set('k', JSON.stringify(k));

    return this.http.get<any[][]>(this.dataUrl+ '/artist/cluster/nationality', { params }).pipe(shareReplay());
  
  }
  clusterAmountArtistsBirthcountry(range:number[], k:number):Observable<any[][]>{
    const params = new HttpParams()
      .set('minLimit', JSON.stringify(range[0]))
      .set('maxLimit', JSON.stringify(range[1]))
      .set('k', JSON.stringify(k));

    return this.http.get<any[][]>(this.dataUrl+ '/artist/cluster/birthcountry', { params }).pipe(shareReplay());
  
  }

  clusterAmountArtistsDeathcountry(range:number[], k:number):Observable<any[][]>{
    const params = new HttpParams()
      .set('minLimit', JSON.stringify(range[0]))
      .set('maxLimit', JSON.stringify(range[1]))
      .set('k', JSON.stringify(k));

    return this.http.get<any[][]>(this.dataUrl+ '/artist/cluster/deathcountry', { params }).pipe(shareReplay());
  
  }

  clusterAmountArtistsMostExhibited(range:number[], k:number):Observable<any[][]>{
    const params = new HttpParams()
      .set('minLimit', JSON.stringify(range[0]))
      .set('maxLimit', JSON.stringify(range[1]))
      .set('k', JSON.stringify(k));

    return this.http.get<any[][]>(this.dataUrl+ '/artist/cluster/mostexhibited', { params }).pipe(shareReplay());
  
  }


public europeanRegions = {
  "North Europe": ["DK", "EE", "FI", "IS", "IE", "LV", "LT", "NO", "SE", "GB"],
  "Eastern Europe": ["AZ", "BY", "BG", "CZ", "HU", "MD", "PL", "RO", "RU", "SK", "UA", "AM", "GE"],
  "Southern Europe": ["BA", "HR", "GI", "GR", "IT", "ME", "PT", "RS", "SI", "ES", "AL", "AD", "MT", "MK", "SM"],
  "Western Europe": ["AT", "BE", "FR", "DE", "LU", "MC", "NL", "CH", "LI"],
  "Others": [
      "US", "AU", "GE", "MX", "AM", "IL", "CL", "AR", "CA", "DO", "PE", "JP", "TR",
      "BR", "ZA", "NZ", "VE", "GT", "UY", "SV", "PY", "IN", "PF", "KZ", "UZ", "VN", 
      "NA", "JO", "IR", "KH", "JM", "SA", "DZ", "CN", "EG", "VI", "ID", "CU", "TN", 
      "MQ", "MU", "LK", "EC", "SG", "BL", "TH", "BO"
  ],
  "\\N" :["\\N"]
};


public getRegionColorScale(region: string): (t: number) => string {
  switch (region) {
    case "North Europe":
      return this.getColorScale(this.cyanColorPalette);
    case "Eastern Europe":
      return this.getColorScale(this.blueColorPalette);
    case "Southern Europe":
      return this.getColorScale(this.purpleColorPalette);
    case "Western Europe":
      return this.getColorScale(this.pinkColorPalette);
    case "Others":
      return this.getYellowOrangeColor;
    case "\\N":
      return this.getColorScale(this.greyColorPalette); 
    default:
      return this.getColorScale(this.greyColorPalette); // Default color scale if region is not found
  }
}

// Function to create a color scale from a given color palette
private getColorScale(palette: string[]): (t: number) => string {
  return (t: number) => {
    const index = Math.round(t * (palette.length - 1));
    return palette[index];
  };
}

private greyColorPalette: string[] = [
  "black"
];
//10
private cyanColorPalette: string[] = [
  "#1D5F55",
  "#25776B",
  "#2C8F80",
  "#33A795",
  "#3ABEAB",
  "#4FC9B7",
  "#67D0C0",
  "#76D5C7",
  "#85DACD",
  "#94DED3",
  "#A4E3D9"
];


//13
private blueColorPalette: string[] = [
  "#1362B1",
  "#1672CF",
  "#1E83E7",
  "#3B93EA",
  "#59A3EE",
  "#69ACEF",
  "#7AB6F1",
  "#8BBFF3",
  "#9BC8F5",
  "#ACD1F6",
  "#BDDAF8",
  "#CDE3FA",
  "#DEEDFC"
];



//15
private purpleColorPalette: string[] = [
  "#471377",
  "#591895",
  "#6B1DB3",
  "#7C22D1",
  "#8E37DE",
  "#9E55E3",
  "#AF73E8",
  "#B781EA",
  "#BF8FED",
  "#C79DEF",
  "#CFABF1",
  "#D7B9F4",
  "#DFC7F6",
  "#E7D5F8",
  "#EFE3FA"
];


//9
private pinkColorPalette: string[] = [
  
  "#EA2BB7",
  "#ED4BC2",
  "#F06ACD",
  "#F279D2",
  "#F388D7",
  "#F597DC",
  "#F6A6E1",
  "#F8B5E6",
  "#F9C4EB"
];

 // Divergent color scale from yellow to orange
 public getYellowOrangeColor(t: number): string {
  return d3.interpolateLab("#FFDA75", "#FF9751")(t);
}





// Function to get color based on country and region
public getCountryColor(countryName: string | undefined, opacity: number = 1): string {
  if (countryName === undefined) return d3.interpolateGreys(0.5); // Default color for undefined countries

  for (const [region, countries] of Object.entries(this.europeanRegions)) {
    const index = countries.indexOf(countryName);
    if (index !== -1) {
      const colorScale = this.getRegionColorScale(region);
      const t = index / (countries.length - 1); // Calculate interpolation factor
      let color = d3.color(colorScale(t));
      if (color) {
        color.opacity = opacity;
        return color.toString();
      }
    }
  }

  let defaultColor = d3.color("#C3C3C3");
  if (defaultColor) {
    defaultColor.opacity = opacity;
    return defaultColor.toString();
  }
  return d3.interpolateGreys(0.5); // Fallback
}

public countryMap : { [key: string]: string } = {
  "AL": "Albania",
  "AD": "Andorra",
  "AT": "Austria",
  "BY": "Belarus",
  "BE": "Belgium",
  "BA": "Bosnia and Herzegovina",
  "BG": "Bulgaria",
  "HR": "Croatia",
  "CY": "Cyprus",
  "CZ": "Czech Republic",
  "DK": "Denmark",
  "EE": "Estonia",
  "FI": "Finland",
  "FR": "France",
  "DE": "Germany",
  "GR": "Greece",
  "HU": "Hungary",
  "IS": "Iceland",
  "IE": "Ireland",
  "IT": "Italy",
  "LV": "Latvia",
  "LI": "Liechtenstein",
  "LT": "Lithuania",
  "LU": "Luxembourg",
  "MT": "Malta",
  "MD": "Moldova",
  "MC": "Monaco",
  "ME": "Montenegro",
  "NL": "Netherlands",
  "MK": "Macedonia",
  "NO": "Norway",
  "PL": "Poland",
  "PT": "Portugal",
  "RO": "Romania",
  "RU": "Russia",
  "SM": "San Marino",
  "RS": "Republic of Serbia",
  "SK": "Slovakia",
  "SI": "Slovenia",
  "ES": "Spain",
  "SE": "Sweden",
  "CH": "Switzerland",
  "UA": "Ukraine",
  "GB": "England",
  "XK": "Kosovo",
  "AZ": "Azerbaijan",
  "GI": "Gibraltar",
  "US": "United States",
  "AU": "Australia",
  "GE": "Georgia",
  "MX": "Mexico",
  "AM": "Armenia",
  "IL": "Israel",
  "CL": "Chile",
  "AR": "Argentina",
  "CA": "Canada",
  "DO": "Dominican Republic",
  "PE": "Peru",
  "JP": "Japan",
  "TR": "Turkey",
  "BR": "Brazil",
  "ZA": "South Africa",
  "NZ": "New Zealand",
  "VE": "Venezuela",
  "GT": "Guatemala",
  "UY": "Uruguay",
  "SV": "El Salvador",
  "PY": "Paraguay",
  "IN": "India",
  "PF": "French Polynesia",
  "KZ": "Kazakhstan",
  "UZ": "Uzbekistan",
  "VN": "Vietnam",
  "NA": "Namibia",
  "JO": "Jordan",
  "IR": "Iran",
  "KH": "Cambodia",
  "JM": "Jamaica",
  "SA": "Saudi Arabia",
  "DZ": "Algeria",
  "CN": "China",
  "EG": "Egypt",
  "VI": "Virgin Islands",
  "ID": "Indonesia",
  "CU": "Cuba",
  "TN": "Tunisia",
  "MQ": "Martinique",
  "MU": "Mauritius",
  "LK": "Sri Lanka",
  "EC": "Ecuador",
  "SG": "Singapore",
  "BL": "Saint Barthélemy",
  "TH": "Thailand",
  "BO": "Bolivia"
};

public getCountrycode(fullName: string): string | undefined {
  for (const [code, name] of Object.entries(this.countryMap)) {
    if (name.toLowerCase() === fullName.toLowerCase()) {
      return code;
    }
  }
  return undefined; // Return undefined if the country name is not found
}


  
  /*
  getArtistById(id: string): Observable<any> {
    return this.http.get<any>(`${this.dataUrl}/${id}`);
  }
  */



}
