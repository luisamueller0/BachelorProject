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
  selectedCluster: Artist[] |null = [];
  allArtists: Artist[] = [];
  selectedArtists: Artist[] | null = [];
  isLoading: boolean = true;
  private selectedYear:number|null = null;
  private svg: any;
  private contentWidth: number = 0;
  private contentHeight: number = 0;
  private regionKeys: string[] = ["North Europe", "Eastern Europe", "Southern Europe", "Western Europe", "Others", "\\N"];
  private exhibitionMap: Map<string, Exhibition> = new Map();
  private previouslySelectedYear: number | null = null;


  

  private margin = {
    top: 1,
    right: 10,
    bottom: 2,
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
      this.clickOnSelectedYear();
      this.isLoading = false;
    }
  }
  private clickOnSelectedYear(): void {
    if (this.previouslySelectedYear !== null) {
      this.handleYearSelectionWithoutClick(this.previouslySelectedYear);
    }
  }

  private handleYearSelectionWithoutClick(year: number): void {
  
      let exhibitionsByYear: Exhibition[][] = [];
      this.updateBarOpacity(year);
      if (this.selectedArtists && this.selectedArtists.length === 1) {
       
        // If only one artist is selected, include cluster exhibitions
        const selectedExhibitionsByYear = this.selectedExhibitions.filter(exhibition => {
          const startYear = new Date(exhibition.start_date).getFullYear();
          const endYear = new Date(exhibition.end_date).getFullYear();
          return year >= startYear && year <= endYear;
        });
  
        const selectedExhibitionIds = new Set(selectedExhibitionsByYear.map(exhibition => exhibition.id));
  
        const clusterExhibitionsByYear = this.clusterExhibitions.filter(exhibition => {
          const startYear = new Date(exhibition.start_date).getFullYear();
          const endYear = new Date(exhibition.end_date).getFullYear();
          return year >= startYear && year <= endYear && !selectedExhibitionIds.has(exhibition.id);
        });
  
        exhibitionsByYear = [selectedExhibitionsByYear, clusterExhibitionsByYear];
      } else {
        // If multiple artists are selected, only include selected exhibitions
        const exhibitions = this.selectedExhibitions.filter(exhibition => {
          const startYear = new Date(exhibition.start_date).getFullYear();
          const endYear = new Date(exhibition.end_date).getFullYear();
          return year >= startYear && year <= endYear;
        });
        exhibitionsByYear = [exhibitions, []];
      }
  
      this.selectionService.selectExhibitions(exhibitionsByYear);
    
  }
  
