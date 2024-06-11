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

  private showTooltipForSelected: boolean = false;


  // Margins in vw and vh
  private margin = {
    top: 1.5,
    right: 1,
    bottom: 4.2,
    left: 3.5
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

  // Filter out artists with -1 as birthyear or deathyear
  const filteredNonselectedArtists = this.nonselectedArtists.filter(artist => artist.birthyear !== -1 && artist.deathyear !== -1);
  const filteredSelectedArtists = selectedArtists.filter(artist => artist.birthyear !== -1 && artist.deathyear !== -1);

  // Define scales with padding
  const padding = 5; // Number of years to pad
  const birthExtent = d3.extent(this.allArtists, d => d.birthyear);
  const deathExtent = d3.extent(this.allArtists, d => d.deathyear);

  const x = d3.scaleLinear()
    .domain(birthExtent[0] !== undefined && birthExtent[1] !== undefined ? [birthExtent[0] - padding, birthExtent[1] + padding] : [0, 0])
    .range([0, this.contentWidth]).nice();

  const y = d3.scaleLinear()
    .domain(deathExtent[0] !== undefined && deathExtent[1] !== undefined ? [deathExtent[0] - padding, deathExtent[1] + padding] : [0, 0])
    .range([this.contentHeight, 0]).nice();

  // Define axes
  const xAxis = d3.axisBottom(x)
    .ticks(10)
    .tickFormat(format('d'));  // Format ticks as plain integers

  const yAxis = d3.axisLeft(y)
    .ticks(10)
    .tickFormat(format('d'));  // Format ticks as plain integers

  // Append axes
  const xAxisGroup = this.svg.append("g")
    .attr("transform", `translate(0,${this.contentHeight})`)
    .call(xAxis);

  xAxisGroup.selectAll("text")
    .style("font-size", "0.5vw"); // Adjust the size as needed

  const yAxisGroup = this.svg.append("g")
    .call(yAxis);

  yAxisGroup.selectAll("text")
    .style("font-size", "0.5vw"); // Adjust the size as needed

  // Append axis labels
  this.svg.append("text")
    .attr("class", "x axis-label")
    .attr("text-anchor", "middle")
    .attr("x", this.contentWidth / 2)
    .attr("y", this.contentHeight + (4 * window.innerHeight / 100))  // Adjust based on viewport height
    .text("Birth Year");

  this.svg.append("text")
    .attr("class", "axis-label")
    .attr("transform", "rotate(-90)")
    .attr("x", -this.contentHeight / 2)
    .attr("y", - (2.5 * window.innerWidth / 100))  // Adjust based on viewport width
    .style("text-anchor", "middle")
    .text("Death Year");

  // Create tooltip
  const tooltip = d3.select("div#tooltip");

  const showTooltip = (event: any, d: any) => {
    const age = d.deathyear - d.birthyear;

    const tooltipNode = tooltip.node() as HTMLElement;
    const tooltipWidth = tooltipNode.offsetWidth;

    tooltip.style("display", "block")
      .style("left", `${event.pageX - tooltipWidth}px`)
      .style("top", `${event.pageY + 5}px`)
      .style("color", "black")
      .html(`Name: ${d.firstname} ${d.lastname}<br/>Birth Year: ${d.birthyear}<br/>Death Year: ${d.deathyear}<br/>Age: ${age}`);
  };

  const hideTooltip = () => {
    tooltip.style("display", "none");
  };

  const click = (event: any, d: any) => {
    this.decisionService.changeSearchedArtistId(d.id.toString());
    console.log('hallo', typeof d.id);
  };

  if(this.selectedArtists){
  // Plot non-selected artists with lower opacity
  this.svg.append("g")
    .selectAll("circle")
    .data(filteredNonselectedArtists)
    .enter().append("circle")
    .attr("cx", (d: any) => x(d.birthyear))
    .attr("cy", (d: any) => y(d.deathyear))
    .attr("r", 2)
    .attr("fill", "gray")
    .attr("opacity", 0.2);

  // Plot selected artists with full opacity
  this.svg.append("g")
    .selectAll("circle")
    .data(filteredSelectedArtists)
    .enter().append("circle")
    .attr("cx", (d: any) => x(d.birthyear))
    .attr("cy", (d: any) => y(d.deathyear))
    .attr("r", 2)
    .attr("fill", "steelblue")
    .attr("opacity", 1)
    .on("mouseover", showTooltip)
    .on("mousemove", showTooltip)
    .on("mouseout", hideTooltip)
    .on("click", click);
  }
  else{
    this.svg.append("g")
    .selectAll("circle")
    .data(filteredNonselectedArtists)
    .enter().append("circle")
    .attr("cx", (d: any) => x(d.birthyear))
    .attr("cy", (d: any) => y(d.deathyear))
    .attr("r", 2)
    .attr("fill", "steelblue")
    .attr("opacity", 1)
    .on("mouseover", showTooltip)
    .on("mousemove", showTooltip)
    .on("mouseout", hideTooltip)
    .on("click", click);

  }
}

  }