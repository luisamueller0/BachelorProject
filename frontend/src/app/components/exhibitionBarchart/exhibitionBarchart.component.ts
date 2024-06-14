import { Component, OnInit, Input, ViewChild, ElementRef, OnChanges, OnDestroy, HostListener } from '@angular/core';
import * as d3 from 'd3';
import { Artist } from '../../models/artist';
import { SelectionService } from '../../services/selection.service';
import { Subscription } from 'rxjs';
import { ExhibitionService } from '../../services/exhibition.service';
import { Exhibition } from '../../models/exhibition';

interface YearData {
  year: number;
  totalExhibitions: number;
  regions: {
    [key: string]: {
      selected: number;
      unselected: number;
    };
  };
}

@Component({
  selector: 'app-exhibitionBarchart',
  templateUrl: './exhibitionBarchart.component.html',
  styleUrls: ['./exhibitionBarchart.component.css']
})
export class ExhibitionBarchartComponent implements OnInit, OnChanges, OnDestroy {
  @ViewChild('exhibition', { static: true }) private exhibitionContainer!: ElementRef;
  @ViewChild('tooltip', { static: true }) private tooltip!: ElementRef;
  private subscriptions: Subscription = new Subscription();
  private legendOrder: string[] = ["North Europe", "Eastern Europe", "Southern Europe", "Western Europe", "Others", "\\N"];

  allExhibitions: Exhibition[] = [];
  exhibitions: Exhibition[] = [];
  nonSelectedExhibitions: Exhibition[] = [];
  selectedExhibitions: Exhibition[] = [];
  clusterExhibitions: Exhibition[] = [];
  allArtists: Artist[] = [];
  selectedArtists: Artist[] | null = [];
  isLoading: boolean = true;
  private svg: any;
  private contentWidth: number = 0;
  private contentHeight: number = 0;
  private regionKeys: string[] = ["North Europe", "Eastern Europe", "Southern Europe", "Western Europe", "Others", "\\N"];
  private exhibitionMap: Map<string, Exhibition> = new Map();

  private margin = {
    top: 1,
    right: 10,
    bottom: 3,
    left: 2
  };

  constructor(private selectionService: SelectionService,
              private exhibitionService: ExhibitionService) { }

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
        this.selectionService.selectExhibitions(null);
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

