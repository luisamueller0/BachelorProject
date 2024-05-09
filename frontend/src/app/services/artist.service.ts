import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, shareReplay } from 'rxjs';

@Injectable({
  providedIn: 'root'
})

export class ArtistService {
  private dataUrl = 'http://localhost:3000'




  constructor(private http: HttpClient) { }


  getArtists():Observable<any[]>{
    return this.http.get<any[]>(this.dataUrl + '/artist').pipe(shareReplay())
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

  


  
  /*
  getArtistById(id: string): Observable<any> {
    return this.http.get<any>(`${this.dataUrl}/${id}`);
  }
  */



}
