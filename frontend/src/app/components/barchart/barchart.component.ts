import { Component, OnInit, Input, ViewChild, ElementRef, OnChanges, HostListener } from '@angular/core';
import * as d3 from 'd3';
import { Artist } from '../../models/artist';
import { SelectionService } from '../../services/selection.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-barchart',
  templateUrl: './barchart.component.html',
  styleUrls: ['./barchart.component.css']
})
export class BarchartComponent implements OnInit, OnChanges {
  @ViewChild('barChart')
  private chartContainer: ElementRef | null = null;
  private subscription: Subscription = new Subscription();

  artists: Artist[] = [];
  isLoading: boolean = true; // Add a loading indicator
  private svg: any;
  private contentWidth: number = 0;
  private contentHeight: number = 0;
  private margin = { top: 20, right: 30, bottom: 450, left: 150 }; // Adjust bottom margin for rotated labels

  constructor(private selectionService: SelectionService) { }

  ngOnInit(): void {
    this.subscription.add(
      this.selectionService.currentArtist.subscribe((artists: Artist[]) => {
        this.artists = artists;
        this.isLoading = false;
        this.createSvg();
        this.drawBars();
      })
    );
  }

  ngOnChanges(): void {
    this.createSvg();
    this.drawBars();
    this.isLoading = false;
  }

  ngOnDestroy(): void {
    // Unsubscribe from all subscriptions to avoid memory leaks
    this.subscription.unsubscribe();
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.createSvg();
    this.drawBars();
  }

  private createSvg(): void {
    d3.select("figure#bar svg").remove();

    const element = this.chartContainer?.nativeElement;
    this.svg = d3.select(element).append('svg')
      .attr('width', element.offsetWidth)
      .attr('height', element.offsetHeight);

    this.contentWidth = element.offsetWidth - this.margin.left - this.margin.right;
    this.contentHeight = element.offsetHeight - this.margin.top - this.margin.bottom;

    // Create a group element to apply margins and translate the drawing area
    this.svg = this.svg.append("g")
      .attr("transform", `translate(${this.margin.left},${this.margin.top})`);
  }

  private drawBars(): void {
    // Calculate technique distribution
    // Clear the previous content before drawing new bars
    const techniqueDistribution = this.calculateTechniqueDistribution(this.artists);

    // Create the X-axis band scale
    const x = d3.scaleBand()
      .domain(Array.from(techniqueDistribution.keys()))
      .range([0, this.contentWidth])
      .padding(0.2);

    // Draw the X-axis on the DOM
    this.svg.append("g")
      .attr("transform", "translate(0," + this.contentHeight + ")")
      .call(d3.axisBottom(x))
      .selectAll("text")
      .attr("transform", "translate(-10,0)rotate(-45)")
      .style("text-anchor", "end");

    // Filter out undefined values and convert to number array
    const techniqueValues = Array.from(techniqueDistribution.values())
      .filter(value => typeof value === 'number') as number[];

    // Create the Y-axis band scale
    const y = d3.scaleLinear()
      .domain([0, d3.max(techniqueValues) || 0]) // Handle the case when techniqueValues is empty
      .range([this.contentHeight, 0]);

    // Draw the Y-axis on the DOM
    this.svg.append("g")
      .call(d3.axisLeft(y));

    const colorScale = d3.scaleSequential()
      .domain([0, Array.from(techniqueDistribution.keys()).length - 1]) // Adjust for zero-based index
      .interpolator(d3.interpolateRdPu);

    // Create and fill the bars
    this.svg.selectAll("bars")
      .data(Array.from(techniqueDistribution.entries()))
      .enter()
      .append("rect")
      .attr("x", (d: any) => x(d[0]))
      .attr("y", (d: any) => y(d[1]))
      .attr("width", x.bandwidth())
      .attr("height", (d: any) => this.contentHeight - y(d[1]))
      .attr("fill", (d: any, i: number) => colorScale(i));
  }

  // Function to calculate technique distribution
  private calculateTechniqueDistribution(artists: Artist[]): Map<string, number> {
    const techniqueDistribution = new Map<string, number>();
    artists.forEach((artist) => {
      artist.techniques.forEach((technique) => {
        techniqueDistribution.set(technique, (techniqueDistribution.get(technique) || 0) + 1);
      });
    });
    return techniqueDistribution;
  }
}


/* const techniques = [
  "drawing",
  "drawing: chalk",
  "drawing: charcoal",
  "drawing: pen and ink",
  "painting",
  "painting: aquarelle",
  "painting: gouache",
  "painting: oil",
  "painting: tempera",
  "mural painting",
  "mural painting: fresco",
  "pastel",
  "mixed media",
  "monotype",
  "other medium",
]; */