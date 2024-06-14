import { Component, OnInit, Input, ViewChild, ElementRef, OnChanges, OnDestroy, HostListener } from '@angular/core';
import * as d3 from 'd3';
import { Artist } from '../../models/artist';
import { SelectionService } from '../../services/selection.service';
import { Subscription } from 'rxjs';
import { DecisionService } from '../../services/decision.service';
import { ArtistService } from '../../services/artist.service';
import { format } from 'd3-format';

@Component({
  selector: 'app-artistGanttChart',
  templateUrl: './artistGanttChart.component.html',
  styleUrls: ['./artistGanttChart.component.css']
})
export class ArtistGanttChartComponent implements OnInit, OnChanges, OnDestroy {
  @ViewChild('artistGantt', { static: true }) private ganttContainer!: ElementRef;
  private subscriptions: Subscription = new Subscription();

  allArtists: Artist[] | null = null;
  selectedArtists: Artist[] | null = null;
  isLoading: boolean = true;
  private svg: any;
  private contentWidth: number = 0;
  private contentHeight: number = 0;
  private legendGroup: any;

  // Margins in vw and vh
  private margin = {
    top: 4,
    right: 0.5,
    bottom: 1,
    left: 2
  };

  constructor(
    private selectionService: SelectionService,
    private decisionService: DecisionService,
    private artistService: ArtistService
  ) {}

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
    if (!this.ganttContainer) return;
    this.tryInitialize();
  }

  private tryInitialize(): void {
    const artists = this.selectedArtists && this.selectedArtists.length > 0 ? this.selectedArtists : this.allArtists;

    if (!artists || artists.length === 0) {
      this.isLoading = false;
      if (this.svg) {
        d3.select(this.ganttContainer.nativeElement).select("figure.artist-gantt-svg-container").select("svg").remove();
      }
      return;
    } else {
      this.createChart(artists);
    }
  }

  private createChart(artists: Artist[]): void {
    this.createSvg(artists);
    this.drawTimeline(artists);
    this.isLoading = false;
  }

  private createSvg(artists: Artist[]): void {
    d3.select(this.ganttContainer.nativeElement).select("figure.artist-gantt-svg-container").select("svg").remove();

    const element = this.ganttContainer.nativeElement.querySelector('figure.artist-gantt-svg-container');
    const margin = {
      top: this.margin.top * window.innerHeight / 100,
      right: this.margin.right * window.innerWidth / 100,
      bottom: this.margin.bottom * window.innerWidth / 100,
      left: this.margin.left * window.innerWidth / 100
    };
    const width = element.offsetWidth - margin.left - margin.right;

    const numArtists = artists.length;
    const barHeight = 5;
    const extraSpace = 0.5 * window.innerWidth / 100;
    const calculatedHeight = (numArtists * barHeight) + extraSpace + margin.top + margin.bottom;

    const height = Math.max(element.offsetHeight, calculatedHeight);

    this.svg = d3.select(element).append('svg')
      .attr('width', element.offsetWidth)
      .attr('height', height)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    this.contentWidth = width;
    this.contentHeight = height - margin.top - margin.bottom;

    // Create a group element for the legend
    this.legendGroup = this.svg.append('g')
      .attr('class', 'legend-group');
  }

  private drawTimeline(artists: Artist[]): void {
    if (artists === null) {
      return;
    }

    const maxBarHeight = 5;

    const timelineData = artists.map(artist => ({
      name: artist.firstname + ' ' + artist.lastname,
      start: new Date(artist.birthyear, 0).getTime(),
      end: new Date(artist.deathyear, 0).getTime(),
      duration: new Date(artist.deathyear, 0).getTime() - new Date(artist.birthyear, 0).getTime(),
      birthCountry: artist.birthcountry,
      deathCountry: artist.deathcountry
    }));

    const xScale = d3.scaleTime()
      .domain([d3.min(timelineData, d => d.start)!, d3.max(timelineData, d => d.end)!])
      .range([0, this.contentWidth])
      .nice();

    const yScale = d3.scaleBand()
      .domain(timelineData.map((d, i) => i.toString()))
      .range([0, this.contentHeight])
      .padding(0.1)
      .round(true);

    const barHeight = Math.min(yScale.bandwidth(), maxBarHeight);

    let yOffset = 0;
    const extraSpace = 0.5 * window.innerWidth / 100;

    const xAxis = d3.axisTop(xScale).tickSize(-this.contentHeight);

    this.svg.append('g')
      .call(xAxis)
      .attr('transform', `translate(0,0)`)
      .selectAll("text")
      .style("text-anchor", "end")
      .attr("dx", "-.8em")
      .attr("dy", ".15em")
      .attr("transform", "rotate(65)")
      .style("font-size", "0.5vw");

    this.svg.selectAll('.tick line')
      .attr('stroke', 'gray');

    // Create gradients for each artist
    const defs = this.svg.append('defs');
    timelineData.forEach((artist, index) => {
      const gradientId = `gradient-${index}`;
      const birthColor = this.artistService.getCountryColor(artist.birthCountry);
      const deathColor = this.artistService.getCountryColor(artist.deathCountry);

      const gradient = defs.append('linearGradient')
        .attr('id', gradientId)
        .attr('x1', '0%')
        .attr('y1', '0%')
        .attr('x2', '100%')
        .attr('y2', '0%');

      gradient.append('stop')
        .attr('offset', '0%')
        .attr('stop-color', birthColor);

      gradient.append('stop')
        .attr('offset', '100%')
        .attr('stop-color', deathColor);
    });

    // Draw the timeline with gradient colors
    timelineData.forEach((artist, index) => {
     
     
        this.svg.append('rect')
          .attr('class', 'bar')
          .attr('x', xScale(artist.start))
          .attr('y', yOffset)
          .attr('width', xScale(artist.end) - xScale(artist.start))
          .attr('height', barHeight)
          .attr('fill', `url(#gradient-${index})`);
      
      yOffset += barHeight + yScale.paddingInner() * yScale.bandwidth();
    });

    this.svg.append('line')
      .attr('x1', 0)
      .attr('x2', this.contentWidth)
      .attr('y1', yOffset)
      .attr('y2', yOffset)
      .attr('stroke', 'gray')
      .attr('stroke-width', 1);
  }
}
