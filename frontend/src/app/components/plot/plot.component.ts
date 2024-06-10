import { Component, OnInit, Input, ViewChild, ElementRef, OnChanges, OnDestroy, HostListener } from '@angular/core';
import * as d3 from 'd3';
import { Artist } from '../../models/artist';
import { SelectionService } from '../../services/selection.service';
import { Subscription } from 'rxjs';
import { DecisionService } from '../../services/decision.service';
import { ArtistService } from '../../services/artist.service';
import { format } from 'd3-format';
@Component({
  selector: 'app-plot',
  templateUrl: './plot.component.html',
  styleUrls: ['./plot.component.css']
})
export class PlotComponent implements OnInit, OnChanges, OnDestroy {
  @ViewChild('plot', { static: true }) private plotContainer!: ElementRef;
  private subscriptions: Subscription = new Subscription();

  allArtists: Artist[] = [];
  selectedArtists: Artist[] | null = [];
  nonselectedArtists: Artist[] = [];
  isLoading: boolean = true;
  private svg: any;
  private contentWidth: number = 0;
  private contentHeight: number = 0;

  // Margins in vw and vh
  private margin = {
    top: 2,
    right: 1,
    bottom: 6,
    left: 4
  };

  constructor(private selectionService: SelectionService,
    private decisionService: DecisionService,
    private artistService: ArtistService
  ) { }

  ngOnInit(): void {
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
    if (!this.plotContainer) return;
    this.tryInitialize();
  }

  private tryInitialize(): void {
    if (this.allArtists.length === 0) {
      this.isLoading = true;
      return;
    } else {
      this.createChart();
    }
  }

  private createChart(): void {
    this.createSvg();
    this.drawScatterPlot();
    this.isLoading = false;
  }

  private createSvg(): void {
    // Remove any existing SVG elements
    d3.select(this.plotContainer.nativeElement).select("figure.plot-svg-container").select("svg").remove();

    const element = this.plotContainer.nativeElement.querySelector('figure.plot-svg-container');
    const margin = {
      top: this.margin.top * window.innerHeight / 100,
      right: this.margin.right * window.innerWidth / 100,
      bottom: this.margin.bottom * window.innerWidth / 100,
      left: this.margin.left * window.innerWidth / 100
    };
    const width = element.offsetWidth - margin.left - margin.right;
    const height = element.offsetHeight - margin.top - margin.bottom;

    this.svg = d3.select(element).append('svg')
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('viewBox', `0 0 ${element.offsetWidth} ${element.offsetHeight}`)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    this.contentWidth = width;
    this.contentHeight = height;
  }

  private drawScatterPlot(): void {
    if (!this.allArtists.length) return;
  
    const selectedArtists = this.selectedArtists || [];
    console.log('artists', this.allArtists, selectedArtists);
  
    if (selectedArtists.length === 0) {
      this.nonselectedArtists = this.allArtists;
    } else {
      this.nonselectedArtists = this.allArtists.filter(artist => !selectedArtists.find(a => a.id === artist.id));
    }
  
    // Define scales
    const birthExtent = d3.extent(this.allArtists, d => d.birthyear);
    const deathExtent = d3.extent(this.allArtists, d => d.deathyear);
  
    const x = d3.scaleLinear()
      .domain(birthExtent[0] !== undefined && birthExtent[1] !== undefined ? [birthExtent[0], birthExtent[1]] : [0, 0])
      .range([0, this.contentWidth]);
  
    const y = d3.scaleLinear()
      .domain(deathExtent[0] !== undefined && deathExtent[1] !== undefined ? [deathExtent[0], deathExtent[1]] : [0, 0])
      .range([this.contentHeight, 0]);
  
    // Define axes
    const xAxis = d3.axisBottom(x)
      .ticks(10)
      .tickFormat(format('d'));  // Format ticks as plain integers
  
    const yAxis = d3.axisLeft(y)
      .ticks(10)
      .tickFormat(format('d'));  // Format ticks as plain integers
  
    // Append axes
    this.svg.append("g")
      .attr("transform", `translate(0,${this.contentHeight})`)
      .call(xAxis);
  
    this.svg.append("g")
      .call(yAxis);
  
    // Append axis labels
    this.svg.append("text")
      .attr("class", "x axis-label")
      .attr("text-anchor", "middle")
      .attr("x", this.contentWidth / 2)
      .attr("y", this.contentHeight + 25)  // Adjust this value to position the label correctly
      .text("Birth Year");
  
      this.svg.append("text")
  .attr("class", "axis-label")
  .attr("transform", "rotate(-90)")
  .attr("x", -this.contentHeight / 2)  // Adjust the x position after rotation
  .attr("y", -30)  // Adjust the y position as needed, negative value to move left
  .style("text-anchor", "middle")
  .text("Death Year");

    // Plot non-selected artists with lower opacity
    if (this.selectedArtists) {
      this.svg.append("g")
        .selectAll("circle")
        .data(this.nonselectedArtists)
        .enter().append("circle")
        .attr("cx", (d: any) => x(d.birthyear))
        .attr("cy", (d: any) => y(d.deathyear))
        .attr("r", 2)
        .attr("fill", "gray")
        .attr("opacity", 0.2);
  
      // Plot selected artists with full opacity
      this.svg.append("g")
        .selectAll("circle")
        .data(selectedArtists)
        .enter().append("circle")
        .attr("cx", (d: any) => x(d.birthyear))
        .attr("cy", (d: any) => y(d.deathyear))
        .attr("r", 2)
        .attr("fill", "steelblue")
        .attr("opacity", 1);
    } else {
      this.svg.append("g")
        .selectAll("circle")
        .data(this.nonselectedArtists)
        .enter().append("circle")
        .attr("cx", (d: any) => x(d.birthyear))
        .attr("cy", (d: any) => y(d.deathyear))
        .attr("r", 2)
        .attr("fill", "gray")
        .attr("opacity", 1);
    }
  }
  
  }