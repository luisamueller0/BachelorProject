// selection.service.ts

import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Artist } from '../models/artist'; // Import the appropriate model
import exhibited_with from '../models/exhibited_with';

@Injectable({
  providedIn: 'root'
})
export class SelectionService {
  constructor() {}

  private selectedArtist  = new BehaviorSubject<Artist[]>([]);
  private selectedCluster = new BehaviorSubject<Artist[]>([]);
  private selectedClusterEdges = new BehaviorSubject<exhibited_with[]>([]);

  currentArtist = this.selectedArtist.asObservable();
  currentCluster = this.selectedCluster.asObservable();
  currentClusterEdges= this.selectedClusterEdges.asObservable();

  selectArtist(artists:Artist[]) {
    this.selectedArtist.next(artists);
    console.log(this.selectedArtist.value)
  }
  selectOverview(artists:Artist[]){
    this.selectedArtist.next(artists);
  }

  selectCluster(cluster:Artist[]){
    console.log('selected cluster', cluster.length)
    this.selectedCluster.next(cluster);
  }

  selectClusterEdges(edges:exhibited_with[]){
    console.log('selected cluster edges', edges.length)
    this.selectedClusterEdges.next(edges);
  }
}