/*   private clickOnSelectedYear(): void {
    if (this.previouslySelectedYear !== null) {
      const bar = this.svg.selectAll('rect')
        .filter((d: any) =>{ if(d.data){//console.log(d.data.year,  typeof d.data.year)
          //console.log(this.previouslySelectedYear, typeof this.previouslySelectedYear)
        d.data.year === this.previouslySelectedYear}})
        .node();
  
      if (bar) {
        bar.dispatchEvent(new MouseEvent('click'));
      }
    }
  } */

    private resetBarOpacity(): void {
      this.svg.selectAll('rect')
        .attr('opacity', 1); // Reset all bars to full opacity
    }
    
    private updateBarOpacity(selectedYear: number): void {
      this.svg.selectAll('rect')
        .attr('opacity', (d: any) => {
          if(d.data === undefined) return 1;
          const year = d.data.year;
          return (year === selectedYear) ? 1 : 0.2; // Highlight selected year and dim others
        });
    }

    private handleYearSelection(year: number): void {
    
      if (this.previouslySelectedYear === year) {
        // Deselect the year if it's the same as the previously selected year
        this.previouslySelectedYear = null;
        this.selectedYear = null;
        this.selectionService.selectYear(null);
        this.selectionService.selectExhibitions([[], []]);
        this.resetBarOpacity();
      } else {
        this.previouslySelectedYear = year;
        this.selectedYear = year;
        this.updateBarOpacity(year);
    
        let exhibitionsByYear: Exhibition[][] = [];
    
        if (this.selectedArtists && this.selectedArtists.length === 1) {
          // If only one artist is selected, include cluster exhibitions
          const selectedExhibitionsByYear = this.selectedExhibitions.filter(exhibition => {
            const startYear = new Date(exhibition.start_date).getFullYear();
            const endYear = new Date(exhibition.end_date).getFullYear();
            return year >= startYear && year <= endYear;
          });
    
          const selectedExhibitionIds = new Set(selectedExhibitionsByYear.map(exhibition => exhibition.id));
    
          const clusterExhibitionsByYear = this.clusterExhibitions.filter(exhibition => {
            const startYear = new Date(exhibition.start_date).getFullYear();
            const endYear = new Date(exhibition.end_date).getFullYear();
            return year >= startYear && year <= endYear && !selectedExhibitionIds.has(exhibition.id);
          });
    
          exhibitionsByYear = [selectedExhibitionsByYear, clusterExhibitionsByYear];
        } else {
          // If multiple artists are selected, only include selected exhibitions
          const exhibitions = this.selectedExhibitions.filter(exhibition => {
            const startYear = new Date(exhibition.start_date).getFullYear();
            const endYear = new Date(exhibition.end_date).getFullYear();
            return year >= startYear && year <= endYear;
          });
          exhibitionsByYear = [exhibitions, []];
        }
    
        this.selectionService.selectYear(year);
        this.selectionService.selectExhibitions(exhibitionsByYear);
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
      if(this.selectedArtists.length ===1){
        if(this.selectedCluster){
          const clusterArtists = this.selectedCluster;
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
      this.clusterExhibitions.forEach(exhibition => {
        if (selectedExhibitionIds.has(exhibition.id.toString())) {
          this.selectedExhibitions.push(exhibition);
        } else {
          this.nonSelectedExhibitions.push(exhibition);
        }
      });
      
    } else{
      this.exhibitions.forEach(exhibition => {
        if (selectedExhibitionIds.has(exhibition.id.toString())) {
          this.selectedExhibitions.push(exhibition);
        } 
      });
      this.nonSelectedExhibitions = [];

      
    }
  }
      else {
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
  const monthData = this.getMonthlyExhibitionData(this.selectedExhibitions, this.nonSelectedExhibitions);

  // Create xScale based on unique years
  const years = Array.from(new Set(monthData.map(d => d.year.toString())));
  const xScale = d3.scaleBand()
    .domain(years)
    .range([0, this.contentWidth])
    .padding(0.1);

  const yScale = d3.scaleLinear()
    .domain([0, d3.max(monthData, d => d.totalExhibitions)!])
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

  // Create stack layout
  const stack = d3.stack()
    .keys(this.regionKeys.flatMap(region => [`${region}-selected`, `${region}-unselected`]));

  const stackedData = stack(monthData.map(d => {
    const data: any = { year: d.year, month: d.month };
    this.regionKeys.forEach(region => {
      data[`${region}-selected`] = d.regions[region].selected;
      data[`${region}-unselected`] = d.regions[region].unselected;
    });
    return data;
  }));

  // Group the data by year to draw multiple bars for each month under the same year
  this.svg.append('g')
    .selectAll('g')
    .data(stackedData)
    .enter().append('g')
    .attr('fill', (d: any) => {
      const region = d.key.split('-')[0];
      return colorMap[region];
    })
    .attr('stroke', (d: any) => d3.color(colorMap[d.key.split('-')[0]])?.darker(1))
    .attr('stroke-width', 0.8)
    .attr('opacity', (d: any) => d.key.includes('unselected') ? 0.2 : 1)
    .selectAll('rect')
    .data((d: any) => d)
    .enter().append('rect')
    .attr('x', (d: any) => xScale(d.data.year.toString())! + (d.data.month - 1) * (xScale.bandwidth() / 12))
    .attr('y', (d: any) => yScale(d[1]))
    .attr('height', (d: any) => yScale(d[0]) - yScale(d[1]))
    .attr('width', xScale.bandwidth() / 12) // Divide bandwidth by 12 to represent each month
    .on('click', (event: any, d: any) => this.handleYearSelection(d.data.year));

  // Append x-axis with years
  this.svg.append('g')
    .attr('class', 'x-axis')
    .attr('transform', `translate(0,${this.contentHeight})`)
    .call(d3.axisBottom(xScale));

  // Append y-axis
  this.svg.append('g')
    .attr('class', 'y-axis')
    .call(d3.axisLeft(yScale));

  // Add legend logic as before
  
  const legend = this.svg.append('g')
  .attr('class', 'legend')
  .attr('transform', `translate(${this.contentWidth + 20}, 20)`);


  const size = 0.9 * window.innerWidth / 100;
  const fontSize = 0.7 * window.innerWidth / 100;  // Adjust this multiplier as needed for desired text size
  
  legend.selectAll('rect')
    .data(this.legendOrder)
    .enter().append('rect')
    .attr('x', 0)
    .attr('y', (d: any, i: number) => i * (size + 4))  // Added spacing between rectangles
    .attr('width', size)
    .attr('height', size)
    .attr('fill', (d: any) => colorMap[d as keyof typeof colorMap])
  
  legend.selectAll('text')
    .data(this.legendOrder)
    .enter().append('text')
    .attr('x', size + 4)  // Adjusted position based on rectangle size
    .attr('y', (d: any, i: number) => i * (size + 4) + size / 2)
    .attr('dy', '.35em')
    .style('font-size', `${fontSize}px`)
    .text((d: any) => d);
  
}

  
  private hasExhibitionValue(year: number): boolean {
    
    return this.selectedExhibitions.some(exhibition => {
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


  

  

  private getMonthlyExhibitionData(selectedExhibitions: Exhibition[], unselectedExhibitions: Exhibition[]): any[] {
    const monthData: { [month: string]: { [region: string]: { selected: number; unselected: number } } } = {};
  
    const processExhibitions = (exhibitions: Exhibition[], isSelected: boolean) => {
      exhibitions.forEach(exhibition => {
        const startDate = new Date(exhibition.start_date);
        const endDate = new Date(exhibition.end_date);
        const region = exhibition.europeanRegion || "Others"; // Default to "Others" if undefined
  
        // Loop through each month between the start and end dates
        const startMonth = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
        const endMonth = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
  
        for (let d = startMonth; d <= endMonth; d.setMonth(d.getMonth() + 1)) {
          const monthKey = `${d.getFullYear()}-${d.getMonth() + 1}`; // E.g., "2023-5" for May 2023
  
          if (!monthData[monthKey]) {
            monthData[monthKey] = {
              "North Europe": { selected: 0, unselected: 0 },
              "Eastern Europe": { selected: 0, unselected: 0 },
              "Southern Europe": { selected: 0, unselected: 0 },
              "Western Europe": { selected: 0, unselected: 0 },
              "Others": { selected: 0, unselected: 0 },
              "\\N": { selected: 0, unselected: 0 }
            };
          }
  
          if (isSelected) {
            monthData[monthKey][region].selected++;
          } else {
            monthData[monthKey][region].unselected++;
          }
        }
      });
    };
  
    processExhibitions(selectedExhibitions, true);
    processExhibitions(unselectedExhibitions, false);
  
    return Object.keys(monthData).map(monthKey => {
      const regions = monthData[monthKey];
      const [year, month] = monthKey.split('-').map(Number);
      return {
        year: year,
        month: month,
        totalExhibitions: Object.values(regions).reduce((sum, value) => sum + value.selected + value.unselected, 0),
        regions
      };
    }).sort((a, b) => a.year === b.year ? a.month - b.month : a.year - b.year);
  }
  
}
