import { Component, OnInit, Input, ViewChild, ElementRef, OnChanges, OnDestroy, HostListener } from '@angular/core';
import * as d3 from 'd3';
import { Artist } from '../../models/artist';
import { SelectionService } from '../../services/selection.service';
import { Subscription } from 'rxjs';
import { ExhibitionService } from '../../services/exhibition.service';
import { Exhibition } from '../../models/exhibition';
import { ArtistService } from '../../services/artist.service';

@Component({
  selector: 'app-ganttChart',
  templateUrl: './ganttChart.component.html',
  styleUrls: ['./ganttChart.component.css']
})
export class GanttChartComponent implements OnInit, OnChanges, OnDestroy {
    @ViewChild('gantt', { static: true }) private ganttContainer!: ElementRef;
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
  
    // Margins in vw and vh
    private margin = {
      top: 5,
      right: 10, // Increase right margin to accommodate legend
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
      if (!this.ganttContainer) return;
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
      this.drawTimeline();
      this.isLoading = false;
    }
  
    private createSvg(): void {
      d3.select(this.ganttContainer.nativeElement).select("figure.gantt-svg-container").select("svg").remove();
    
      const element = this.ganttContainer.nativeElement.querySelector('figure.gantt-svg-container');
      const margin = {
        top: this.margin.top * window.innerHeight / 100,
        right: this.margin.right * window.innerWidth / 100,
        bottom: this.margin.bottom * window.innerWidth / 100,
        left: this.margin.left * window.innerWidth / 100
      };
      const width = element.offsetWidth - margin.left - margin.right;
    
      // Calculate the height based on the number of countries and exhibitions
      const numExhibitions = this.exhibitions.length;
      const numCountries = new Set(this.exhibitions.map(exhibition => exhibition.took_place_in_country)).size;
      const barHeight = 2; // Height of each bar
      const extraSpace = 2 * window.innerWidth / 100; // Space between countries
      const calculatedHeight = (numExhibitions * barHeight) + (numCountries * extraSpace) + margin.top + margin.bottom;
    
      const height = Math.max(element.offsetHeight, calculatedHeight);
    
      this.svg = d3.select(element).append('svg')
        .attr('width', element.offsetWidth)
        .attr('height', height)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);
    
