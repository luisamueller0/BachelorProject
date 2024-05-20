import { Component, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewInit, HostListener } from '@angular/core';
import * as d3 from 'd3';
import { HttpClient } from '@angular/common/http';
import { Subscription, fromEvent } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { SelectionService } from '../../services/selection.service';

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
    "Cyprus", "Czechia", "Denmark", "Estonia", "Finland", "France", "Germany", "Greece", "Hungary", "Iceland",
    "Ireland", "Italy", "Latvia", "Liechtenstein", "Lithuania", "Luxembourg", "Malta", "Moldova", "Monaco",
    "Montenegro", "Netherlands", "North Macedonia", "Norway", "Poland", "Portugal", "Romania", "Russia",
    "San Marino", "Serbia", "Slovakia", "Slovenia", "Spain", "Sweden", "Switzerland", "Ukraine", "United Kingdom"
  ];

  private regionColors: { [key: string]: string } = {
    "North Europe": "#1f77b4",
    "Western Europe": "#ff7f0e",
    "Southern Europe": "#2ca02c",
    "Eastern Europe": "#d62728"
  };

  private countryMap : { [key: string]: string } = {
    "AL": "Albania",
    "AD": "Andorra",
    "AT": "Austria",
    "BY": "Belarus",
    "BE": "Belgium",
    "BA": "Bosnia and Herzegovina",
    "BG": "Bulgaria",
    "HR": "Croatia",
    "CY": "Cyprus",
    "CZ": "Czechia",
    "DK": "Denmark",
    "EE": "Estonia",
    "FI": "Finland",
    "FR": "France",
    "DE": "Germany",
    "GR": "Greece",
    "HU": "Hungary",
    "IS": "Iceland",
    "IE": "Ireland",
    "IT": "Italy",
    "LV": "Latvia",
    "LI": "Liechtenstein",
    "LT": "Lithuania",
    "LU": "Luxembourg",
    "MT": "Malta",
    "MD": "Moldova",
    "MC": "Monaco",
    "ME": "Montenegro",
    "NL": "Netherlands",
    "MK": "North Macedonia",
    "NO": "Norway",
    "PL": "Poland",
    "PT": "Portugal",
    "RO": "Romania",
    "RU": "Russia",
    "SM": "San Marino",
    "RS": "Serbia",
    "SK": "Slovakia",
    "SI": "Slovenia",
    "ES": "Spain",
    "SE": "Sweden",
    "CH": "Switzerland",
    "UA": "Ukraine",
    "GB": "United Kingdom"
  };


  @ViewChild('mapContainer', { static: true }) private mapContainer!: ElementRef;

  constructor(private http: HttpClient, private selectionService: SelectionService) { }

  ngOnInit(): void {
    this.setWidthHeight();
    fromEvent(window, 'resize')
      .pipe(debounceTime(200))
      .subscribe(() => this.onResize());

    this.selectionService.currentCountries.subscribe(selectedCountries => {
      this.updateCountryBorders(selectedCountries);
    });
  }

  ngAfterViewInit(): void {
    this.createSvg();
    this.drawMap();
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
            .translate([this.width / 2, this.height / 2]);

          const path = d3.geoPath().projection(projection);

          const getRegionColor = (countryName: string): string => {
            // Use a different approach if you have regions
            if (this.europeanCountries.includes(countryName)) {
              if (["Denmark", "Estonia", "Finland", "Iceland", "Ireland", "Latvia", "Lithuania", "Norway", "Sweden"].includes(countryName)) {
                return this.regionColors["North Europe"];
              } else if (["Austria", "Belgium", "France", "Germany", "Liechtenstein", "Luxembourg", "Monaco", "Netherlands", "Switzerland"].includes(countryName)) {
                return this.regionColors["Western Europe"];
              } else if (["Albania", "Andorra", "Bosnia and Herzegovina", "Croatia", "Cyprus", "Greece", "Italy", "Malta", "Montenegro", "North Macedonia", "Portugal", "San Marino", "Serbia", "Slovenia", "Spain"].includes(countryName)) {
                return this.regionColors["Southern Europe"];
              } else if (["Belarus", "Bulgaria", "Czechia", "Hungary", "Moldova", "Poland", "Romania", "Russia", "Slovakia", "Ukraine"].includes(countryName)) {
                return this.regionColors["Eastern Europe"];
              }
            }
            return '#ccc'; // Default color for countries not in the list
          };

          this.countryBorders = this.g.selectAll('path')
            .data(filteredData.features)
            .enter()
            .append('path')
            .attr('d', path)
            .attr('fill', (d: any) => getRegionColor(d.properties.name))
            .attr('stroke', '#fff');
        })
    );
  }

  private updateCountryBorders(selectedCountries: string[]): void {
    if (!this.countryBorders) return;

    this.countryBorders
      .attr('stroke-width', (d: any) => {
        const countryCode = Object.keys(this.countryMap).find(key => this.countryMap[key] === d.properties.name);
        return selectedCountries.includes(countryCode || '') ? '3px' : '1px';
      })
      .attr('stroke', (d: any) => {
        const countryCode = Object.keys(this.countryMap).find(key => this.countryMap[key] === d.properties.name);
        return selectedCountries.includes(countryCode || '') ? 'black' : '#fff';
      });
  }

  @HostListener('window:resize')
  onResize(): void {
    this.setWidthHeight();
    this.svg
      .attr('width', this.width)
      .attr('height', this.height);
  }
}
