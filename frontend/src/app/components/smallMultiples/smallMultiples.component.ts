import { Component, OnInit, ViewChild, ElementRef, OnChanges, OnDestroy, HostListener } from '@angular/core';
import * as d3 from 'd3';
import { Subscription } from 'rxjs';
import { SelectionService } from '../../services/selection.service';
import { DecisionService } from '../../services/decision.service';
import { ArtistService } from '../../services/artist.service';

@Component({
  selector: 'app-smallMultiples',
  templateUrl: './smallMultiples.component.html',
  styleUrls: ['./smallMultiples.component.css']
})
export class SmallMultiplesComponent implements OnInit, OnChanges, OnDestroy {
  @ViewChild('matrix', { static: true }) private chartContainer!: ElementRef;
  private subscriptions: Subscription = new Subscription();

  isLoading: boolean = true;
  private svg: any;
  private contentWidth: number = 0;
  private contentHeight: number = 0;

  private margin = {
    top: 2,
    right: 2,
    bottom: 5,
    left: 4
  };

  constructor(private selectionService: SelectionService,
    private decisionService: DecisionService,
    private artistService: ArtistService
  ) { }

  ngOnInit(): void {
    this.tryInitialize();
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
    if (!this.chartContainer) return;
    this.tryInitialize();
  }

  private tryInitialize(): void {
    this.createChart();
  }

  private createChart(): void {
    this.createSvg();
    this.drawMatrix();
    this.isLoading = false;
  }

  private createSvg(): void {
    // Remove any existing SVG elements
    d3.select(this.chartContainer.nativeElement).select("figure.matrix-svg-container").select("svg").remove();
  
    const element = this.chartContainer.nativeElement.querySelector('figure.matrix-svg-container');
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
  
  private drawMatrix(): void {
    const xData = d3.range(1, 8); // Numbers 1 to 7
    const yData = ['A', 'B', 'C', 'D']; // Letters A to D

    const xScale = d3.scaleBand()
      .domain(xData.map(String))
      .range([0, this.contentWidth])
      .padding(0.1);

    const yScale = d3.scaleBand()
      .domain(yData)
      .range([0, this.contentHeight])
      .padding(0.1);

    // Draw x-axis
    this.svg.append("g")
      .attr("transform", `translate(0,${this.contentHeight})`)
      .call(d3.axisBottom(xScale));

    // Draw y-axis
    this.svg.append("g")
      .call(d3.axisLeft(yScale));

    // Draw cells
    this.svg.selectAll("rect")
      .data(yData.flatMap(y => xData.map(x => ({ x, y }))))
      .enter()
      .append("rect")
      .attr("x", (d:any) => xScale(String(d.x))!)
      .attr("y", (d:any) => yScale(d.y)!)
      .attr("width", xScale.bandwidth())
      .attr("height", yScale.bandwidth())
      .attr("fill", "white")
      .attr("stroke", "black");
  }
}
