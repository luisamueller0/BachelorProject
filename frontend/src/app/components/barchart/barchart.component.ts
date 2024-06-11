import { Component, OnInit, Input, ViewChild, ElementRef, OnChanges, OnDestroy, HostListener } from '@angular/core';
import * as d3 from 'd3';
import { Artist } from '../../models/artist';
import { SelectionService } from '../../services/selection.service';
import { Subscription } from 'rxjs';
import { DecisionService } from '../../services/decision.service';
import { ArtistService } from '../../services/artist.service';

@Component({
  selector: 'app-barchart',
  templateUrl: './barchart.component.html',
  styleUrls: ['./barchart.component.css']
})
export class BarchartComponent implements OnInit, OnChanges, OnDestroy {
  @ViewChild('barChart', { static: true }) private chartContainer!: ElementRef;
  private subscriptions: Subscription = new Subscription();


  
  allArtists: Artist[] = [];
  selectedArtists: Artist[] | null = [];
  nonselectedArtists: Artist[] = [];
  isLoading: boolean = true;
  private svg: any;
  private contentWidth: number = 0;
  private contentHeight: number = 0;

  // Margins in vw and vh
  private margin = {
    top: 2,
    right: 1,
    bottom: 7,
    left: 2.5
  };

  private techniquesHierarchy = [
    { parent: "Drawing", sub: "drawing" },
    { parent: "Drawing", sub: "drawing: chalk" },
    { parent: "Drawing", sub: "drawing: charcoal" },
    { parent: "Drawing", sub: "drawing: pen and ink" },
    { parent: "Painting", sub: "painting" },
    { parent: "Painting", sub: "painting: aquarelle" },
    { parent: "Painting", sub: "painting: gouache" },
    { parent: "Painting", sub: "painting: oil" },
    { parent: "Painting", sub: "painting: tempera" },
    { parent: "Mural Painting", sub: "mural painting" },
    { parent: "Mural Painting", sub: "mural painting: fresco" },
    { parent: "Other", sub: "pastel" },
    { parent: "Other", sub: "mixed media" },
    { parent: "Other", sub: "monotype" },
    { parent: "Other", sub: "other medium" }
  ];
  
  

  // Define the order of techniques
  private techniquesOrder: string[] = [
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
    "other medium"
  ];

 // Define color scales for parent categories
private categoryColorScale = d3.scaleOrdinal<string, string>()
.domain(["Drawing", "Painting", "Mural Painting", "Other"])
.range(d3.schemeCategory10);

private techniqueColorScale = (technique: string) => {
const parentCategory = this.techniquesHierarchy.find(d => d.sub === technique)?.parent || "Other";
const baseColor = this.categoryColorScale(parentCategory);
return d3.color(baseColor)?.brighter(1)!.toString() || '';
};

private unselectedTechniqueColorScale = (technique: string) => {
const parentCategory = this.techniquesHierarchy.find(d => d.sub === technique)?.parent || "Other";
const baseColor = this.categoryColorScale(parentCategory);
return d3.color(baseColor)?.brighter(1)!.copy({ opacity: 0.7 })!.toString() || '';
};

  constructor(private selectionService: SelectionService,
    private decisionService: DecisionService,
    private artistService: ArtistService
  ) { }

  ngOnInit(): void {
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
    if (!this.chartContainer) return;
    this.tryInitialize();

   
  }

  tryInitialize(): void {
    if(this.allArtists.length === 0){
      this.isLoading = true;
      return;
    }else{
      this.createChart();
    }
    
  };

  private createChart(): void {
    this.createSvg();
    this.drawBars();
    this.isLoading = false;
  }

