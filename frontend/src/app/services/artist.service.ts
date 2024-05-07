import { HttpClient } from '@angular/common/http';
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

  getArtistsWithBirthcountryTechnique():Observable<any[][]>{
    return this.http.get<any[][]>(this.dataUrl+ '/artist/birthcountry/technique').pipe(shareReplay())
  }

  getArtistsWithDeathcountryTechnique():Observable<any[][]>{
    return this.http.get<any[][]>(this.dataUrl+ '/artist/deathcountry/technique').pipe(shareReplay())
  }

  getArtistsWithMostExhibitedInTechnique():Observable<any[][]>{
    return this.http.get<any[][]>(this.dataUrl+ '/artist/mostexhibitedincountry/technique').pipe(shareReplay())
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
