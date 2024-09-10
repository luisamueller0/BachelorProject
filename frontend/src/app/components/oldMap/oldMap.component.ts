import { Component, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewInit, HostListener } from '@angular/core';
import * as d3 from 'd3';
import { HttpClient } from '@angular/common/http';
import { Subscription, fromEvent } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { SelectionService } from '../../services/selection.service';
import { ArtistService } from '../../services/artist.service';

@Component({
  selector: 'app-oldMap',
  templateUrl: './oldMap.component.html',
  styleUrls: ['./oldMap.component.css']
})
export class OldMapComponent  implements OnInit, OnDestroy, AfterViewInit {
    private svg: any;
    private g: any;
    private width: number = 0;
    private height: number = 0;
    private subscription: Subscription = new Subscription();
    private countryBorders: any;
  
  
    private europeanCountries: string[] = 
      ['Luxembourg', 'Spain', 'United Kingdom of Great Britain and Ireland', 'Iceland', 'Belgium', 'Portugal', 
        'Netherlands', 'France', 'Switzerland', 'Romania', 'Serbia', 'Montenegro', 'Bosnia-Herzegovina', 'Italy', 
        'Austria Hungary', 'Bulgaria', 'Greece', 'Malta', 'Sweden–Norway', 'Denmark', 'Germany', 'Russian Empire']
       
  
    private countryMap : { [key: string]: string } = this.artistService.countryMap;
     
  
    @ViewChild('mapContainer', { static: true }) private mapContainer!: ElementRef;
  
    constructor(private http: HttpClient, private selectionService: SelectionService,
      private artistService: ArtistService
    ) { 
    }
  
    ngOnInit(): void {
      this.setWidthHeight();
      fromEvent(window, 'resize')
        .pipe(debounceTime(200))
        .subscribe(() => this.onResize());
  
   
    }
  
    ngAfterViewInit(): void {
      this.createSvg();
      this.drawMap();
      //this.createLegend();
    }
  
    ngOnDestroy(): void {
      this.subscription.unsubscribe();
    }
  
    private setWidthHeight(): void {
      const element = this.mapContainer.nativeElement;
      this.width = element.offsetWidth;
      this.height = element.offsetHeight;
    }
  
    private createSvg(): void {
      this.setWidthHeight();
      const element = this.mapContainer.nativeElement;
  
      this.svg = d3.select(element)
        .append('svg')
        .attr('width', '100%')
        .attr('height', '100%')
        .attr('viewBox', `0 0 960 600`)
        .attr('preserveAspectRatio', 'xMinYMin meet')
        .classed('svg-content-responsive', true);
  
      this.g = this.svg.append('g');
  
      this.svg.call(d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent([0, 10])
        .on('zoom', (event) => this.g.attr('transform', event.transform)));
    }
  
