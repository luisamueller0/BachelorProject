import { Component, OnInit, Input, ViewChild, ElementRef, OnChanges, OnDestroy, HostListener } from '@angular/core';
import * as d3 from 'd3';
import { Artist } from '../../models/artist';
import { SelectionService } from '../../services/selection.service';
import { Subscription } from 'rxjs';
import { ExhibitionService } from '../../services/exhibition.service';
import { Exhibition } from '../../models/exhibition';

interface YearData {
  date: Date;
  totalExhibitions: number;
  regions: {
    [key: string]: {
      selected: number;
      unselected: number;
    };
  };
}

@Component({
  selector: 'app-exhibitionAreachart',
  templateUrl: './exhibitionAreachart.component.html',
  styleUrls: ['./exhibitionAreachart.component.css']
})
export class ExhibitionAreachartComponent implements OnInit, OnChanges, OnDestroy {
  @ViewChild('exhibition', { static: true }) private exhibitionContainer!: ElementRef;
  @ViewChild('tooltip', { static: true }) private tooltip!: ElementRef;
  private subscriptions: Subscription = new Subscription();
  private legendOrder: string[] = ["North Europe", "Eastern Europe", "Southern Europe", "Western Europe", "Others", "\\N"];

  allExhibitions: Exhibition[] = [];
  exhibitions: Exhibition[] = [];
  nonSelectedExhibitions: Exhibition[] = [];
  selectedExhibitions: Exhibition[] = [];
  clusterExhibitions: Exhibition[] = [];
  selectedCluster: Artist[] | null = [];
  allArtists: Artist[] = [];
  selectedArtists: Artist[] | null = [];
  isLoading: boolean = true;
  private selectedRange: [Date, Date] | null = null;
  private svg: any;
  private contentWidth: number = 0;
  private contentHeight: number = 0;
  private regionKeys: string[] = ["North Europe", "Eastern Europe", "Southern Europe", "Western Europe", "Others", "\\N"];
  private exhibitionMap: Map<string, Exhibition> = new Map();

  private margin = {
    top: 1,
    right: 10,
    bottom: 2,
    left: 2
  };

  getArtistName(): string {
    if (this.selectedArtists && this.selectedArtists.length === 1) {
      return `${this.selectedArtists[0].firstname} ${this.selectedArtists[0].lastname}`;
    }
    return '';
  }
  

  constructor(private selectionService: SelectionService, private exhibitionService: ExhibitionService) { }

