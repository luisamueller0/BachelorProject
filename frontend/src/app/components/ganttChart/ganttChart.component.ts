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

    private exhibitions: Exhibition[]|null = null;
    private fullOpacityExhibitions: Set<string> = new Set();
    isLoading: boolean = true;
    noExhibitions = true;
    private svg: any;
    private contentWidth: number = 0;
    private contentHeight: number = 0;
    private legendGroup: any;

    // Margins in vw and vh
    private margin = {
      top: 11.5,
      right: 0.5,
      bottom: 1,
      left: 2
    };

    constructor(private selectionService: SelectionService,
                private exhibitionService: ExhibitionService,
                private artistService: ArtistService) { }

    ngOnInit(): void {
      this.subscriptions.add(
        this.selectionService.currentExhibitions.subscribe((exhibitions) => {
          if (exhibitions) {
           
            // Separate exhibitions into those that should be full opacity and those with less opacity
            const [fullOpacityExhibitions, lessOpacityExhibitions] = exhibitions;
            console.log(fullOpacityExhibitions)
            console.log(lessOpacityExhibitions)
            if (lessOpacityExhibitions.length === 0) {
              console.log('hallo')
           
              // If the second array is empty, draw all exhibitions with full opacity
              this.exhibitions = fullOpacityExhibitions;
            } else {
              // Combine the two arrays and handle opacity in drawTimeline
              this.exhibitions = [...fullOpacityExhibitions, ...lessOpacityExhibitions];
              this.fullOpacityExhibitions = new Set(fullOpacityExhibitions.map(e => e.id.toString()));
            }
    
            this.tryInitialize();
          }
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
      if (!this.exhibitions || this.exhibitions.length === 0) {
        this.noExhibitions = true;
        this.isLoading = false;
        if (this.svg) {
          d3.select(this.ganttContainer.nativeElement).select("figure.gantt-svg-container").select("svg").remove();
        }
        return;
      } else {
        this.noExhibitions = false;
        this.createChart();
      }
    }

    private createChart(): void {
      this.createSvg();
      this.drawTimeline();
      this.isLoading = false;
    }

    private createSvg(): void {
      const exhibitions: Exhibition[] | null = this.exhibitions;
      if (exhibitions === null) {
          return;
      }
  
      d3.select(this.ganttContainer.nativeElement).select("figure.gantt-svg-container").select("svg").remove();
  
      const element = this.ganttContainer.nativeElement.querySelector('figure.gantt-svg-container');
      const margin = {
          top: this.margin.top * window.innerHeight / 100,
          right: this.margin.right * window.innerWidth / 100,
          bottom: this.margin.bottom * window.innerWidth / 100,
          left: this.margin.left * window.innerWidth / 100
      };
      const width = element.offsetWidth - margin.left - margin.right;
  
      const numExhibitions = exhibitions.length;
      const numCountries = new Set(exhibitions.map(exhibition => exhibition.took_place_in_country)).size;
      const barHeight = 5;
      const extraSpace = 0.5 * window.innerWidth / 100;
      const calculatedHeight = (numExhibitions * barHeight) + (numCountries * extraSpace) + margin.top + margin.bottom;
  
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
  
  private drawTimeline(): void {
    const exhibitions: Exhibition[] | null = this.exhibitions;
    if (exhibitions === null) {
      return;
    }
  
    const maxBarHeight = 5;
  
    const timelineData = exhibitions.map(exhibition => ({
      id: exhibition.id, // Keep track of the exhibition ID
      name: exhibition.name,
      start: new Date(exhibition.start_date).getTime(),
      end: new Date(exhibition.end_date).getTime(),
      duration: new Date(exhibition.end_date).getTime() - new Date(exhibition.start_date).getTime(),
      amountParticipants: exhibition.exhibited_artists,
      country: exhibition.took_place_in_country,
      normalizedParticipants: 0
    }));
  
    const normalizedParticipants = this.normalizeLogarithmically(timelineData.map(d => d.amountParticipants));
  
    timelineData.forEach((d, i) => {
      d.normalizedParticipants = normalizedParticipants[i];
    });

    console.log(timelineData)
  
    const groupedByCountry = d3.group(timelineData, d => d.country);
    const sortedCountries = Array.from(groupedByCountry.entries())
      .sort(([, a], [, b]) => d3.descending(a.length, b.length))
      .map(([country]) => country);
  
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
  
    // Calculate the total height needed for the bars and extra space
    let yOffset = 0;
    const extraSpace = 0.5 * window.innerWidth / 100;
    sortedCountries.forEach((country) => {
      const exhibitions = groupedByCountry.get(country)!;
      yOffset += (exhibitions.length * barHeight) + extraSpace;
    });
  
    const xAxis = d3.axisTop(xScale).tickSize(-yOffset);
  
    const xAxisGroup = this.svg.append('g')
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
  
    yOffset = 0;
    sortedCountries.forEach((country, index) => {
      const exhibitions = groupedByCountry.get(country)!;
      exhibitions.sort((a, b) => d3.ascending(a.start, b.start));
  
      const countryColor = this.artistService.getCountryColor(country, 0.1);
  
      this.svg.append('rect')
        .attr('x', 0)
        .attr('y', yOffset)
        .attr('width', this.contentWidth)
        .attr('height', exhibitions.length * barHeight)
        .attr('fill', countryColor);
  
      this.svg.append('text')
        .attr('class', 'label')
        .attr('x', -10)
        .attr('y', yOffset + (exhibitions.length * barHeight / 2))
        .attr('dy', '.35em')
        .attr('text-anchor', 'end')
        .attr('fill', this.artistService.getCountryColor(country))
        .style('font-size', '0.5vw')
        .text(country);
  
      exhibitions.forEach(exhibition => {
        const opacity = this.fullOpacityExhibitions.has(exhibition.id.toString()) ? 1 : 0.5; // Ensure ID is a string
  
     
          this.svg.append('rect')
            .attr('class', 'bar')
            .attr('x', xScale(exhibition.start))
            .attr('y', yOffset)
            .attr('width', xScale(exhibition.end) - xScale(exhibition.start) === 0 ? 1 : xScale(exhibition.end) - xScale(exhibition.start))
            .attr('height', barHeight)
            .attr('fill', timelineData.length !== 1 ? colorScale(exhibition.normalizedParticipants) : colorScale(1))
            .attr('opacity', opacity);
        
        yOffset += barHeight;
      });
  
      yOffset += extraSpace;
    });
  
    this.svg.append('line')
      .attr('x1', 0)
      .attr('x2', this.contentWidth)
      .attr('y1', yOffset)
      .attr('y2', yOffset)
      .attr('stroke', 'gray')
      .attr('stroke-width', 1);
  
    // Calculate the position of the legend
    const legendHeight = 0.5 * window.innerWidth / 100;
    const legendWidth = this.contentWidth / 4 * 3;
    const legendX = (this.contentWidth - legendWidth) / 2; // Center the legend horizontally
    const legendY = -4.5 * window.innerWidth / 100; // Position the legend based on top margin
  
    const legend = this.legendGroup
      .attr('transform', `translate(${legendX}, ${legendY})`);
  
    // Create gradient for legend
    const defs = this.svg.append('defs');
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
  
    // Draw legend
    legend.append('rect')
      .attr('width', legendWidth)
      .attr('height', legendHeight)
      .style('fill', 'url(#linear-gradient)');
  
    // Add participants label above the legend
    legend.append('text')
      .attr('x', legendWidth / 2)
      .attr('y', -0.5 * window.innerWidth / 100) // Adjusted position above the legend rectangle
      .attr('text-anchor', 'middle')
      .style('font-size', '0.5vw')
      .attr('fill', '#2a0052')
      .text('Normalized Number of Participants');
  
    // Legend axis with normalized values from 0 to 1
    const legendScale = d3.scaleLinear()
      .domain([0, 1])
      .range([0, legendWidth]);
  
    const legendAxis = d3.axisBottom(legendScale)
      .ticks(6)
      .tickFormat(d3.format(".1f")); // Format ticks to show one decimal place
  
    const legendAxisGroup = legend.append('g')
      .attr('transform', `translate(0, ${legendHeight})`)
      .call(legendAxis);
  
    legendAxisGroup.selectAll('text')
      .style('font-size', '0.5vw'); // Smaller font size for legend axis
  }
  
  
  
  
    
    

    private normalizeLogarithmically(values: number[]): number[] {
      const logMaxValue = Math.log1p(Math.max(...values));
      const logMinValue = Math.log1p(Math.min(...values));
      const range = logMaxValue - logMinValue;
      return values.map(value => (Math.log1p(value) - logMinValue) / range); // Normalize by dividing by the max degree
    }
}