    private drawMap(): void {
      this.subscription.add(
        this.http.get('https://raw.githubusercontent.com/aourednik/historical-basemaps/master/geojson/world_1900.geojson')
        .subscribe((data: any) => {
          
          const projection = d3.geoMercator()
          
            .center([20, 36])
            .scale(900)
            .translate([this.width / 2 +400, this.height /2 +600]);
  
          const path = d3.geoPath().projection(projection);
          
          const names: string[] = [];

          data.features.forEach((d: any) => {
            names.push(d.properties.NAME);
          });
          
          console.log(names.join(", "));

              // Filter to only include European countries
      const europeanCountriesData = data.features.filter((d: any) =>
        this.europeanCountries.includes(d.properties.NAME)
      );
          
          this.countryBorders = this.g.selectAll('path')
          .data(europeanCountriesData)
          .enter()
          .append('path')
          .attr('d', path)
          .attr('fill', 'white')
          .attr('stroke', 'black')
     
          .on('mouseout', () => {
            d3.select('#tooltip').style('display', 'none');
          });
  
  
        })
    );
  }
  

  
  
  
  
  
    private createLegend(): void {
      const legendData = [
        { region: "North Europe", colorScale: this.artistService.getRegionColorScale("North Europe") },
        { region: "Eastern Europe", colorScale: this.artistService.getRegionColorScale("Eastern Europe") },
        { region: "Southern Europe", colorScale: this.artistService.getRegionColorScale("Southern Europe") },
        { region: "Western Europe", colorScale: this.artistService.getRegionColorScale("Western Europe") }
      ];
    
      const legendWidth = 350;
      const legendHeight = legendData.length * 40 + 10;
      const margin = 20; // Margin from the bottom and right sides
    
      // Get SVG dimensions
      const svgWidth = this.svg.attr('width');
      const svgHeight = this.svg.attr('height');
    
      // Calculate legend position
      const legendX = svgWidth - legendWidth - margin;
      const legendY = svgHeight - legendHeight - margin;
    
      const legend = this.svg.append('g')
        .attr('class', 'legend')
        .attr('transform', `translate(${legendX}, ${legendY})`);
    
      // Add white background for the legend
      legend.append('rect')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', legendWidth)
        .attr('height', legendHeight)
        .attr('fill', '#fff')
        .attr('stroke', '#000')
        .attr('stroke-width', 2)
        .attr('rx', 10)
        .attr('ry', 10);
    
      // Add legend items
      const legendItems = legend.selectAll('.legend-item')
        .data(legendData)
        .enter()
        .append('g')
        .attr('class', 'legend-item')
        .attr('transform', (d: any, i: number) => `translate(10, ${i * 40 + 10})`);
    
      // Create gradients
      const defs = this.svg.append('defs');
      legendData.forEach(d => {
        const gradientId = `gradient-${d.region.replace(/\s+/g, '-')}`;
        const gradient = defs.append('linearGradient')
          .attr('id', gradientId)
          .attr('x1', '0%')
          .attr('y1', '0%')
          .attr('x2', '100%')
          .attr('y2', '0%');
    
        // Create gradient stops
        for (let j = 0; j <= 10; j++) {
          gradient.append('stop')
            .attr('offset', `${j * 10}%`)
            .attr('stop-color', d.colorScale(j / 10));
        }
      });
    
      // Add gradient rects to legend items
      legendItems.append('rect')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', 100)
        .attr('height', 30)
        .attr('fill', (d: any) => `url(#gradient-${d.region.replace(/\s+/g, '-')})`);
    
      // Add text for each legend item
      const textElements = legendItems.append('text')
        .attr('x', 110)
        .attr('y', 15)
        .attr('dy', '.35em')
        .text((d: any) => d.region)
        .style('fill', '#2a0052')
        .style('font-family', 'Roboto, sans-serif')
        .style('font-weight', 'bold');
    
      // Calculate the maximum font size for the longest text
      const longestText = legendData.reduce((max, d) => d.region.length > max.length ? d.region : max, "");
      const textElement = this.svg.append('text')
        .attr('x', -9999)
        .attr('y', -9999)
        .text(longestText)
        .style('fill', '#2a0052')
        .style('font-family', 'Roboto, sans-serif')
        .style('font-weight', 'bold');
    
      const availableWidth = legendWidth - 150; // 120 is the position of text start + padding
      let newFontSize = 30; // Start with larger initial font size
      const minFontSize = 8; // Set a minimum font size
      textElement.style('font-size', `${newFontSize}px`);
      let textLength = textElement.node()!.getComputedTextLength();
    
      while (textLength > availableWidth && newFontSize > minFontSize) {
        newFontSize -= 1;
        textElement.style('font-size', `${newFontSize}px`);
        textLength = textElement.node()!.getComputedTextLength();
      }
    
      textElement.remove();
    
      // Apply the calculated font size to all text elements
      textElements.style('font-size', `${newFontSize}px`);
    }
    
  @HostListener('window:resize')
  onResize(): void {
  this.setWidthHeight();
  this.svg
      .attr('width', this.width)
      .attr('height', this.height);
  }
  }