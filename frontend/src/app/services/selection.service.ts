// selection.service.ts

import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Artist } from '../models/artist'; // Import the appropriate model
import exhibited_with from '../models/exhibited_with';
import { Exhibition } from '../models/exhibition';

@Injectable({
  providedIn: 'root'
})
export class SelectionService {
  constructor() {}

  private allArtists = new BehaviorSubject<Artist[]|null>(null);
  private selectedArtists  = new BehaviorSubject<Artist[]|null>(null);
  private selectedCluster = new BehaviorSubject<Artist[]>([]);
  private selectedCountries = new BehaviorSubject<string[]>([]);
  private selectedFocusCluster = new BehaviorSubject<[Artist[][], exhibited_with[][]]|null>(null); // Change the initial value to undefined
  private selectedNode = new BehaviorSubject<Artist|null>(null);
  private selectedClusterEdges = new BehaviorSubject<exhibited_with[]>([]);
  private selectedFocusArtist = new BehaviorSubject<Artist|null>(null);
  private selectedExhibitions = new BehaviorSubject<Exhibition[]|null>(null);

  currentArtists = this.selectedArtists.asObservable();
  currentCluster = this.selectedCluster.asObservable();
  currentAllArtists = this.allArtists.asObservable();
  currentFocusArtist = this.selectedFocusArtist.asObservable();
  currentCountries = this.selectedCountries.asObservable();
  currentNode = this.selectedNode.asObservable();
  currentFocusCluster = this.selectedFocusCluster.asObservable();
  currentClusterEdges= this.selectedClusterEdges.asObservable();
  currentExhibitions = this.selectedExhibitions.asObservable();


  selectExhibitions(exhibitions:Exhibition[]|null){
    console.log(exhibitions)
    this.selectedExhibitions.next(exhibitions);
  }
  selectArtists(artists:Artist[]|null) {
    this.selectedArtists.next(artists);
  }

  selectAllArtists(artists:Artist[]|null){
    this.allArtists.next(artists);
  }

  selectFocusArtist(artist:Artist|null){
    this.selectedFocusArtist.next(artist);
  }
 

  selectCluster(cluster:Artist[]){
    console.log('selected cluster', cluster.length)
    this.selectedCluster.next(cluster);
  }

  selectFocusCluster(cluster:[Artist[][], exhibited_with[][]]|null){
  console.log('selected focus cluster', cluster)
  console.log('selected focus edges', exhibited_with)
    this.selectedFocusCluster.next(cluster);
  };

  selectCountries(countries:string[]){
    this.selectedCountries.next(countries);
  }
  

  selectNode(node:Artist|null){
    this.selectedNode.next(node);
  }
  selectClusterEdges(edges:exhibited_with[]){
    console.log('selected cluster edges', edges.length)
    this.selectedClusterEdges.next(edges);
  }

  getFocusArtist(){
    return this.selectedFocusArtist.value;
  }

  getClusterEdges(){
    return this.selectedClusterEdges.value;
  }


  getFocusCluster(){
    return this.selectedFocusCluster.value;
  }

  getNode(){
    return this.selectedNode.value;
  }
}
