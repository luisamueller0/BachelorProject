// selection.service.ts

import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Artist } from '../models/artist'; // Import the appropriate model

@Injectable({
  providedIn: 'root'
})
export class SelectionService {
  constructor() {}

  private selectedArtist  = new BehaviorSubject<Artist[]>([]);

  currentArtist = this.selectedArtist.asObservable();
  selectArtist(artists:Artist[]) {
    this.selectedArtist.next(artists);
    console.log(this.selectedArtist.value)
  }
  selectOverview(artists:Artist[]){
    this.selectedArtist.next(artists);
  }
}
