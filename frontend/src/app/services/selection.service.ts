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

  private selectedArtist  = new BehaviorSubject<Artist[]|null>(null);
  private selectedCluster = new BehaviorSubject<Artist[]>([]);
  private selectedCountries = new BehaviorSubject<string[]>([]);
  private selectedFocusCluster = new BehaviorSubject<[Artist[][], exhibited_with[][]]|null>(null); // Change the initial value to undefined
  private selectedNode = new BehaviorSubject<Artist|null>(null);
  private selectedClusterEdges = new BehaviorSubject<exhibited_with[]>([]);

  currentArtist = this.selectedArtist.asObservable();
  currentCluster = this.selectedCluster.asObservable();

  currentCountries = this.selectedCountries.asObservable();
  currentNode = this.selectedNode.asObservable();
  currentFocusCluster = this.selectedFocusCluster.asObservable();
  currentClusterEdges= this.selectedClusterEdges.asObservable();


  selectArtist(artists:Artist[]|null) {
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

  selectFocusCluster(cluster:[Artist[][], exhibited_with[][]]){
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
