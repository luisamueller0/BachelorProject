import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';  // Import HttpClientModule

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { VisualizationComponent } from './components/visualization/visualization.component';
import { DecisionsComponent } from './components/decisions/decisions.component';
import { ArtistService } from './services/artist.service';
import { BarchartComponent } from './components/barchart/barchart.component';
import { NgxSliderModule } from '@angular-slider/ngx-slider';
import { FormsModule } from '@angular/forms'; // Import FormsModule
import { ClusterVisualizationComponent } from './components/clusterVisualization/clusterVisualization.component';
import { MapComponent } from './components/map/map.component';
import { FocusOnClusterComponent } from './components/focusOnCluster/focusOnCluster.component';
import { ExhibitionVisualizationComponent } from './components/exhibitionVisualization/exhibitionVisualization.component';
import { SmallMultiplesComponent } from './components/smallMultiples/smallMultiples.component';
import { ExhibitionBarchartComponent } from './components/exhibitionBarchart/exhibitionBarchart.component';
import { PlotComponent } from './components/plot/plot.component';
@NgModule({
  declarations: [
    AppComponent,
    VisualizationComponent,
    DecisionsComponent,
    BarchartComponent,
    ClusterVisualizationComponent,
    MapComponent,
    FocusOnClusterComponent,
    ExhibitionVisualizationComponent,
    SmallMultiplesComponent,
    ExhibitionBarchartComponent,
    PlotComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    NgxSliderModule,
    FormsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
