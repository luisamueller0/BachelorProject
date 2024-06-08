import { Component, OnInit, Input, ViewChild, ElementRef, OnChanges, OnDestroy, HostListener } from '@angular/core';
import * as d3 from 'd3';
import { Artist } from '../../models/artist';
import { SelectionService } from '../../services/selection.service';
import { Subscription } from 'rxjs';
import { ExhibitionService } from '../../services/exhibition.service';
import { Exhibition } from '../../models/exhibition';
import { ArtistService } from '../../services/artist.service';
interface YearData {
  year: number;
  totalExhibitions: number;
  regions: {
    [key: string]: number;
  };
}

@Component({
  selector: 'app-exhibitionBarchart',
  templateUrl: './exhibitionBarchart.component.html',
  styleUrls: ['./exhibitionBarchart.component.css']
})
export class ExhibitionBarchartComponent implements OnInit, OnChanges, OnDestroy {
  @ViewChild('exhibition', { static: true }) private exhibitionContainer!: ElementRef;
  private subscriptions: Subscription = new Subscription();
  
  allExhibitions: Exhibition[] = [];
  exhibitions: Exhibition[] = [];
  allArtists: Artist[] = [];
  selectedArtists: Artist[] | null = [];
  nonselectedArtists: Artist[] = [];
  isLoading: boolean = true;
  private svg: any;
  private contentWidth: number = 0;
  private contentHeight: number = 0;
  
  private margin = {
    top: 5,
    right: 10,
    bottom: 2,
    left: 8
  };
  
  constructor(private selectionService: SelectionService,
              private exhibitionService: ExhibitionService,
              private artistService: ArtistService) { }
  
  ngOnInit(): void {
    this.exhibitionService.getAllExhibitions().subscribe((exhibitions) => {
      this.allExhibitions = exhibitions;
      this.tryInitialize();
    });
  
    this.subscriptions.add(
      this.selectionService.currentAllArtists.subscribe((artists: Artist[] | null) => {
        this.allArtists = artists || [];
        this.tryInitialize();
      })
    );
  
    this.subscriptions.add(
      this.selectionService.currentArtists.subscribe((artists: Artist[] | null) => {
        this.selectedArtists = artists;
        this.tryInitialize();
      })
    );
  
    window.addEventListener('resize', this.onResize.bind(this));
  }
  