      this.contentWidth = width;
      this.contentHeight = height - margin.top - margin.bottom;
    }
    
    private drawTimeline(): void {
      const timelineData = this.exhibitions.map(exhibition => ({
        name: exhibition.name,
        start: new Date(exhibition.start_date).getTime(),
        end: new Date(exhibition.end_date).getTime(),
        duration: new Date(exhibition.end_date).getTime() - new Date(exhibition.start_date).getTime(),
        amountParticipants: exhibition.exhibited_artists,
        country: exhibition.took_place_in_country,
        normalizedParticipants: 0 // Add this property for initialization
      }));
    
      const normalizedParticipants = this.normalizeLogarithmically(timelineData.map(d => d.amountParticipants));
    
      timelineData.forEach((d, i) => {
        d.normalizedParticipants = normalizedParticipants[i];
      });
    
      const groupedByCountry = d3.group(timelineData, d => d.country);
      const sortedCountries = Array.from(groupedByCountry.entries())
        .sort(([, a], [, b]) => d3.descending(a.length, b.length)) // Sort by number of exhibitions
        .map(([country]) => country);
    
      const xScale = d3.scaleTime()
        .domain([d3.min(timelineData, d => d.start)!, d3.max(timelineData, d => d.end)!])
        .range([0, this.contentWidth]);
    
      const yScale = d3.scaleBand()
        .domain(timelineData.map((d, i) => i.toString()))
        .range([0, this.contentHeight])
        .padding(0.1);
    
      const colorScale = d3.scaleSequential(d3.interpolatePlasma)
        .domain([0, 1]); // Normalized participants are between 0 and 1
    
      // Create x-axis with grid lines at the top
      const xAxis = d3.axisTop(xScale).tickSize(-this.contentHeight);
    
      const xAxisGroup = this.svg.append('g')
        .call(xAxis)
        .attr('transform', `translate(0,0)`)
        .selectAll("text")
        .style("text-anchor", "end")
        .attr("dx", "-.8em")
        .attr("dy", ".15em")
        .attr("transform", "rotate(65)");
    
      // Change the color of the grid lines on the x-axis
      this.svg.selectAll('.tick line')
        .attr('stroke', 'lightblue');  // Change this to the desired color
    
      const extraSpace = 0.5 * window.innerWidth / 100; // 2vw space between countries
    
      let yOffset = 0;
      sortedCountries.forEach((country, index) => {
        const exhibitions = groupedByCountry.get(country)!;
        exhibitions.sort((a, b) => d3.ascending(a.start, b.start));
    
        const countryColor = this.artistService.getCountryColor(country, 0.1); // Lighter background color
    
        // Draw background for the country section
        this.svg.append('rect')
          .attr('x', 0)
          .attr('y', yOffset)
          .attr('width', this.contentWidth)
          .attr('height', exhibitions.length * yScale.bandwidth())
          .attr('fill', countryColor);
    
        // Add country label
        this.svg.append('text')
          .attr('class', 'label')
          .attr('x', -10)
          .attr('y', yOffset + (exhibitions.length * yScale.bandwidth() / 2))
          .attr('dy', '.35em')
          .attr('text-anchor', 'end')
          .attr('fill', this.artistService.getCountryColor(country))
          .text(this.artistService.countryMap[country] || country);
    
        // Draw bars for each exhibition
        exhibitions.forEach(exhibition => {
          this.svg.append('rect')
            .attr('class', 'bar')
            .attr('x', xScale(exhibition.start))
            .attr('y', yOffset)
            .attr('width', xScale(exhibition.end) - xScale(exhibition.start) === 0 ? 1 : xScale(exhibition.end) - xScale(exhibition.start))
            .attr('height', yScale.bandwidth())
            .attr('fill', colorScale(exhibition.normalizedParticipants));
          yOffset += yScale.bandwidth();
        });
    
        yOffset += extraSpace; // Extra space between different country groups
      });
    
      // Add legend
      const legendHeight = 200;
      const legendWidth = 20;
      const legendX = this.contentWidth + 20; // Position legend to the right of the chart
      const legendY = this.contentHeight - legendHeight - 20; // Position legend near the bottom right corner
    
      const legend = this.svg.append('g')
        .attr('transform', `translate(${legendX}, ${legendY})`);
    
      // Legend title
      legend.append('text')
        .attr('x', 0)
        .attr('y', -10)
        .attr('text-anchor', 'start')
        .attr('font-weight', 'bold')
        .text('Participants');
    
      // Create gradient for legend
      const defs = this.svg.append('defs');
      const linearGradient = defs.append('linearGradient')
        .attr('id', 'linear-gradient')
        .attr('x1', '0%')
        .attr('y1', '100%')
        .attr('x2', '0%')
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
    
      // Draw legend
      legend.append('rect')
        .attr('width', legendWidth)
        .attr('height', legendHeight)
        .style('fill', 'url(#linear-gradient)');
    
      // Legend axis with normalized values from 0 to 1
      const legendScale = d3.scaleLinear()
        .domain([0, 1])
        .range([legendHeight, 0]);
    
      const legendAxis = d3.axisRight(legendScale)
        .ticks(6)
        .tickFormat(d3.format(".1f")); // Format ticks to show one decimal place
    
      legend.append('g')
        .attr('transform', `translate(${legendWidth}, 0)`)
        .call(legendAxis);
    }
    
  
    
  
  
    private normalizeLogarithmically(values: number[]): number[] {
      const logMaxValue = Math.log1p(Math.max(...values));
      const logMinValue = Math.log1p(Math.min(...values));
      const range = logMaxValue - logMinValue;
      return values.map(value => (Math.log1p(value) - logMinValue) / range); // Normalize by dividing by the max degree
    }
  }
  