    if (this.selectedArtists !== null && this.selectedArtists.length > 0) {
      const selectedExhibitionIds = new Set(
        this.selectedArtists.flatMap(artist => artist.participated_in_exhibition.map(id => id.toString()))
      );
      //if only one artist, in ganttchart want to display whole cluster
      const artists = this.selectedArtists;
      if (artists.length === 1 && artists[0] !== null) {
        // Find all artists in the same cluster
        const clusterArtists = this.allArtists.filter(artist => artist.cluster === artists[0].cluster && artist.id !== artists[0].id);
  
        // Collect all exhibitions of the artists in the same cluster
        const clusterExhibitionIds = new Set(
          clusterArtists.flatMap(artist => artist.participated_in_exhibition.map(id => id.toString()))
        );
        this.exhibitionMap.forEach((exhibition, id) => {
          if (clusterExhibitionIds.has(id)) {
            this.clusterExhibitions.push(exhibition);
          }
        });
    
      }
      

      this.exhibitions.forEach(exhibition => {
        if (selectedExhibitionIds.has(exhibition.id.toString())) {
          this.selectedExhibitions.push(exhibition);
        } else {
          this.nonSelectedExhibitions.push(exhibition);
        }
      });
    } else {
      this.selectedExhibitions = this.exhibitions;
      this.nonSelectedExhibitions = [];
    }
  }

  private createChart(): void {
    this.createSvg();
    this.drawBinnedChart();
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

  private drawBinnedChart(): void {
    const yearData = this.getYearlyExhibitionData(this.selectedExhibitions, this.nonSelectedExhibitions);
  
    const xScale = d3.scaleBand()
      .domain(yearData.map(d => d.year.toString()))
      .range([0, this.contentWidth])
      .padding(0.1);
  
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
      "\\N": "#C3C3C3"
    };
  
    const selectedColorMap: { [key: string]: string } = {
      "North Europe": "#A9E5DC",
      "Eastern Europe": "#A1C9F6",
      "Southern Europe": "#D1B3F1",
      "Western Europe": "#F4A5E1",
      "Others": "#FFEBA6",
      "\\N": "#E1E1E1"
    };
  
    const transformedData: any[] = yearData.map(d => {
      const data: any = { year: d.year };
      this.regionKeys.forEach(region => {
        data[`${region}-selected`] = d.regions[region].selected;
        data[`${region}-unselected`] = d.regions[region].unselected;
      });
      return data;
    });
  
    const regionTotals: { [key: string]: number } = {};
    this.regionKeys.forEach(region => {
      regionTotals[region] = d3.sum(transformedData, d => d[`${region}-selected`] + d[`${region}-unselected`]);
    });
  
    const sortedRegions = this.regionKeys.sort((a, b) => regionTotals[b] - regionTotals[a]);
    const sortedKeys = sortedRegions.flatMap(region => [`${region}-selected`, `${region}-unselected`]);
  
    const stack = d3.stack()
      .keys(sortedKeys);
  
    const stackedData = stack(transformedData);

    const tooltip = d3.select("div#tooltip")
  
    const handleMouseOver = (event: any, d: any) =>{
    tooltip.style('display', 'block');
  }

  const handleMouseMove =(event: any, d: any) =>{
    const year = d.data.year;
    const regions = this.regionKeys.map(region => {
      return {
        region,
        selected: d.data[`${region}-selected`],
        unselected: d.data[`${region}-unselected`]
      };
    });
    if(this.selectedArtists === null || this.selectedArtists.length === 0){
    tooltip.style("display", "block")
        .style("left", `${event.pageX +5}px`)
        .style("top", `${event.pageY + 5}px`)
        .style("font-color", "black")
        .html(`${regions.map(region => `${region.region}: ${region.selected}`).join('<br/>')} `);
  }else{
    tooltip.style("display", "block")
    .style("left", `${event.pageX + 5}px`)
    .style("top", `${event.pageY + 5}px`)
    .style("font-color", "black")
    .html(`Year: ${year}<br/>${regions.map(region => `${region.region}: ${region.selected} out of ${region.unselected}`).join('<br/>')} `);

  }
  }
  const handleMouseOut =(event: any, d: any) =>{
    tooltip.style('display', 'none');
  }

  const handleClick = (event: any, d: any) => {
    const year = d.data.year;
  
    let exhibitionsByYear: Exhibition[][] = [];
  
    if (this.selectedArtists && this.selectedArtists.length === 1) {
      // If only one artist is selected, include cluster exhibitions
      const selectedExhibitionsByYear = this.selectedExhibitions.filter(exhibition => {
        const startYear = new Date(exhibition.start_date).getFullYear();
        const endYear = new Date(exhibition.end_date).getFullYear();
        return year >= startYear && year <= endYear;
      });
      const clusterExhibitionsByYear = this.clusterExhibitions.filter(exhibition => {
        const startYear = new Date(exhibition.start_date).getFullYear();
        const endYear = new Date(exhibition.end_date).getFullYear();
        return year >= startYear && year <= endYear;
      });
   
      exhibitionsByYear = [selectedExhibitionsByYear, clusterExhibitionsByYear];
    } else {
      // If multiple artists are selected, only include selected exhibitions
      const exhibitions = this.selectedExhibitions.filter(exhibition => {
        const startYear = new Date(exhibition.start_date).getFullYear();
        const endYear = new Date(exhibition.end_date).getFullYear();
        return year >= startYear && year <= endYear;
      });
      exhibitionsByYear = [exhibitions,[]];
    }
  
    this.selectionService.selectExhibitions(exhibitionsByYear);
  };
  
  
  
    this.svg.append('g')
      .selectAll('g')
      .data(stackedData)
      .enter().append('g')
      .attr('fill', (d: any) => {
        const region = d.key.split('-')[0];
        return colorMap[region];
      })
      .attr('opacity', (d: any) => {
        const region = d.key.split('-')[0];
        const bool = d.key.split('-')[1];
        return (bool === 'unselected') ? 0.3 : 1;
      })
      .selectAll('rect')
      .data((d: any) => d)
      .enter().append('rect')
      .attr('x', (d: any) => xScale(d.data.year.toString())!)
      .attr('y', (d: any) => yScale(d[1]))
      .attr('height', (d: any) => yScale(d[0]) - yScale(d[1]))
      .attr('width', xScale.bandwidth())
      .on('mouseover', handleMouseOver)
      .on('mousemove', handleMouseMove)
      .on('mouseout',handleMouseOut)
      .on('click', handleClick);

  
    // Append x-axis with custom label colors
    this.svg.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${this.contentHeight})`)
      .call(d3.axisBottom(xScale))
      .selectAll('text')
      .style('fill', (d: string) => this.hasExhibitionValue(+d) ? 'black' : 'gray')
      .style('font-weight', (d: string) => this.hasExhibitionValue(+d) ? 'bold' : 'normal');
  
    this.svg.append('g')
      .attr('class', 'y-axis')
      .call(d3.axisLeft(yScale).ticks(10));
  
    const legend = this.svg.append('g')
      .attr('class', 'legend')
      .attr('transform', `translate(${this.contentWidth + 20}, 20)`);
  
    legend.selectAll('rect')
      .data(this.legendOrder)
      .enter().append('rect')
      .attr('x', 0)
      .attr('y', (d: any, i: number) => i * 20)
      .attr('width', 18)
      .attr('height', 18)
      .attr('fill', (d: any) => colorMap[d as keyof typeof colorMap]);
  
    legend.selectAll('text')
      .data(this.legendOrder)
      .enter().append('text')
      .attr('x', 24)
      .attr('y', (d: any, i: number) => i * 20 + 9)
      .attr('dy', '.35em')
      .text((d: any) => d);
  }
  
  private hasExhibitionValue(year: number): boolean {
    return this.exhibitions.some(exhibition => {
      const startYear = new Date(exhibition.start_date).getFullYear();
      const endYear = new Date(exhibition.end_date).getFullYear();
      return year >= startYear && year <= endYear;
    });
  }
  
  private filterExhibitionsByYear(year: number): Exhibition[] {
    return this.exhibitions.filter(exhibition => {
      const startYear = new Date(exhibition.start_date).getFullYear();
      const endYear = new Date(exhibition.end_date).getFullYear();
      return year >= startYear && year <= endYear;
    });
  }
  

  private getYearlyExhibitionData(selectedExhibitions: Exhibition[], unselectedExhibitions: Exhibition[]): YearData[] {
    const yearData: { [year: number]: { [region: string]: { selected: number; unselected: number } } } = {};

    const processExhibitions = (exhibitions: Exhibition[], isSelected: boolean) => {
      exhibitions.forEach(exhibition => {
        
        const startYear = new Date(exhibition.start_date).getFullYear();
        const endYear = new Date(exhibition.end_date).getFullYear();
        const region = exhibition.europeanRegion || "Others"; // Default to "Others" if undefined

        for (let year = startYear; year <= endYear; year++) {
          if (!yearData[year]) {
            yearData[year] = { "North Europe": { selected: 0, unselected: 0 }, "Eastern Europe": { selected: 0, unselected: 0 }, "Southern Europe": { selected: 0, unselected: 0 }, "Western Europe": { selected: 0, unselected: 0 }, "Others": { selected: 0, unselected: 0 }, "\\N": { selected: 0, unselected: 0 } };
          }
          if (isSelected) {
            yearData[year][region].selected++;
          } else {
            yearData[year][region].unselected++;
          }
        }
      });
    };

    processExhibitions(selectedExhibitions, true);
    processExhibitions(unselectedExhibitions, false);

    return Object.keys(yearData).map(year => {
      const regions = yearData[parseInt(year)];
      return {
        year: parseInt(year),
        totalExhibitions: Object.values(regions).reduce((sum, value) => sum + value.selected + value.unselected, 0),
        regions
      };
    }).sort((a, b) => a.year - b.year);
  }
}
