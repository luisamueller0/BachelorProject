import { Component, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewInit, HostListener } from '@angular/core';
import * as d3 from 'd3';
import { HttpClient } from '@angular/common/http';
import { Subscription, fromEvent } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { SelectionService } from '../../services/selection.service';
import { ArtistService } from '../../services/artist.service';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css']
})
export class MapComponent implements OnInit, OnDestroy, AfterViewInit {
  private svg: any;
  private g: any;
  private width: number = 0;
  private height: number = 0;
  private subscription: Subscription = new Subscription();
  private countryBorders: any;


  private europeanCountries: string[] = [
    "Albania", "Andorra", "Austria", "Belarus", "Belgium", "Bosnia and Herzegovina", "Bulgaria", "Croatia",
    "Cyprus", "Czech Republic", "Denmark", "Estonia", "Finland", "France", "Germany", "Greece", "Hungary", "Iceland",
    "Ireland", "Italy", "Latvia", "Liechtenstein", "Lithuania", "Luxembourg", "Malta", "Moldova", "Monaco",
    "Montenegro", "Netherlands", "Macedonia", "Norway", "Poland", "Portugal", "Romania", "Russia",
    "San Marino", "Republic of Serbia", "Slovakia", "Slovenia", "Spain", "Sweden", "Switzerland", "Ukraine", "England", "Kosovo"
  ];

  private countryMap : { [key: string]: string } = this.artistService.countryMap;
   

  @ViewChild('mapContainer', { static: true }) private mapContainer!: ElementRef;

  constructor(private http: HttpClient, private selectionService: SelectionService,
    private artistService: ArtistService
  ) { 
    this.handleCountryClick = this.handleCountryClick.bind(this);
  }

  ngOnInit(): void {
    this.setWidthHeight();
    fromEvent(window, 'resize')
      .pipe(debounceTime(200))
      .subscribe(() => this.onResize());

    this.selectionService.currentCountries.subscribe(selectedCountries => {
      this.updateCountryColors(selectedCountries);
    });
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
      .scaleExtent([1, 8])
      .on('zoom', (event) => this.g.attr('transform', event.transform)));
  }

  private drawMap(): void {
    this.subscription.add(
      this.http.get('https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson')
      .subscribe((data: any) => {
        const filteredData = {
          ...data,
          features: data.features.filter((feature: any) =>
            this.europeanCountries.includes(feature.properties.name)
          )
        };

        const projection = d3.geoMercator()
        
          .center([20, 52])
          .scale(900)
          .translate([this.width / 2 +400, this.height /2 +600]);

        const path = d3.geoPath().projection(projection);
        

        this.countryBorders = this.g.selectAll('path')
        .data(filteredData.features)
        .enter()
        .append('path')
        .attr('d', path)
        .attr('fill', (d: any) => this.artistService.getCountryColor(this.artistService.getCountrycode(d.properties.name),1))
        .attr('stroke', '#fff')
        .on('click', (event: MouseEvent, d: any) => this.handleCountryClick(d.properties.name, event))
        .on('mouseover', (event: MouseEvent, d: any) => {
          const element = d3.select(event.currentTarget as SVGPathElement);
          const [x, y] = d3.pointer(event, window.document.body);
          d3.select('#tooltip')
            .style('display', 'block')
            .style('left', `${x + 10}px`)
            .style('top', `${y + 10}px`)
            .html(`Country: ${d.properties.name} (${this.getKeyByValue(d.properties.name)})`);
        })
        .on('mouseout', () => {
          d3.select('#tooltip').style('display', 'none');
        });

       // Append country codes
/* this.g.selectAll('text')
.data(filteredData.features)
.enter()
.append('text')
.attr('x', (d: any) => {
  const centroid = d3.geoCentroid(d);
  const projectedCentroid = projection(centroid);
  return projectedCentroid ? projectedCentroid[0] : 0;
})
.attr('y', (d: any) => {
  const centroid = d3.geoCentroid(d);
  const projectedCentroid = projection(centroid);
  return projectedCentroid ? projectedCentroid[1] : 0;
})
.attr('dy', '.35em')
.attr('text-anchor', 'middle')
.text((d: any) => Object.keys(this.countryMap).find(key => this.countryMap[key] === d.properties.name))
.style('font-size', '10px')
.style('fill', '#000'); */
      })
  );
}

private handleCountryClick(country: string, event: MouseEvent): void {
 

  const countryOnMap = event.currentTarget as SVGPathElement;
  console.log(country, this.getKeyByValue(country));
  //this.selectionService.selectMapCountry(this.getKeyByValue(country));
}

private getKeyByValue(value: string): string |undefined {
  return Object.keys(this.countryMap).find(key => this.countryMap[key] === value);
}




  private updateCountryColors(selectedCountries: string[]): void {
    if (!this.countryBorders) return;

    this.countryBorders
      .attr('fill', (d: any) => {
        const countryCode = Object.keys(this.countryMap).find(key => this.countryMap[key] === d.properties.name);
        const base = this.artistService.getCountryColor(countryCode,1);
        const unselected = this.artistService.getCountryColor(countryCode,0.05);
        return (countryCode && selectedCountries.includes(countryCode)) ? base: unselected;
      });
  }







/* 
  private createLegend(): void {
    const legendData = [
      { region: "North Europe (selected/unselected)", color: this.regionColors["North Europe"], darkerColor: this.darkerRegionColors["North Europe"] },
      { region: "Western Europe (selected/unselected)", color: this.regionColors["Western Europe"], darkerColor: this.darkerRegionColors["Western Europe"] },
      { region: "Southern Europe (selected/unselected)", color: this.regionColors["Southern Europe"], darkerColor: this.darkerRegionColors["Southern Europe"] },
      { region: "Eastern Europe (selected/unselected)", color: this.regionColors["Eastern Europe"], darkerColor: this.darkerRegionColors["Eastern Europe"] },
    ];
  
    const legendWidth = 500;
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
  
    // Draw boxes with two triangles for each legend item
    legendItems.append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', 30)
      .attr('height', 30)
      .attr('fill', 'none')
      .attr('stroke', '#000')
      .attr('stroke-width', 2)
      .attr('rx', 5)
      .attr('ry', 5);
  
    legendItems.append('polygon')
      .attr('points', '0,0 30,0 0,30')
      .attr('fill', (d: any) => d.color);
  
    legendItems.append('polygon')
      .attr('points', '30,0 30,30 0,30')
      .attr('fill', (d: any) => d.darkerColor);
  
    // Add text for each legend item

  legendItems.append('text')
  .attr('x', 40)
  .attr('y', 15)
  .attr('dy', '.35em')
  .text((d: any) => d.region)
  .style('font-size', '25px')
  .style('font-weight', '550')
  .style('fill', '#000')
  .style('font-family', 'Roboto, sans-serif'); // Apply the Roboto font family
}
   */
  

  @HostListener('window:resize')
  onResize(): void {
    this.setWidthHeight();
    this.svg
      .attr('width', this.width)
      .attr('height', this.height);
  }
}