  ngOnInit(): void {
    this.exhibitionService.getAllExhibitions().subscribe((exhibitions) => {
      this.allExhibitions = exhibitions;
      const exhibitionMap = new Map<string, Exhibition>();
      this.allExhibitions.forEach(exhibition => exhibitionMap.set(exhibition.id.toString(), exhibition));
      this.exhibitionMap = exhibitionMap;
      this.tryInitialize();
    });

    this.subscriptions.add(
      this.selectionService.currentAllArtists.subscribe((artists: Artist[] | null) => {
        this.allArtists = artists || [];
        this.selectionService.selectExhibitions(null);
        this.tryInitialize();
      })
    );

    this.subscriptions.add(
      this.selectionService.currentArtists.subscribe((artists: Artist[] | null) => {
        this.selectedArtists = artists;
        this.tryInitialize();
      })
    );

    this.subscriptions.add(
      this.selectionService.currentFocusedCluster.subscribe((cluster: Artist[] | null) => {
        this.selectedCluster = cluster;
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
    if (!this.exhibitionContainer) return;
    this.tryInitialize();
  }

  private tryInitialize(): void {
    if (this.allArtists.length === 0 || this.allExhibitions.length === 0) {
      this.isLoading = true;
      return;
    } else {
      this.retrieveWantedExhibitions();
      this.createChart();
      this.isLoading = false;
    }
  }

  private retrieveWantedExhibitions(): void {
    this.exhibitions = [];
    this.selectedExhibitions = [];
    this.nonSelectedExhibitions = [];
    this.clusterExhibitions = [];

    const allExhibitionIds = new Set(
      this.allArtists.flatMap(artist => artist.participated_in_exhibition.map(id => id.toString()))
    );

    this.exhibitionMap.forEach((exhibition, id) => {
      if (allExhibitionIds.has(id)) {
        this.exhibitions.push(exhibition);
      }
    });

    if (this.selectedArtists && this.selectedArtists.length > 0) {
      const selectedExhibitionIds = new Set(
        this.selectedArtists.flatMap(artist => artist.participated_in_exhibition.map(id => id.toString()))
      );
      this.exhibitions.forEach(exhibition => {
        if (selectedExhibitionIds.has(exhibition.id.toString())) {
          this.selectedExhibitions.push(exhibition);
        }
      });
    } else {
      this.selectedExhibitions = this.exhibitions;
      this.nonSelectedExhibitions = [];
    }
  }

  private createChart(): void {
    this.createSvg();
    this.drawAreaChart();
  }

  private createSvg(): void {
    d3.select(this.exhibitionContainer.nativeElement).select("figure.exhibition-svg-container").select("svg").remove();

    const element = this.exhibitionContainer.nativeElement.querySelector('figure.exhibition-svg-container');
    const margin = {
      top: this.margin.top * window.innerHeight / 100,
      right: this.margin.right * window.innerWidth / 100,
      bottom: this.margin.bottom * window.innerWidth / 100,
      left: this.margin.left * window.innerWidth / 100
    };
    const width = element.offsetWidth - margin.left - margin.right;
    const height = element.offsetHeight - margin.top - margin.bottom;

    this.svg = d3.select(element).append('svg')
      .attr('width', element.offsetWidth)
      .attr('height', element.offsetHeight)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    this.contentWidth = width;
    this.contentHeight = height;
  }

  private drawAreaChart(): void {
    const yearData = this.getYearlyExhibitionData(this.selectedExhibitions, this.nonSelectedExhibitions);
  
    const xScale = d3.scaleTime()
      .domain(d3.extent(yearData, d => d.date) as [Date, Date])
      .range([0, this.contentWidth]);
  
    const yScale = d3.scaleLinear()
      .domain([0, d3.max(yearData, d => d.totalExhibitions)!])
      .nice()
      .range([this.contentHeight, 0]);
  
    const colorMap: { [key: string]: string } = {
      "North Europe": "#67D0C0",
      "Eastern Europe": "#59A3EE",
      "Southern Europe": "#AF73E8",
      "Western Europe": "#F06ACD",
      "Others": "#FFDA75",
      "\\N": "#c9ada7"
    };
  
    const transformedData: any[] = yearData.map(d => {
      const data: any = { date: d.date };
      this.regionKeys.forEach(region => {
        data[`${region}-selected`] = d.regions[region].selected;
        data[`${region}-unselected`] = d.regions[region].unselected;
      });
      return data;
    });
  
    // Order regions by the total sum of exhibitions for each region
    const orderedRegionKeys = this.regionKeys.sort((a, b) => {
      const sumA = d3.sum(transformedData, d => d[`${a}-selected`] + d[`${a}-unselected`]);
      const sumB = d3.sum(transformedData, d => d[`${b}-selected`] + d[`${b}-unselected`]);
      return sumA - sumB; // Smallest to largest
    });
  
    const stack = d3.stack()
      .keys(orderedRegionKeys.flatMap(region => [`${region}-selected`, `${region}-unselected`]));
  
    const area = d3.area()
      .x((d: any) => xScale(d.data.date)!)
      .y0((d: any) => yScale(d[0]))
      .y1((d: any) => yScale(d[1]))
      .curve(d3.curveMonotoneX);  // Smooth area transitions
  
    const stackedData = stack(transformedData);
  
    const paths = this.svg.append('g')
      .selectAll('path')
      .data(stackedData)
      .enter().append('path')
      .attr('d', area)
      .attr('fill', (d: any) => {
        const region = d.key.split('-')[0];
        return colorMap[region];
      })
      .attr('opacity', 0.8)  // Apply transparency for overlapping areas
      .attr('class', (d: any) => `region-${d.key.split('-')[0].replace(/ /g, '-')}`)  // Add a class to identify each region
      .on('mouseover', (event: any, d: any) => {
        // Fade out other regions
        paths.attr('opacity', 0.1);
        // Highlight the hovered region
        d3.select(event.currentTarget).attr('opacity', 1);
      })
      .on('mouseout', () => {
        // Restore opacity of all regions
        paths.attr('opacity', 0.8);
      });
  
    // Add x-axis with more ticks
    this.svg.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0, ${this.contentHeight})`)
      .call(d3.axisBottom(xScale).ticks(d3.timeYear.every(1)));
  
    // Add y-axis with 5 ticks
    this.svg.append('g')
      .attr('class', 'y-axis')
      .call(d3.axisLeft(yScale).ticks(5));
  
    // Brush setup for time range selection
    const brush = d3.brushX()
      .extent([[0, 0], [this.contentWidth, this.contentHeight]])
      .on('brush end', (event) => {
        const selection = event.selection;
        if (selection) {
          const [startX, endX] = selection;
          const startDate = xScale.invert(startX);
          const endDate = xScale.invert(endX);
  
          if (this.isSingleYear(startDate, endDate)) {
            this.handleDateRangeSelection([startDate, endDate]);
          }
        }
      });
  
    this.svg.append('g')
      .attr('class', 'brush')
      .call(brush);
  
    // Legend creation with hover functionality
    const legend = this.svg.append('g')
      .attr('class', 'legend')
      .attr('transform', `translate(${this.contentWidth + 20}, 20)`);
  
    const size = 0.9 * window.innerWidth / 100;
    const fontSize = 0.7 * window.innerWidth / 100;
  
    // Adding rectangles for each region in the legend
    legend.selectAll('rect')
      .data(this.legendOrder)
      .enter().append('rect')
      .attr('x', 0)
      .attr('y', (d: any, i: number) => i * (size + 4))  // Added spacing between rectangles
      .attr('width', size)
      .attr('height', size)
      .attr('fill', (d: any) => colorMap[d as keyof typeof colorMap])
      .on('mouseover', (event: any, d: string) => {
        const selectedRegionClass = `.region-${d.replace(/ /g, '-')}`;
        // Fade out all areas
        paths.attr('opacity', 0.1);
        // Highlight the corresponding region in the area chart
        this.svg.selectAll(selectedRegionClass).attr('opacity', 1);
      })
      .on('mouseout', () => {
        // Restore opacity for all regions
        paths.attr('opacity', 0.8);
      });
  
    // Adding labels for each region in the legend
    legend.selectAll('text')
      .data(this.legendOrder)
      .enter().append('text')
      .attr('x', size + 4)  // Adjusted position based on rectangle size
      .attr('y', (d: any, i: number) => i * (size + 4) + size / 2)
      .attr('dy', '.35em')
      .style('font-size', `${fontSize}px`)
      .text((d: any) => d)
      .on('mouseover', (event: any, d: string) => {
        const selectedRegionClass = `.region-${d.replace(/ /g, '-')}`;
        // Fade out all areas
        paths.attr('opacity', 0.1);
        // Highlight the corresponding region in the area chart
        this.svg.selectAll(selectedRegionClass).attr('opacity', 1);
      })
      .on('mouseout', () => {
        // Restore opacity for all regions
        paths.attr('opacity', 0.8);
      });
  }
  
  
  
  private isSingleYear(startDate: Date, endDate: Date): boolean {
    return startDate.getFullYear() === endDate.getFullYear();
  }

  private handleDateRangeSelection(range: [Date, Date]): void {
    const [startDate, endDate] = range;
    this.selectedRange = range;
    
    // Filter exhibitions within this range
    const exhibitionsInRange = this.selectedExhibitions.filter(exhibition => {
      const startYear = new Date(exhibition.start_date);
      const endYear = new Date(exhibition.end_date);
      return (startYear >= startDate && endYear <= endDate);
    });

    this.selectionService.selectExhibitions([exhibitionsInRange, []]);
    this.selectionService.selectYear(startDate.getFullYear()); // optional to indicate year
  }

  private getYearlyExhibitionData(selectedExhibitions: Exhibition[], unselectedExhibitions: Exhibition[]): YearData[] {
    const yearData: { [date: string]: { [region: string]: { selected: number; unselected: number } } } = {};

    const processExhibitions = (exhibitions: Exhibition[], isSelected: boolean) => {
      exhibitions.forEach(exhibition => {
        const startDate = new Date(exhibition.start_date);
        const endDate = new Date(exhibition.end_date);
        const region = exhibition.europeanRegion || "Others";

        for (let date = startDate; date <= endDate; date.setMonth(date.getMonth() + 1)) {
          const key = date.toISOString().slice(0, 7); // Year-month format
          if (!yearData[key]) {
            yearData[key] = { "North Europe": { selected: 0, unselected: 0 }, "Eastern Europe": { selected: 0, unselected: 0 }, "Southern Europe": { selected: 0, unselected: 0 }, "Western Europe": { selected: 0, unselected: 0 }, "Others": { selected: 0, unselected: 0 }, "\\N": { selected: 0, unselected: 0 } };
          }
          if (isSelected) {
            yearData[key][region].selected++;
          } else {
            yearData[key][region].unselected++;
          }
        }
      });
    };

    processExhibitions(selectedExhibitions, true);
    processExhibitions(unselectedExhibitions, false);

    return Object.keys(yearData).map(key => {
      const [year, month] = key.split("-");
      const date = new Date(parseInt(year), parseInt(month) - 1);
      const regions = yearData[key];
      return {
        date,
        totalExhibitions: Object.values(regions).reduce((sum, value) => sum + value.selected + value.unselected, 0),
        regions
      };
    }).sort((a, b) => a.date.getTime() - b.date.getTime());
  }
}
