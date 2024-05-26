import { Component, OnInit, Input, ViewChild, ElementRef, OnChanges, OnDestroy, HostListener } from '@angular/core';
import * as d3 from 'd3';
import { Artist } from '../../models/artist';
import { SelectionService } from '../../services/selection.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-barchart',
  templateUrl: './barchart.component.html',
  styleUrls: ['./barchart.component.css']
})
export class BarchartComponent implements OnInit, OnChanges, OnDestroy {
  @ViewChild('barChart', { static: true }) private chartContainer!: ElementRef;
  private subscription: Subscription = new Subscription();

  artists: Artist[] = [];
  isLoading: boolean = true;
  private svg: any;
  private contentWidth: number = 0;
  private contentHeight: number = 0;
  private margin = { top: 20, right: 30, bottom: 100, left: 150 };

  constructor(private selectionService: SelectionService) { }

  ngOnInit(): void {
    this.subscription.add(
      this.selectionService.currentArtist.subscribe((artists: Artist[]) => {
        this.artists = artists;
        this.isLoading = false;
        this.updateChart();
      })
    );
    window.addEventListener('resize', this.onResize.bind(this));
  }

  ngOnChanges(): void {
    this.updateChart();
    this.isLoading = false;
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
    window.removeEventListener('resize', this.onResize.bind(this));
  }

  @HostListener('window:resize', ['$event'])
  onResize(): void {
    this.updateChart();
  }

  private updateChart(): void {
    if (!this.chartContainer) return;

    this.createSvg();
    this.drawBars();
  }

  private createSvg(): void {
    d3.select(this.chartContainer.nativeElement).select("svg").remove();

    const element = this.chartContainer.nativeElement;
    const width = element.offsetWidth - this.margin.left - this.margin.right;
    const height = element.offsetHeight - this.margin.top - this.margin.bottom;

    this.svg = d3.select(element).append('svg')
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('viewBox', `0 0 ${element.offsetWidth} ${element.offsetHeight}`)
      .append("g")
      .attr("transform", `translate(${this.margin.left},${this.margin.top})`);

    this.contentWidth = width;
    this.contentHeight = height;
  }

  private drawBars(): void {
    if (!this.artists.length) return;

    const techniqueDistribution = this.calculateTechniqueDistribution(this.artists);

    const x = d3.scaleBand()
      .domain(Array.from(techniqueDistribution.keys()))
      .range([0, this.contentWidth])
      .padding(0.2);

    this.svg.append("g")
      .attr("transform", `translate(0,${this.contentHeight})`)
      .call(d3.axisBottom(x))
      .selectAll("text")
      .attr("transform", "translate(-10,0)rotate(-45)")
      .style("text-anchor", "end");

    const techniqueValues = Array.from(techniqueDistribution.values())
      .filter(value => typeof value === 'number') as number[];

    const y = d3.scaleLinear()
      .domain([0, d3.max(techniqueValues) || 0])
      .range([this.contentHeight, 0]);

    this.svg.append("g")
      .call(d3.axisLeft(y));

    const colorScale = d3.scaleSequential()
      .domain([0, Array.from(techniqueDistribution.keys()).length - 1])
      .interpolator(d3.interpolateRdPu);

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