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
    top: 4.5,
    right: 1.5,
    bottom: 1,
    left: 1.5
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
  
    // Group the artists by cluster
    const groupedByCluster = d3.group(artists, artist => artist.cluster + 1);
    const numClusters = groupedByCluster.size;
  
    // Calculate the required height
    const calculatedHeight = (numArtists * barHeight) + (numClusters * extraSpace) + margin.top + margin.bottom;
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
    if (!artists) {
      return;
    }
  
    const allArtists = this.allArtists || [];
  
    const maxBarHeight = 5;
  
    // Map of all artists by ID for easy lookup
    const allArtistsMap = new Map<number, Artist>();
    allArtists.forEach(artist => allArtistsMap.set(artist.id, artist));
  
    // Determine if there is only one selected artist
    const selectedArtist = this.selectedArtists && this.selectedArtists.length === 1 ? this.selectedArtists[0] : null;
    const selectedCluster = selectedArtist ? selectedArtist.cluster + 1 : null;
  
    // Create timeline data based on selected artist and clusters
    const timelineData = selectedCluster
      ? allArtists.filter(artist => artist.cluster + 1 === selectedCluster).map(artist => ({
          name: artist.firstname + ' ' + artist.lastname,
          start: new Date(artist.birthyear, 0).getTime(),
          end: new Date(artist.deathyear, 0).getTime(),
          duration: new Date(artist.deathyear, 0).getTime() - new Date(artist.birthyear, 0).getTime(),
          birthCountry: artist.birthcountry,
          deathCountry: artist.deathcountry,
          birthyear: artist.birthyear,
          deathyear: artist.deathyear,
          clusterIndex: artist.cluster + 1,
          id: artist.id
        }))
      : artists.map(artist => ({
          name: artist.firstname + ' ' + artist.lastname,
          start: new Date(artist.birthyear, 0).getTime(),
          end: new Date(artist.deathyear, 0).getTime(),
          duration: new Date(artist.deathyear, 0).getTime() - new Date(artist.birthyear, 0).getTime(),
          birthCountry: artist.birthcountry,
          deathCountry: artist.deathcountry,
          birthyear: artist.birthyear,
          deathyear: artist.deathyear,
          clusterIndex: artist.cluster + 1,
          id: artist.id
        }));
  
    const groupedByCluster = d3.group(timelineData, d => d.clusterIndex);
    const sortedClusters = Array.from(groupedByCluster.entries())
      .sort((a, b) => d3.ascending(a[0], b[0]))  // Sort by cluster index (ascending)
      .map(([clusterIndex]) => clusterIndex);
  
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
  
    const colorScale = d3.scaleSequential(d3.interpolatePlasma)
      .domain([0, 1]);
  
    let yOffset = 0;
    const extraSpace = 0.5 * window.innerWidth / 100;
    const halfExtraSpace = extraSpace / 2;
    sortedClusters.forEach(cluster => {
      const clusterArtists = groupedByCluster.get(cluster)!;
      yOffset += (clusterArtists.length * barHeight) + extraSpace;
    });
  
    const xAxis = d3.axisTop(xScale).tickSize(-yOffset);
  
    this.svg.append('g')
      .call(xAxis)
      .attr('transform', `translate(0,0)`)
      .selectAll("text")
      .style("text-anchor", "end")
      .attr("dx", "-.8em")
      .attr("dy", ".15em")
      .attr("transform", "rotate(65)")
      .style("font-size", "0.6vw");
  
    this.svg.selectAll('.tick line')
      .attr('stroke', 'gray');
  
    yOffset = 0;
    const defs = this.svg.append('defs');
  
    sortedClusters.forEach((cluster, index) => {
      let clusterArtists = groupedByCluster.get(cluster)!;
  
      yOffset += halfExtraSpace; // Add half of the extra space on top
  
      this.svg.append('text')
        .attr('class', 'label')
        .attr('x', -10)
        .attr('y', yOffset + (clusterArtists.length * barHeight / 2))
        .attr('dy', '.35em')
        .attr('text-anchor', 'end')
        .attr('fill', '#2a0052')
        .style('font-size', '0.7vw')
        .text(cluster);
  
      clusterArtists.forEach((artist, index) => {
        const gradientId = `gradient-${artist.id}`;
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
  
        const tooltip = d3.select("div#tooltip");
  
        const showTooltip = (event: any, d: any) => {
          const age = artist.deathyear - artist.birthyear;
  
          const tooltipNode = tooltip.node() as HTMLElement;
          const tooltipWidth = tooltipNode.offsetWidth;
  
          tooltip.style("display", "block")
            .style("left", `${event.pageX - tooltipWidth}px`)
            .style("top", `${event.pageY + 5}px`)
            .style("color", "black")
            .html(`Name: ${artist.name}<br/>Birth: ${artist.birthyear}  in ${artist.birthCountry}<br/>Death: ${artist.deathyear} in ${artist.deathCountry}<br/>Age: ${age}`);
        };
  
        const hideTooltip = () => {
          tooltip.style("display", "none");
        };
  
        const click = (event: any, d: any) => {
          this.decisionService.changeSearchedArtistId(artist.id.toString());
          console.log('hallo', typeof artist.id);
        };
  
        const opacity = selectedArtist && selectedCluster === artist.clusterIndex ? (selectedArtist.id === artist.id ? 1 : 0.3) : 1;
        const strokeWidth = selectedArtist && selectedCluster === artist.clusterIndex ? (selectedArtist.id === artist.id ? 0.1 : 0) : 0.2;

  
        this.svg.append('rect')
          .attr('class', 'bar')
          .attr('x', xScale(artist.start))
          .attr('y', yOffset)
          .attr('width', xScale(artist.end) - xScale(artist.start) === 0 ? 1 : xScale(artist.end) - xScale(artist.start))
          .attr('height', barHeight)
          .attr('fill', `url(#${gradientId})`)
          .attr('opacity', opacity)
          .attr('stroke', 'black')
          .attr('stroke-width', strokeWidth)
          .on("mouseover", showTooltip)
          .on("mousemove", showTooltip)
          .on("mouseout", hideTooltip)
          .on("click", click);
  
        yOffset += barHeight;
      });
  
      yOffset += halfExtraSpace;
    });
  
    this.svg.append('line')
      .attr('x1', 0)
      .attr('x2', this.contentWidth)
      .attr('y1', yOffset)
      .attr('y2', yOffset)
      .attr('stroke', 'gray')
      .attr('stroke-width', 1);
  
    const linearGradient = defs.append('linearGradient')
      .attr('id', 'linear-gradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '100%')
      .attr('y2', '0%');
  
    const stops = d3.range(0, 1.01, 0.01).map((t: number) => ({
      offset: `${t * 100}%`,
      color: colorScale(t)
    }));
  
    linearGradient.selectAll('stop')
      .data(stops)
      .enter().append('stop')
      .attr('offset', (d: { offset: string; color: string }) => d.offset)
      .attr('stop-color', (d: { offset: string; color: string }) => d.color);
  }
}
