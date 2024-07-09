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
        .filter((d: any) =>{ if(d.data){console.log(d.data.year,  typeof d.data.year)
          console.log(this.previouslySelectedYear, typeof this.previouslySelectedYear)
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
          if(d.data === undefined) return 0.2;
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
      "\\N": "#c9ada7"
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
    const tooltipNode = tooltip.node() as HTMLElement;
    const tooltipHeight = tooltipNode.offsetHeight;
    if(this.selectedArtists === null || this.selectedArtists.length === 0){
    tooltip.style("display", "block")
        .style("left", `${event.pageX +5}px`)
        .style("top", `${event.pageY+ 5 - tooltipHeight}px`)
        .style("font-color", "black")
        .html(`${regions.map(region => `${region.region}: ${region.selected}`).join('<br/>')} `);
  }else{
    tooltip.style("display", "block")
    .style("left", `${event.pageX + 5}px`)
    .style("top", `${event.pageY+ 5 - tooltipHeight}px`)
    .style("font-color", "black")
    .html(`Year: ${year}<br/>${regions.map(region => `${region.region}: ${region.selected} out of ${region.unselected + region.selected}`).join('<br/>')} `);

  }
  }
  const handleMouseOut =(event: any, d: any) =>{
    tooltip.style('display', 'none');
  }

  const handleClick = (event: any, d: any) => {
    const year = d.data.year;
    this.handleYearSelection(year);
  };
  
  
  
  
  
    this.svg.append('g')
      .selectAll('g')
      .data(stackedData)
      .enter().append('g')
     /*  .attr('fill', (d: any) => {
        const region = d.key.split('-')[0];
        const bool = d.key.split('-')[1];
        return (bool === "unselected")?'white':colorMap[region];
      }) */
        .attr('fill', (d: any) => {
          const region = d.key.split('-')[0];
          return colorMap[region];
        })
      .attr('stroke', (d: any) => {
        const region = d.key.split('-')[0];
        const bool = d.key.split('-')[1];
        return (bool==='unselected') ? colorMap[region]:d3.color(colorMap[region])?.darker(1)})
      .attr('stroke-width', 0.5)
      .attr('opacity', (d: any) => {
        const region = d.key.split('-')[0];
        const bool = d.key.split('-')[1];
        return (bool === 'unselected') ? 0.2 : 1;
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
    
  
      const size = 0.9 * window.innerWidth / 100;
      const fontSize = 0.7 * window.innerWidth / 100;  // Adjust this multiplier as needed for desired text size
      
      legend.selectAll('rect')
        .data(this.legendOrder)
        .enter().append('rect')
        .attr('x', 0)
        .attr('y', (d: any, i: number) => i * (size + 4))  // Added spacing between rectangles
        .attr('width', size)
        .attr('height', size)
        .attr('fill', (d: any) => colorMap[d as keyof typeof colorMap]);
      
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