  private createSvg(): void {
     // Remove any existing SVG elements
     d3.select(this.chartContainer.nativeElement).select("figure.svg-container").select("svg").remove();

     const element = this.chartContainer.nativeElement.querySelector('figure.svg-container');
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

  private drawBars(): void {
    if (!this.allArtists.length) return;

    const selectedArtists = this.selectedArtists || [];

    if (selectedArtists.length === 0) {
        this.nonselectedArtists = this.allArtists;
    } else {
        this.nonselectedArtists = this.allArtists.filter(artist => !selectedArtists.find(a => a.id === artist.id));
    }

    const nonselectedTechniqueDistribution = this.calculateTechniqueDistribution(this.nonselectedArtists);
    const selectedTechniqueDistribution = this.calculateTechniqueDistribution(selectedArtists);

    const combinedData = this.prepareStackedData(nonselectedTechniqueDistribution, selectedTechniqueDistribution);

    // Filter techniques order to include only those present in the data
    const presentTechniques = this.techniquesOrder.filter(technique => 
        combinedData.some(data => data.technique === technique && (data.nonselectedArtists > 0 || data.selectedArtists > 0))
    );

    const groupedTechniques = d3.group(presentTechniques, technique => this.techniquesHierarchy.find(d => d.sub === technique)?.parent);

    const x = d3.scaleBand()
        .domain(presentTechniques)
        .range([0, this.contentWidth])
        .padding(0.1);

    const techniquePositions = new Map<string, number>();
    let currentPosition = 0;
    groupedTechniques.forEach((techniques, parent) => {
        techniques.forEach((technique: string, index: number) => {
            techniquePositions.set(technique, currentPosition + x.bandwidth() / 2); // Set midpoint for labels
            currentPosition += x.bandwidth() * (index === techniques.length - 1 ? 1.2 : 1); // Increase padding between different parents
        });
    });

    const customXScale = d3.scaleBand()
        .domain(Array.from(techniquePositions.keys()))
        .range([0, this.contentWidth])
        .padding(0.1);

    const xAxis = this.svg.append("g")
        .attr("transform", `translate(0,${this.contentHeight})`)
        .call(d3.axisBottom(customXScale))
        .selectAll("text")
        .attr("transform", "translate(-10,0)rotate(-45)")
        .style("text-anchor", "end")
        .style("font-weight", '700')
        .style("font-size", "0.6vw")
        .style("color", (d: string) => selectedArtists.length > 0 ? (this.isTechniqueSelected(d, selectedArtists) ? 'black' : 'lightgray') : 'black')
        .style("font-weight", (d: string) => selectedArtists.length > 0 ? (this.isTechniqueSelected(d, selectedArtists) ? 'bold' : '700') : '700');

    xAxis.style("opacity", (d: string) => this.hasTechniqueValue(d, combinedData) ? 1 : 0.3);



    const maxTechniqueValue: number = d3.max(combinedData, d => d.nonselectedArtists + d.selectedArtists) || 0;
    const y = d3.scaleLinear()
        .domain([0, maxTechniqueValue])
        .range([this.contentHeight, 0]).nice()

    const yAxis=this.svg.append("g")
        .call(d3.axisLeft(y));


        yAxis.selectAll("text")
        .style("font-size", "0.6vw"); // Adjust the size as needed
    const stack = d3.stack()
        .keys(['nonselectedArtists', 'selectedArtists']);

    const stackedData = stack(combinedData);

    const bars = this.svg.append("g")
        .selectAll("g")
        .data(stackedData)
        .enter().append("g")
        .selectAll("rect")
        .data((d: any) => d)
        .enter().append("rect")
        .attr("x", (d: any) => customXScale(d.data.technique) || 0)
        .attr("y", (d: any) => y(d[1]))
        .attr("height", (d: any) => y(d[0]) - y(d[1]))
        .attr("width", customXScale.bandwidth())
        .attr("fill", (d: any, i: number, nodes: any) => {
            const seriesIndex = nodes[i].parentNode.__data__.key;
            return seriesIndex === 'nonselectedArtists' && selectedArtists.length > 0
                ? this.unselectedTechniqueColorScale(d.data.technique)
                : this.techniqueColorScale(d.data.technique);
        });

    // Add legend
    const legend = this.svg.append("g")
        .attr("transform", `translate(${this.contentWidth + 20}, 0)`);

    const categories = Array.from(new Set(this.techniquesHierarchy.map(d => d.parent)));
    categories.forEach((category, index) => {
        legend.append("rect")
            .attr("x", 0)
            .attr("y", index * 20)
            .attr("width", 18)
            .attr("height", 18)
            .style("fill", this.categoryColorScale(category));
        
        legend.append("text")
            .attr("x", 24)
            .attr("y", index * 20 + 9)
            .attr("dy", ".35em")
            .text(category);
    });
}

  
  
  
  private isTechniqueSelected(technique: string, selectedArtists: Artist[]): boolean {
    return selectedArtists.some(artist => artist.techniques.includes(technique));
  }

  private hasTechniqueValue(technique: string, combinedData: any[]): boolean {
    const dataEntry = combinedData.find(d => d.technique === technique);
    return dataEntry ? (dataEntry.nonselectedArtists > 0 || dataEntry.selectedArtists > 0) : false;
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
  
  private prepareStackedData(nonselectedTechniqueDistribution: Map<string, number>, selectedTechniqueDistribution: Map<string, number>): any[] {
    const combinedData: any[] = [];
  
    this.techniquesOrder.forEach(technique => {
      const nonselectedCount = nonselectedTechniqueDistribution.get(technique) || 0;
      const selectedCount = selectedTechniqueDistribution.get(technique) || 0;
      combinedData.push({
        technique,
        nonselectedArtists: nonselectedCount,
        selectedArtists: selectedCount
      });
    });
  
    return combinedData;
  }
}