  ngOnChanges(): void {
    this.tryInitialize();
  }
  
  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    window.removeEventListener('resize', this.onResize.bind(this));
  }
  
  @HostListener('window:resize', ['$event'])
  onResize(): void {
    this.updateChart();
  }
  
  private updateChart(): void {
    if (!this.exhibitionContainer) return;
    this.tryInitialize();
  }
  
  private tryInitialize(): void {
    if (this.allArtists.length === 0 || this.allExhibitions.length === 0) {
      this.isLoading = true;
      return;
    } else {
      this.retrieveWantedExhibitions();
      this.createChart();
    }
  }
  
  private retrieveWantedExhibitions(): void {
    const wantedExhibitionIds = this.allArtists.flatMap(artist => artist.participated_in_exhibition.map(id => id.toString()));
    this.exhibitions = this.allExhibitions.filter(exhibition => wantedExhibitionIds.includes(exhibition.id.toString()));
  }
  
  private createChart(): void {
    this.createSvg();
    this.drawBinnedChart();
    this.isLoading = false;
  }
  
  private createSvg(): void {
    d3.select(this.exhibitionContainer.nativeElement).select("figure.exhibition-svg-container").select("svg").remove();
    
    const element = this.exhibitionContainer.nativeElement.querySelector('figure.exhibition-svg-container');
    const margin = {
      top: this.margin.top * window.innerHeight / 100,
      right: this.margin.right * window.innerWidth / 100,
      bottom: this.margin.bottom * window.innerWidth / 100,
      left: this.margin.left * window.innerWidth / 100
    };
    const width = element.offsetWidth - margin.left - margin.right;
    const height = element.offsetHeight - margin.top - margin.bottom;
    
    this.svg = d3.select(element).append('svg')
      .attr('width', element.offsetWidth)
      .attr('height', element.offsetHeight)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);
    
    this.contentWidth = width;
    this.contentHeight = height;
  }
  
  private drawBinnedChart(): void {
    const yearData = this.getYearlyExhibitionData();
    const regionKeys = Object.keys(this.artistService.europeanRegions);

    const xScale = d3.scaleBand()
      .domain(yearData.map(d => d.year.toString()))
      .range([0, this.contentWidth])
      .padding(0.1);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(yearData, d => d.totalExhibitions)!])
      .nice()
      .range([this.contentHeight, 0]);

    const colorMap: { [key: string]: string } = {
      "North Europe": this.artistService.cyanColorPalette[Math.floor(this.artistService.cyanColorPalette.length / 2)],
      "Eastern Europe": this.artistService.blueColorPalette[Math.floor(this.artistService.blueColorPalette.length / 2)],
      "Southern Europe": this.artistService.purpleColorPalette[Math.floor(this.artistService.purpleColorPalette.length / 2)],
      "Western Europe": this.artistService.pinkColorPalette[Math.floor(this.artistService.pinkColorPalette.length / 2)],
      "Others": this.artistService.getYellowOrangeColor(0.5),
      "\\N": this.artistService.greyColorPalette[0]
    };

    console.log(regionKeys)
    const stack = d3.stack()
      .keys(regionKeys)
      .value((d: any, key) => d.regions[key] || 0);

    const stackedData = stack(yearData.map(d => ({...d.regions, year: d.year})));

    this.svg.append('g')
      .selectAll('g')
      .data(stackedData)
      .enter().append('g')
      .attr('fill', (d:any) => colorMap[d.key as keyof typeof colorMap] || '#C3C3C3') // Default color if region not found
      .selectAll('rect')
      .data((d:any) => d)
      .enter().append('rect')
      .attr('x', (d:any) => xScale(d.data.year.toString())!)
      .attr('y', (d:any) => yScale(d[1]))
      .attr('height', (d:any)=> yScale(d[0]) - yScale(d[1]))
      .attr('width', xScale.bandwidth());

    this.svg.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${this.contentHeight})`)
      .call(d3.axisBottom(xScale));

    this.svg.append('g')
      .attr('class', 'y-axis')
      .call(d3.axisLeft(yScale).ticks(10));

    const legend = this.svg.append('g')
      .attr('class', 'legend')
      .attr('transform', `translate(${this.contentWidth + 20}, 20)`);

    legend.selectAll('rect')
      .data(regionKeys)
      .enter().append('rect')
      .attr('x', 0)
      .attr('y', (d:any, i:number) => i * 20)
      .attr('width', 18)
      .attr('height', 18)
      .attr('fill', (d:any) => colorMap[d as keyof typeof colorMap] || '#C3C3C3'); // Default color if region not found

    legend.selectAll('text')
      .data(regionKeys)
      .enter().append('text')
      .attr('x', 24)
      .attr('y', (d:any, i:number) => i * 20 + 9)
      .attr('dy', '.35em')
      .text((d:any) => d);
  }
  
  private getYearlyExhibitionData(): YearData[] {
    const yearRange = d3.range(1900, 1920);
    const yearData: YearData[] = yearRange.map(year => ({
      year,
      totalExhibitions: 0,
      regions: {
        "North Europe": 0,
        "Eastern Europe": 0,
        "Southern Europe": 0,
        "Western Europe": 0,
        "Others": 0,
        "\\N": 0
      }
    }));

    this.exhibitions.forEach(exhibition => {
      const startYear = new Date(exhibition.start_date).getFullYear();
      const endYear = new Date(exhibition.end_date).getFullYear();
      const region = this.getRegion(exhibition.took_place_in_country);

      for (let year = startYear; year <= endYear; year++) {
        const yearEntry = yearData.find(d => d.year === year);
        if (yearEntry) {
          yearEntry.totalExhibitions++;
          yearEntry.regions[region]++;
        }
      }
    });

    return yearData;
  }

  private getRegion(country: string): string {
    for (const [region, countries] of Object.entries(this.artistService.europeanRegions)) {
      if (countries.includes(country)) {
        return region;
      }
    }
    return "Others";
  }
}
