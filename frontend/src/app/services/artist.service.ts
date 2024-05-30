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
  "North Europe": ["DK", "EE", "FI", "IS", "IE", "LV", "LT", "NO", "SE"],
  "Eastern Europe": ["AZ", "BY", "BG", "CZ", "HU", "MD", "PL", "RO", "RU", "SK", "UA"],
  "Southern Europe": ["BA", "HR", "GI", "GR", "IT", "ME", "PT", "RS", "SI", "ES"],
  "Western Europe": ["AT", "BE", "FR", "DE", "LU", "MC", "NL", "CH", "GB"],
  "Others": [
    "US", "AU", "GE", "MX", "AM", "IL", "CL", "AR", "CA", "DO", "PE", "JP", "TR",
    "BR", "ZA", "NZ", "VE", "GT", "UY", "SV", "PY", "IN", "PF", "KZ", "UZ", "VN", 
    "NA", "JO", "IR", "KH", "JM", "SA", "DZ", "CN", "EG", "VI", "ID", "CU", "TN", 
    "MQ", "MU", "LK", "EC", "SG", "BL", "TH", "BO"
  ]
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
      return this.interpolateCustomGreens;
    default:
      return d3.interpolateGreys; // Default color scale if region is not found
  }
}

private interpolateCustomGreens(t: number): string {
  return d3.interpolateRgb("#95ED87", "#00261c")(t); // Light blue to dark blue
}



// Function to create a color scale from a given color palette
private getColorScale(palette: string[]): (t: number) => string {
  return (t: number) => {
    const index = Math.round(t * (palette.length - 1));
    return palette[index];
  };
}


private cyanColorPalette: string[] = [
  "#00767a",
  "#1b8387",
  "#2d9094",
  "#3c9da1",
  "#4aaaae",
  "#57b7bb",
  "#65c5c9",
  "#72d3d7",
  "#7fe1e5"
];

private blueColorPalette: string[] = [
  "#0f1d26",
  "#0f3347",
  "#004c6d",
  "#1c5c7e",
  "#306d8f",
  "#427ea1",
  "#538fb3",
  "#64a1c6",
  "#75b3d9",
  "#87c6ec",
  "#98d9ff"
];




private purpleColorPalette: string[] = [
  "#250c31",
  "#49006a",
  "#5d1f7b",
  "#71378c",
  "#854e9d",
  "#9965af",
  "#ad7cc1",
  "#c194d3",
  "#d5ace5",
  "#eac5f8"
];

private pinkColorPalette: string[] = [
  "#e7298a",
  "#eb4594",
  "#ef5a9d",
  "#f36da7",
  "#f67eb1",
  "#f98eba",
  "#fb9ec4",
  "#fdaecd",
  "#ffbdd7"
];





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

  let defaultColor = d3.color(d3.interpolateGreys(0.5));
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
