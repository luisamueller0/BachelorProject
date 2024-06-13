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

    exhibitions: Exhibition[]|null = null;
    isLoading: boolean = true;
    noExhibitions = true;
    private svg: any;
    private contentWidth: number = 0;
    private contentHeight: number = 0;

    // Margins in vw and vh
    private margin = {
      top: 10,
      right: 2,
      bottom: 2,
      left: 2
    };

    constructor(private selectionService: SelectionService,
                private exhibitionService: ExhibitionService,
                private artistService: ArtistService) { }

    ngOnInit(): void {
      this.subscriptions.add(
        this.selectionService.currentExhibitions.subscribe((exhibitions) => {
          this.exhibitions = exhibitions;
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
      const exhibitions :Exhibition[]|null= this.exhibitions;
      if(exhibitions ===null){
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

      // Calculate the height based on the number of countries and exhibitions
      const numExhibitions = exhibitions.length;
      const numCountries = new Set(exhibitions.map(exhibition => exhibition.took_place_in_country)).size;
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
      const exhibitions: Exhibition[] | null = this.exhibitions;
      if (exhibitions === null) {
        return;
      }
    
      const timelineData = exhibitions.map(exhibition => ({
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
        .range([0, this.contentWidth])
        .nice();
    
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
        .attr("transform", "rotate(65)")
        .style("font-size", "0.5vw");  // Change font size of x-axis labels
    
      // Change the color of the grid lines on the x-axis
      this.svg.selectAll('.tick line')
        .attr('stroke', 'gray');  // Change this to the desired color
    
      const extraSpace = 0.2 * window.innerWidth / 100; // 2vw space between countries
    
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
          .style('font-size', '0.5vw')  // Change font size for country labels
          .text(country);
    
        // Draw bars or circles for each exhibition
        exhibitions.forEach(exhibition => {
          const isSingleDay = exhibition.start === exhibition.end;
    
          if (isSingleDay) {
            // Draw a circle
            this.svg.append('circle')
              .attr('class', 'circle')
              .attr('cx', xScale(exhibition.start))
              .attr('cy', yOffset + yScale.bandwidth() / 2)
              .attr('r', yScale.bandwidth() / 2) 
             .attr('fill', timelineData.length !== 1 ? colorScale(exhibition.normalizedParticipants) : colorScale(1));
          } else {
            // Draw a bar
            this.svg.append('rect')
              .attr('class', 'bar')
              .attr('x', xScale(exhibition.start))
              .attr('y', yOffset)
              .attr('width', xScale(exhibition.end) - xScale(exhibition.start) === 0 ? 1 : xScale(exhibition.end) - xScale(exhibition.start))
              .attr('height', yScale.bandwidth())
              .attr('fill', timelineData.length !== 1 ? colorScale(exhibition.normalizedParticipants) : colorScale(1));
          }
          yOffset += yScale.bandwidth();
        });
    
        yOffset += extraSpace; // Extra space between different country groups
      });
    
      // Add legend
      const legendHeight = 10;
      const legendWidth = 100;
      const legendX = 80; // Position legend on the top
      const legendY = -80; // Adjust legend position
    
      const legend = this.svg.append('g')
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
    
      // Legend axis with normalized values from 0 to 1
      const legendScale = d3.scaleLinear()
        .domain([0, 1])
        .range([0, legendWidth]);
    
      const legendAxis = d3.axisBottom(legendScale)
        .ticks(6)
        .tickFormat(d3.format(".1f")); // Format ticks to show one decimal place
    
      const legendGroup = legend.append('g')
        .attr('transform', `translate(0, ${legendHeight})`)
        .call(legendAxis)
      legendGroup.selectAll('text')
        .style('font-size', '0.5vw'); // Smaller font size for legend axis
    
      // Add participants label
      legend.append('text')
        .attr('x', -10)
        .attr('y', legendHeight + 25) // Adjust this to position the label correctly
        .attr('text-anchor', 'start')
        .style('font-size', '0.5vw')
        .text('Normalized Number of Participants');
    }
    
    

    private normalizeLogarithmically(values: number[]): number[] {
      const logMaxValue = Math.log1p(Math.max(...values));
      const logMinValue = Math.log1p(Math.min(...values));
      const range = logMaxValue - logMinValue;
      return values.map(value => (Math.log1p(value) - logMinValue) / range); // Normalize by dividing by the max degree
    }
}
