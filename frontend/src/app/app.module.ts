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
@NgModule({
  declarations: [
    AppComponent,
    VisualizationComponent,
    DecisionsComponent,
    BarchartComponent,
    ClusterVisualizationComponent

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
