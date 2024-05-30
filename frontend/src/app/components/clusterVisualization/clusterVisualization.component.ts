import { Component, OnInit, Input, ViewChild, ElementRef, OnChanges, OnDestroy, HostListener } from '@angular/core';
import * as d3 from 'd3';
import { Artist, ArtistNode, ClusterNode } from '../../models/artist';
import exhibited_with from '../../models/exhibited_with';
import { Subscription } from 'rxjs';
import { DecisionService } from '../../services/decision.service';
import { ArtistService } from '../../services/artist.service';
import { SelectionService } from '../../services/selection.service';

interface InterCommunityEdge extends d3.SimulationLinkDatum<ClusterNode> {
  source: number | ClusterNode;
  target: number | ClusterNode;
  sharedExhibitionMinArtworks: number;
}

@Component({
  selector: 'app-clusterVisualization',
  templateUrl: './clusterVisualization.component.html',
  styleUrls: ['./clusterVisualization.component.css']
})
export class ClusterVisualizationComponent implements OnInit {
  @ViewChild('network', { static: true }) private networkContainer!: ElementRef;
  public isLoading: boolean = true;
  private firstK: number = -1;
  private isIniatialized: boolean = false;

  private clusters: Artist[][] = [];
  private intraCommunityEdges: exhibited_with[][] = [];
  private interCommunityEdges: InterCommunityEdge[] = [];
  private clusterNodes: ClusterNode[] = [];
  public allArtists: Artist[] = [];
  private artistClusterMap: Map<number, ClusterNode> = new Map<number, ClusterNode>();
  private artistNodes: ArtistNode[][] = [];
  private selectedClusterNode: ClusterNode | null = null;
  private allCountries: string[] = [];
 private biggestClusterId: number = -1;
 private margin={top: 2, right: 2, bottom: 2, left: 4};

  

  private subscriptions: Subscription = new Subscription();

  private svg: any;
  private g: any; // Group for zooming
  private baseWidth: number = 0; // Adjusted width
  private baseHeight: number = 0; // Adjusted height
  private minClusterRadius = 200; // Minimum radius for each cluster

  private edgeColorScale = d3.scaleSequential(d3.interpolateGreys).domain([0, 1]);

  private degreesMap: { [clusterId: number]: Map<number, number> } = {};
  private totalExhibitionsMap: { [clusterId: number]: Map<number, number> } = {};
  private totalExhibitedArtworksMap: { [clusterId: number]: Map<number, number> } = {};
  private differentTechniquesMap: { [clusterId: number]: Map<number, number> } = {};

  

  private regionOrder: string[] = ["North Europe", "Eastern Europe", "Southern Europe", "Western Europe", "Others","\\N"];

  private selectedNode: [SVGCircleElement, string] | null = null;
  private selectedCluster: any = null;
  private isNodeClick: boolean = false;

  private simulation: d3.Simulation<ArtistNode, undefined>[] = [];

  private clusterSimulation: d3.Simulation<ClusterNode, undefined> | null = d3.forceSimulation<ClusterNode>();

  private countryIndexMap = new Map<string, number>();

  private clusterCountryCentroids: { [clusterId: number]: { [country: string]: { startAngle: number, endAngle: number, middleAngle: number, color: string | number, country: string } } } = {};

  constructor(private decisionService: DecisionService,
              private artistService: ArtistService,
              private selectionService: SelectionService ){
    this.handleNodeClick = this.handleNodeClick.bind(this);
  }

  ngOnInit() {
    this.loadInitialData();

    this.subscriptions.add(this.decisionService.currentOrder.subscribe(order => {
      this.updateVisualization('order', order);
    }));

    this.subscriptions.add(this.decisionService.currentSize.subscribe(size => {
      this.updateVisualization('size', size);
    }));

    this.subscriptions.add(this.decisionService.currentThickness.subscribe(thickness => {
      this.updateVisualization('thickness', thickness);
    }));

    this.subscriptions.add(this.decisionService.currentSunburst.subscribe(sunburst => {
      this.updateVisualization('sunburst', sunburst);
    }));

    this.subscriptions.add(this.decisionService.currentK.subscribe(k => {
      this.updateCluster(k);
    }));
    this.subscriptions.add(this.decisionService.currentSearchedArtistId.subscribe((id:number|null) => this.highlightArtistNode(id)));

   
    window.addEventListener('resize', this.onResize.bind(this));
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
    window.removeEventListener('resize', this.onResize.bind(this));
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.updateNetwork();
  }

  private createXAxis(xScale: d3.ScaleTime<number, number>) {
    const xAxis = d3.axisBottom(xScale);
  
    this.svg.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0, ${this.baseHeight})`)
      .call(xAxis);
  }
  
  private createYAxis(yScale: d3.ScaleLinear<number, number>) {
    const yAxis = d3.axisLeft(yScale);
  
    this.svg.append('g')
      .attr('class', 'y-axis')
      .call(yAxis);
  }
  
  
  private createScatterPlotScales(clusterNodes: ClusterNode[]) {
    clusterNodes.forEach(cluster => {console.log('scales hallo',cluster.meanBirthDate)});
    const birthDates = clusterNodes.map(cluster => cluster.meanBirthDate);
    const exhibitedArtworks = clusterNodes.map(cluster => cluster.totalExhibitedArtworks);
  

    const xScale = d3.scaleTime()
      .domain(d3.extent(birthDates) as [Date, Date])
      .range([0, this.baseWidth]);
  
    const yScale = d3.scaleLinear()
      .domain([0, d3.max(exhibitedArtworks) as number])
      .range([this.baseHeight, 0]);
  
    return { xScale, yScale };
  }

  private createScatterPlotGroup(): void {
    this.svg.append('g')
      .attr('class', 'scatter-plot')
      .attr('transform', `translate(${this.margin.left},${this.margin.top})`);
  }
  
  private drawScatterPlotPoints(clusterNodes: ClusterNode[], xScale: d3.ScaleTime<number, number>, yScale: d3.ScaleLinear<number, number>) {
    const scatterPlotGroup = this.svg.select('.scatter-plot');
  
    scatterPlotGroup.selectAll('.point')
      .data(clusterNodes)
      .enter()
      .append('circle')
      .attr('class', 'point')
      .attr('cx', (d:any) => xScale(d.meanBirthDate))
      .attr('cy', (d:any) => yScale(d.totalExhibitedArtworks))
      .attr('r', 5) // Adjust the radius as needed
      .attr('fill', 'steelblue')
      .on('click', (event:any, d:any) => this.onClusterClick(d)); // Attach the cluster click handler
  }
  

  

  private updateNetwork(): void {
    if (!this.networkContainer) return;
    const value=this.decisionService.getDecisionSunburst();
    this.loadNewData(this.clusters,this.intraCommunityEdges,this.interCommunityEdges,value)
  }
  
  private highlightArtistNode(id: number | null) {
    if (id === null) {
      this.g.selectAll(".artist-node").style('filter', '');
      return;
    }
  
    const selectedCircle = this.g.selectAll(".artist-node").filter((d: any) => d.artist.id.toString() === id).node() as SVGCircleElement;
    if (!selectedCircle) {
      return; // If no node is found, exit the function
    }
  
    const selectedNodeData = d3.select(selectedCircle).datum() as ArtistNode;
    const simulatedEvent = new MouseEvent("click", {
      bubbles: true,
      cancelable: true,
      view: window
    });
  
    console.log('selectedNodeData:',selectedNodeData)
    console.log('selected event:',simulatedEvent)
    this.handleNodeClick(selectedNodeData, simulatedEvent);
  }

  public getTitle(): string {
    return `Displaying ${this.allArtists.length} artists and ${this.clusters.length} clusters`;
  }

/*   private resizeSvg(): void {
    if (!this.g) return;
  
   
    const svgElement = d3.select(this.networkContainer.nativeElement).select("#figure.network-container").select('svg');
    console.log('svg',SVGGElement)
    const width = this.networkContainer.nativeElement.offsetWidth;
    const height = this.networkContainer.nativeElement.offsetHeight;
  
    svgElement
      .attr("width", width)
      .attr("height", height);
  
    this.baseWidth = width;
    this.baseHeight = height;
  
    this.zoomToFitClusters();
  }
   */
 /*  private zoomToFitClusters(): void {
    if (!this.g) return;

    const bounds = this.g.node().getBBox();
    const fullWidth = bounds.width;
    const fullHeight = bounds.height;
    const width = parseInt(this.svg.attr("width"));
    const height = parseInt(this.svg.attr("height"));
    const midX = bounds.x + fullWidth / 2;
    const midY = bounds.y + fullHeight / 2;

    if (fullWidth === 0 || fullHeight === 0) return;

    const scaleAdjustmentFactor = 0.9;
    const scale = scaleAdjustmentFactor * Math.min(width / fullWidth, height / fullHeight);

    const translate = [width / 2 - scale * midX, height / 2 - scale * midY];

    this.svg.transition()
      .duration(750)
      .call(d3.zoom().transform, d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale));
  } */

  private createSvg(): void {
    d3.select(this.networkContainer.nativeElement).select("figure.network-container").select("svg").remove();

    const zoom: d3.ZoomBehavior<Element, unknown> = d3.zoom<Element, unknown>()
      .scaleExtent([0.1, 10])
      .on('zoom', (event: any) => {
        this.g.attr('transform', event.transform);
      })
      .filter((event: any) => {
        return (!event.ctrlKey || event.type === 'wheel') && event.button === 0;
      })
      .wheelDelta((event: WheelEvent) => -event.deltaY * (event.deltaMode === 1 ? 0.005 : 0.002));
  
      
    const element = this.networkContainer.nativeElement.querySelector('figure.network-container');
   

  const margin = {
    top: this.margin.top * window.innerHeight / 100,
    right: this.margin.right * window.innerWidth / 100,
    bottom: this.margin.bottom * window.innerWidth / 100,
    left: this.margin.left * window.innerWidth / 100
  };
    const width = element.offsetWidth - margin.left - margin.right;
    const height = element.offsetHeight - margin.top - margin.bottom;
    console.log('svg', width, height)
  
    this.svg = d3.select(element).append('svg')
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('viewBox', `0 0 ${element.offsetWidth} ${element.offsetHeight}`)
      .call(zoom as any)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);
     
  
    this.g = this.svg.append('g');
    this.g.append('g').attr('class', 'clusters');
    this.g.append('g').attr('class', 'inter-community-edges');
  
    this.baseWidth = width;
    this.baseHeight = height;
  
   // this.zoomToFitClusters();
  }
  

 private updateVisualization(type: string, value: any) {
    console.log(`Updated ${type} to ${value}`);
    if (this.isIniatialized) {
      if (type === 'size') {
        this.updateNodeSize(value);
      }
      if (type === 'sunburst') {
        const currentNodeSize = this.decisionService.getDecisionSize();
        this.updateSunburst(value);
        
        this.updateNodeSize(currentNodeSize);
      }
    }
  }

  private calculateNormalizedMaps(metric: string): { [clusterId: number]: Map<number, number> } {
    const normalizedMaps: { [clusterId: number]: Map<number, number> } = {};
  
    this.clusters.forEach((cluster, clusterId) => {
      let metricMap = new Map<number, number>();
  
      if (metric === 'Amount of Exhibitions') {
      
          cluster.forEach((artist: Artist) => {
            metricMap.set(artist.id, artist.total_exhibited_artworks);
          });
          this.totalExhibitionsMap[clusterId] = this.normalizeLinear(metricMap);
        
      } else if (metric === 'Amount of different techniques') {
    
          cluster.forEach((artist: Artist) => {
            metricMap.set(artist.id, artist.amount_techniques);
          });
          this.differentTechniquesMap[clusterId] = this.normalizeLinear(metricMap);
        
      } else if (metric === 'Amount of exhibited Artworks') {

          cluster.forEach((artist: Artist) => {
            metricMap.set(artist.id, artist.total_exhibited_artworks);
          });
          this.totalExhibitedArtworksMap[clusterId] = this.normalizeLinear(metricMap);
        
      } else if (metric === 'default: Importance (Degree)') {

          // Calculate degrees only if not already done
          this.calculateNodeDegreesForClusters();
          metricMap = this.degreesMap[clusterId];
        
      }

      normalizedMaps[clusterId] = this.normalizeLinear(metricMap);
    });
  
    return normalizedMaps;
  }
  
  private updateNodeSize(metric: string) {
    const normalizedMaps = this.calculateNormalizedMaps(metric);
  
    // Select all clusters and update the nodes within each cluster
    this.g.selectAll(".cluster").each((cluster: ClusterNode, i: number, nodes: any[]) => {
      const clusterGroup = d3.select(nodes[i]);
      const clusterId = cluster.clusterId;
      const normalizedMap = normalizedMaps[clusterId];
  
      // Array to store sizes of nodes in the current cluster
      const updatedSizes: number[] = [];
  
      // Update the radius of each node in the cluster based on the normalized values
      clusterGroup.selectAll<SVGCircleElement, ArtistNode>(".artist-node")
        .attr('r', (d: ArtistNode) => {
          const artistId = d.artist.id;
          const innerRadius = cluster.innerRadius; // Use the cluster's innerRadius directly
          const radius = this.calculateNodeRadius(artistId, normalizedMap, innerRadius);
          updatedSizes[d.id] = radius;
          return radius;
        });
  
      // Update the force simulation for the artist nodes without recreating the entire network
      this.updateSimulation(updatedSizes, clusterGroup, cluster);
    });
  }
  
  private updateSimulation(updatedSizes: number[], clusterGroup: any, cluster: ClusterNode) {
    if (this.simulation[cluster.clusterId]) {
      const artistNodes = this.artistNodes[cluster.clusterId];
  
      const type = this.decisionService.getDecisionSunburst();
      // Reset positions using the new function
      const degreeMap = this.degreesMap[cluster.clusterId];
      const metricMap = this.calculateNormalizedMaps(this.decisionService.getDecisionSize())[cluster.clusterId];
      artistNodes.forEach(node => {
        const newPos = this.calculateNewPosition(type,node.artist, node.countryData, degreeMap, metricMap, cluster, 0, 0);
        node.x = newPos.x;
        node.y = newPos.y;
        node.vx = 0;
        node.vy = 0;
      });
  
      const edges = clusterGroup.selectAll(".artist-edge");
      const circles = clusterGroup.selectAll(".artist-node");
      const centralNode = artistNodes.reduce((maxNode, node) => {
        const degree = degreeMap.get(node.artist.id) || 0;
        return degree > (degreeMap.get(maxNode.artist.id) || 0) ? node : maxNode;
      }, artistNodes[0]);
  
  
      const padding = window.innerWidth/100*0.2;
      // Update the force simulation
      this.simulation[cluster.clusterId]
        .nodes(artistNodes)
        .force("collision", d3.forceCollide((d: any) => {
          if (d.id === centralNode.id) {
            return 0; // Exclude the central node from collision
          }
          return this.calculateCollisionRadius(updatedSizes[d.id] || 0);
        }))        .force("boundary", this.boundaryForce(artistNodes, cluster.innerRadius - padding)) // Add boundary force
        .force("repelFromCenter", this.repelFromCenterForce(artistNodes, centralNode, updatedSizes[centralNode.id] || 0, 2)) // Add custom repel force
        .force("boundary", this.boundaryForce(artistNodes, cluster.innerRadius - padding)) // Add boundary force
        .on("tick", () => {
          circles
            .attr('cx', (d: ArtistNode) => d.x)
            .attr('cy', (d: ArtistNode) => d.y);
          edges
            .attr("x1", (d: any) => d.source.x)
            .attr("y1", (d: any) => d.source.y)
            .attr("x2", (d: any) => d.target.x)
            .attr("y2", (d: any) => d.target.y);
        });
  
      // Restart the simulation with alpha
      this.simulation[cluster.clusterId].alpha(1).restart();
    }
  }
  
  
  private calculateNewPosition(type: string, artist: Artist, countryData: any, degreeMap: Map<number, number>, metricMap: Map<number, number>, cluster: ClusterNode, centerX: number, centerY: number): { x: number, y: number, radius: number, color: string | number } {
    const degree = degreeMap.get(artist.id) || 0;
    const radialScale = this.setupRadialScale(cluster.innerRadius);
    const radial = radialScale(degree);
    const nodeRadius = metricMap.get(artist.id) || 0;
    const angle = countryData.middleAngle;
    const x = centerX + radial * Math.sin(angle);
    const y = centerY - radial * Math.cos(angle);
    let countryIndex:number=0;
    switch(type){
    case 'nationality':
      countryIndex = this.countryIndexMap.get(artist.nationality) as number;
      break;
    case 'birthcountry':
      countryIndex = this.countryIndexMap.get(artist.birthcountry) as number;
      break;
    case 'deathcountry':
      countryIndex = this.countryIndexMap.get(artist.deathcountry) as number;
      break;
    case 'mostexhibited':
      countryIndex = this.countryIndexMap.get(artist.most_exhibited_in) as number;
      break;
    }
    return {
      x: x,
      y: y,
      radius: this.calculateRadiusForNode(nodeRadius, cluster.innerRadius),
      color: this.artistService.getCountryColor(countryData.country,1)
    };
  }
  


private calculateNodeRadius(artistId: number, normalizedMap: Map<number, number>, innerRadius: number): number {
    const normalizedValue = normalizedMap.get(artistId) || 0;
    return this.calculateRadiusForNode(normalizedValue, innerRadius);
}

  

  private updateSunburst(value: string) {
    const range = this.decisionService.getDecisionRange();
    const k = this.decisionService.getK();
    console.log('sunburst value:', value, 'range:', range, 'k:', k)
    this.changeCluster(value);

  }


private changeCluster(value: string){
    // Remove the existing SVG element
    d3.select("figure#network").select("svg").remove();
    let allArtists:Artist[]= [];
    this.clusters.forEach((cluster, clusterIndex) => {
      allArtists.push(...cluster);
  
    });
    this.selectedCluster = allArtists;
    this.allArtists = allArtists;
    this.selectionService.selectAllArtists(this.allArtists)
    this.selectionService.selectArtists(null);
  /*   const biggestCluster = this.clusters.reduce((max, cluster) => cluster.length > max.length ? cluster : max, this.clusters[0]);
    const biggestClusterId = this.clusters.findIndex(cluster => cluster === biggestCluster);
    const biggestClusterEdges = this.intraCommunityEdges[biggestClusterId]
    this.biggestClusterId = biggestClusterId;
    this.selectionService.selectFocusCluster([[biggestCluster], [biggestClusterEdges]]);
 */
    switch(value){
      case 'nationality':
        this.allArtists.forEach(artist => {
          if(!this.allCountries.includes(artist.nationality)){
            this.allCountries.push(artist.nationality)
          }
        });
        break;
      case 'birthcountry':
        this.allArtists.forEach(artist => {
          if(!this.allCountries.includes(artist.birthcountry)){
            this.allCountries.push(artist.birthcountry)
          }
        });
        break;
      case 'deathcountry':
        this.allArtists.forEach(artist => {
          if(!this.allCountries.includes(artist.deathcountry)){
            this.allCountries.push(artist.deathcountry)
          }
        });
        break;
      case 'mostexhibited':
        this.allArtists.forEach(artist => {
          if(!this.allCountries.includes(artist.most_exhibited_in)){
            this.allCountries.push(artist.most_exhibited_in)
          }
        });
        break;
    }
    this.selectionService.selectCountries(this.allCountries);
 

    // Calculate degrees for each cluster
    this.calculateNodeDegreesForClusters();


    this.initializeVisualization(value);
    this.isLoading = false;

  
  
}
  private   updateCluster(k: number) {
    if(this.firstK === -1){
      this.firstK = this.firstK + 1;
      return;
    }
  
    const range = this.decisionService.getDecisionRange();

    if(range.length !== 0){

       // Remove the existing SVG element
    d3.select("figure#network").select("svg").remove();
      this.isLoading = true;
      this.artistService.clusterAmountArtists(range, k).subscribe((data) => {
      const clusters = data[0];
      const intraCommunityEdges = data[1] as exhibited_with[][];
      const interCommunityEdges = data[2] as exhibited_with[];
      
      const value = this.decisionService.getDecisionSunburst();
      this.loadNewData(clusters, intraCommunityEdges, interCommunityEdges, value);

    }, error => {
      console.error('There was an error', error);
      this.isLoading = false;
    });
      
    
    }
  }

private loadNewData(clusters: Artist[][], intraCommunityEdges: exhibited_with[][], interCommunityEdges: exhibited_with[]|InterCommunityEdge[], value: string){
    // Remove the existing SVG element
    
    this.clusters = clusters;
    this.intraCommunityEdges = intraCommunityEdges;
    if (Array.isArray(interCommunityEdges) && interCommunityEdges.length > 0) {
      if (interCommunityEdges[0] instanceof exhibited_with) {
        this.interCommunityEdges = (interCommunityEdges as exhibited_with[]).map(edge => ({
          source: edge.startId,
          target: edge.endId,
          sharedExhibitionMinArtworks: edge.sharedExhibitionMinArtworks,
        }));
      }}
    let allArtists:Artist[]= [];
    this.clusters.forEach((cluster, clusterIndex) => {
      allArtists.push(...cluster);
  
    });
    this.selectedCluster = allArtists;
    this.allArtists = allArtists;
    this.selectionService.selectArtists(null);
    this.selectionService.selectAllArtists(this.allArtists);
   /*  const biggestCluster = this.clusters.reduce((max, cluster) => cluster.length > max.length ? cluster : max, this.clusters[0]);
    const biggestClusterId = this.clusters.findIndex(cluster => cluster === biggestCluster);
    const biggestClusterEdges = this.intraCommunityEdges[biggestClusterId]
    this.biggestClusterId = biggestClusterId;
    this.selectionService.selectFocusCluster([[biggestCluster], [biggestClusterEdges]]); */

    switch(value){
      case 'nationality':
        this.allArtists.forEach(artist => {
          if(!this.allCountries.includes(artist.nationality)){
            this.allCountries.push(artist.nationality)
          }
        });
        break;
      case 'birthcountry':
        this.allArtists.forEach(artist => {
          if(!this.allCountries.includes(artist.birthcountry)){
            this.allCountries.push(artist.birthcountry)
          }
        });
        break;
      case 'deathcountry':
        this.allArtists.forEach(artist => {
          if(!this.allCountries.includes(artist.deathcountry)){
            this.allCountries.push(artist.deathcountry)
          }
        });
        break;
      case 'mostexhibited':
        this.allArtists.forEach(artist => {
          if(!this.allCountries.includes(artist.most_exhibited_in)){
            this.allCountries.push(artist.most_exhibited_in)
          }
        });
        break;
    }
    this.selectionService.selectCountries(this.allCountries);
 

    // Calculate degrees for each cluster
    this.calculateNodeDegreesForClusters();


    this.initializeVisualization(value);
    this.isLoading = false;

  }
  
  private loadInitialData() {
   
    // Fetch data from backend
    this.artistService.clusterAmountArtists([200, 2217], 7)
      .subscribe(data => {
    
        this.clusters = data[0];
        console.log('clusters:',this.clusters )

        this.intraCommunityEdges = data[1] as exhibited_with[][];
        const interCommunityEdgesRaw = data[2] as exhibited_with[];
    
        this.interCommunityEdges = interCommunityEdgesRaw.map(edge => ({
          source: edge.startId,
          target: edge.endId,
          sharedExhibitionMinArtworks: edge.sharedExhibitionMinArtworks
        }));

        let allArtists:Artist[]= [];
        this.clusters.forEach((cluster, clusterIndex) => {
          allArtists.push(...cluster);
        });
        this.selectedCluster = allArtists;
        this.allArtists = allArtists;
        this.selectionService.selectAllArtists(allArtists);
        
        // Add for map a list of all countries
        this.allArtists.forEach(artist => {
          if(!this.allCountries.includes(artist.nationality)){
            this.allCountries.push(artist.nationality)
          }
        });
  
  /*       const biggestCluster = this.clusters.reduce((max, cluster) => cluster.length > max.length ? cluster : max, this.clusters[0]);
        const biggestClusterId = this.clusters.findIndex(cluster => cluster === biggestCluster);
        this.biggestClusterId = biggestClusterId;
        const biggestClusterEdges = this.intraCommunityEdges[biggestClusterId]
        this.selectionService.selectFocusCluster([[biggestCluster], [biggestClusterEdges]]);
 */
        
        this.selectionService.selectCountries(this.allCountries);

        
       
        //this.selectionService.selectArtist(this.selectedCluster);

        

        // Calculate degrees for each cluster
        this.calculateNodeDegreesForClusters();

      

      
        this.initializeVisualization('nationality');

        this.isLoading = false;
        this.isIniatialized = true;
      }, error => {
        console.error('There was an error', error);
        this.isLoading = false;
      });
  }

  private initializeVisualization(value: string) {
    this.createSvg();
    const clusterNodes = this.renderClusters(value); // Render clusters first
     // Calculate scales
  const { xScale, yScale } = this.createScatterPlotScales(clusterNodes);
  console.log('scales:',xScale, yScale)
  // Create and draw the scatter plot
  this.createScatterPlotGroup();
  this.createXAxis(xScale);
  this.createYAxis(yScale);
  this.drawScatterPlotPoints(clusterNodes, xScale, yScale); 

  }


  private calculateClusterMetrics(artists: Artist[]): [Date, Date,number] {
  
    let totalExhibitedArtworks = 0;
    let weightedSumDate = 0;
    let totalWeight = 0;
    let totalWeight2 = 0;
    let weightedSumDate2 = 0;
  
    artists.forEach(artist => {
      const overallAvgDate = new Date(artist.overall_avg_date).getTime(); // Convert overall_avg_date to timestamp
      const birthYearDate = new Date(artist.birthyear).getTime(); // Convert birthyear to timestamp
  
      totalExhibitedArtworks += artist.total_exhibited_artworks;
      weightedSumDate += overallAvgDate * artist.total_exhibited_artworks;
      weightedSumDate2 += birthYearDate * artist.total_exhibited_artworks;
      totalWeight2 += artist.total_exhibited_artworks;
      totalWeight += artist.total_exhibited_artworks;
    });
  
    const meanTimestamp2 = totalWeight2 ? weightedSumDate2 / totalWeight2 : new Date(1910, 0, 1).getTime(); // Default to 1910 if no weight
    const meanTimestamp = totalWeight ? weightedSumDate / totalWeight : new Date(1910, 0, 1).getTime(); // Default to 1910 if no weight
    const meanDate = new Date(meanTimestamp); // Convert back to Date object
    const meanDate2 = new Date(meanTimestamp2); // Convert back to Date object
    console.log('cluster average', meanDate, totalExhibitedArtworks);
    console.log('cluster birth', meanDate2, totalExhibitedArtworks);
  
    return [meanDate, meanDate2, totalExhibitedArtworks];
  }
  
  private renderClusters(value: string): ClusterNode[] {
    const maxSize = Math.max(...this.clusters.map(cluster => cluster.length));
console.log(this.clusters)
    const clusterNodes: ClusterNode[] = this.clusters.map((cluster, index) => {
      const [outerRadius, innerRadius] = this.createSunburstProperties(cluster.length, maxSize);
      const [meanAvgDate, meanBirthDate,totalExhibitedArtworks] = this.calculateClusterMetrics(cluster);
      console.log('scales', meanAvgDate, meanBirthDate,totalExhibitedArtworks)
      return {
        clusterId: index,
        artists: cluster,
        outerRadius: outerRadius,
        innerRadius: innerRadius,
        x: Math.random() * this.baseWidth - this.baseWidth / 2,
        y: Math.random() * this.baseHeight - this.baseWidth / 2,
        meanAvgDate: meanAvgDate, // Initialize with a default date,
        meanBirthDate: meanBirthDate,
        totalExhibitedArtworks: totalExhibitedArtworks
      };
    });


    

    const clusterGroups = clusterNodes.map(clusterNode => this.createClusterGroup(clusterNode, value));

    // Bind the data to the cluster elements using d3.join()
    this.g.select('.clusters').selectAll(".cluster")
      .data(clusterNodes)
      .join(
        (enter: any) => enter.append("g").attr("class", "cluster"),
        (update: any) => update,
        (exit: any) => exit.remove()
      )
      .each(function (this: any, d: any, i: number) { // Add type annotation to 'this'
        d3.select(this).selectAll("*").remove(); // Clear any existing content
        d3.select(this).append(() => clusterGroups[i]);
      });

      this.clusterNodes = clusterNodes;
      this.clusters.forEach((cluster, clusterIndex) => {
        // Populate the artistClusterMap
        cluster.forEach(artist => {
          this.artistClusterMap.set(artist.id, this.clusterNodes[clusterIndex]);
        });
      });
     
      
    // Simulate the clusters
    this.simulateClusters(clusterNodes);
    return clusterNodes;
  }

  private findClusterNodeById(id: number): number {
      return this.clusterNodes.findIndex(clusterNode => clusterNode.clusterId === id)!;
  }

  private simulateClusters(clusterNodes: ClusterNode[]): void {
   
    this.clusterSimulation = d3.forceSimulation<ClusterNode>(clusterNodes)
      .force("collision", d3.forceCollide<ClusterNode>().radius(d => d.outerRadius))
    
      .force("x", d3.forceX((d:ClusterNode) => (d.clusterId % 2 === 0 ? 500 : -500)).strength(0.7)) // Increase strength and offset
      .force("y", d3.forceY(0).strength(0.05)) // Reduce strength of y force
      .on("tick", () => this.ticked());

    console.log("Cluster simulation setup with links:", this.clusterSimulation);
}



  private ticked(): void {

    // Update the cluster positions
    this.g.selectAll(".cluster")
    .attr("x1", (d: ClusterNode) => d.x)
      .attr("cy", (d: ClusterNode) => d.y)
      .attr("transform", (d: ClusterNode) => `translate(${d.x}, ${d.y})`);
    const clusternodes = this.g.selectAll(".cluster");

    // Update positions of nodes within clusters
    this.g.selectAll(".artist-node")
      .attr("cx", (d: ArtistNode) => d.x)
      .attr("cy", (d: ArtistNode) => d.y);

    this.g.selectAll(".artist-edge")
      .attr("x1", (d: any) => d.source.x)
      .attr("y1", (d: any) => d.source.y)
      .attr("x2", (d: any) => d.target.x)
      .attr("y2", (d: any) => d.target.y);

      this.g.selectAll(".inter-community-edge")
      .attr("x1", (d: any) => d.source.x)
      .attr("y1", (d: any) => d.source.y)
      .attr("x2", (d: any) => d.target.x)
      .attr("y2", (d: any) => d.target.y);
  /* 
    // Update inter-community edge positions
    this.g.selectAll(".inter-community-edge")
      .attr("x1", (d: any) => {
        const startClusterIndex =this.findClusterNodeById(d.source.clusterId as number);
        const startCluster = this.clusterNodes[startClusterIndex]
        const endClusterIndex =this.findClusterNodeById( d.target.clusterId as number);
        const endCluster = this.clusterNodes[endClusterIndex]
        const { x1 } = this.calculateIntersectionPoint(startCluster, endCluster);
        return x1;
      })
      .attr("y1", (d: any) => {
        const startClusterIndex =this.findClusterNodeById( d.source.clusterId as number);
        const startCluster = this.clusterNodes[startClusterIndex]
        const endClusterIndex =this.findClusterNodeById(d.target.clusterId as number);
        const endCluster = this.clusterNodes[endClusterIndex]
        const { y1 } = this.calculateIntersectionPoint(startCluster, endCluster);
        return y1;
      })
      .attr("x2", (d: any) => {
        const startClusterIndex =this.findClusterNodeById(d.source.clusterId as number);
        const startCluster = this.clusterNodes[startClusterIndex]
        const endClusterIndex =this.findClusterNodeById( d.target.clusterId as number);
        const endCluster = this.clusterNodes[endClusterIndex]
        const { x2 } = this.calculateIntersectionPoint(startCluster, endCluster);
        return x2;
      })
      .attr("y2", (d: any) => {
        const startClusterIndex =this.findClusterNodeById( d.source.clusterId as number);
        const startCluster = this.clusterNodes[startClusterIndex]
        const endClusterIndex =this.findClusterNodeById( d.target.clusterId as number);
        const endCluster = this.clusterNodes[endClusterIndex]
        const { y2 } = this.calculateIntersectionPoint(startCluster, endCluster);
        return y2;
      });
  */
    // Debug: Log the updated edge positions to ensure they are being set correctly

  }


   
  private calculateIntersectionPoint(source: ClusterNode, target: ClusterNode): { x1: number, y1: number, x2: number, y2: number } {
    let x1 = 0;
    let y1 = 0;
    let x2 = 0;
    let y2 = 0;

    if (source.x !== undefined && source.y !== undefined && target.x !== undefined && target.y !== undefined) {
      const dx = target.x - source.x;
      const dy = target.y - source.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > 0) {
        x1 = source.x + (source.outerRadius * dx / distance);
        y1 = source.y + (source.outerRadius * dy / distance);
        x2 = target.x - (target.outerRadius * dx / distance);
        y2 = target.y - (target.outerRadius * dy / distance);
      }
    }

    // Debug: Log the calculated intersection points


    return { x1, y1, x2, y2 };
  }



  private renderInterCommunityEdges(): void {
    const edgeScale = d3.scaleLinear()
      .domain(d3.extent(this.interCommunityEdges, d => d.sharedExhibitionMinArtworks) as [number, number])
      .range([1, 50]); // Adjust range as needed for stroke width

      
    const edges = this.g.selectAll(".inter-community-edge")
      .data(this.interCommunityEdges)
      .enter()
      .append("line")
      .attr("class", "inter-community-edge")
      .style("stroke", "#aaa")
      .style("stroke-width", (d: any) => edgeScale(d.sharedExhibitionMinArtworks))
      .attr("x1", (d: any) => {
        const startClusterIndex =this.findClusterNodeById(d.source.clusterId as number);
        const startCluster = this.clusterNodes[startClusterIndex]
        const endClusterIndex =this.findClusterNodeById( d.target.clusterId as number);
        const endCluster = this.clusterNodes[endClusterIndex]
        const { x1 } = this.calculateIntersectionPoint(startCluster, endCluster);
        return x1;
      })
      .attr("y1", (d: any) => {
        const startClusterIndex =this.findClusterNodeById( d.source.clusterId as number);
        const startCluster = this.clusterNodes[startClusterIndex]
        const endClusterIndex =this.findClusterNodeById(d.target.clusterId as number);
        const endCluster = this.clusterNodes[endClusterIndex]
        const { y1 } = this.calculateIntersectionPoint(startCluster, endCluster);
        return y1;
      })
      .attr("x2", (d: any) => {
        const startClusterIndex =this.findClusterNodeById(d.source.clusterId as number);
        const startCluster = this.clusterNodes[startClusterIndex]
        const endClusterIndex =this.findClusterNodeById( d.target.clusterId as number);
        const endCluster = this.clusterNodes[endClusterIndex]
        const { x2 } = this.calculateIntersectionPoint(startCluster, endCluster);
        return x2;
      })
      .attr("y2", (d: any) => {
        const startClusterIndex =this.findClusterNodeById( d.source.clusterId as number);
        const startCluster = this.clusterNodes[startClusterIndex]
        const endClusterIndex =this.findClusterNodeById( d.target.clusterId as number);
        const endCluster = this.clusterNodes[endClusterIndex]
        const { y2 } = this.calculateIntersectionPoint(startCluster, endCluster);
        return y2;
      });



  }
  private createClusterGroup(clusterNode: ClusterNode, value: string): SVGGElement {
    const arcGenerator = d3.arc<any>()
      .innerRadius(clusterNode.innerRadius)
      .outerRadius(clusterNode.outerRadius);
  
    const countryMap = new Map<string, Artist[]>();
    let sortedArtists: Artist[] = [];
  
    // Populate the country map based on the value parameter
    switch (value) {
      case 'nationality':
        sortedArtists = this.prepareData(clusterNode.artists, value);
        sortedArtists.forEach(artist => {
          if (!countryMap.has(artist.nationality)) {
            countryMap.set(artist.nationality, []);
          }
          countryMap.get(artist.nationality)!.push(artist);
        });
        break;
      case 'birthcountry':
        sortedArtists = this.prepareData(clusterNode.artists, value);
        sortedArtists.forEach(artist => {
          if (!countryMap.has(artist.birthcountry)) {
            countryMap.set(artist.birthcountry, []);
          }
          countryMap.get(artist.birthcountry)!.push(artist);
        });
        break;
      case 'deathcountry':
        sortedArtists = this.prepareData(clusterNode.artists, value);
        sortedArtists.forEach(artist => {
          if (!countryMap.has(artist.deathcountry)) {
            countryMap.set(artist.deathcountry, []);
          }
          countryMap.get(artist.deathcountry)!.push(artist);
        });
        break;
      case 'mostexhibited':
        sortedArtists = this.prepareData(clusterNode.artists, value);
        sortedArtists.forEach(artist => {
          if (!countryMap.has(artist.most_exhibited_in)) {
            countryMap.set(artist.most_exhibited_in, []);
          }
          countryMap.get(artist.most_exhibited_in)!.push(artist);
        });
        break;
    }
  
    // Calculate angles for each nationality segment
    const countries = Array.from(countryMap.keys());
    const totalArtists = clusterNode.artists.length;
    const minimumAngle = Math.PI / 18;
  
    let totalAngleAvailable = 2 * Math.PI;
    const dynamicAngles = new Map<string, number>();
  
    // First pass to assign minimum angles and adjust total available angle
    countryMap.forEach((artists, country) => {
      dynamicAngles.set(country, minimumAngle);
      totalAngleAvailable -= minimumAngle;
    });
  
    // Allocate remaining angles based on the proportion of artists
    countryMap.forEach((artists, country) => {
      const proportion = artists.length / totalArtists;
      const extraAngle = proportion * totalAngleAvailable;
      const currentAngle = dynamicAngles.get(country) || 0;
      dynamicAngles.set(country, currentAngle + extraAngle);
    });
  
    let currentAngle = 0;
    const data = countries.map((country) => {
      const angle = dynamicAngles.get(country) as number;
      const startAngle = currentAngle;
      const endAngle = currentAngle + angle;
      const middleAngle = (startAngle + endAngle) / 2;
      currentAngle = endAngle;
      const countryIndex = this.countryIndexMap.get(country) as number;
      return {
        country,
        startAngle,
        endAngle,
        middleAngle,
        innerRadius: clusterNode.innerRadius,
        outerRadius: clusterNode.outerRadius,
        color: this.artistService.getCountryColor(country,1) // Get color from ordinal scale
      };
    });
  
    // Create a new group for this cluster
    const clusterGroup = d3.create("svg:g")
      .attr("class", `cluster cluster-${clusterNode.clusterId}`)
      .on('click', () => this.onClusterClick(clusterNode))
      .attr("transform", `translate(${clusterNode.x}, ${clusterNode.y})`);
  
    // Append paths for the sunburst
    clusterGroup.selectAll("path")
      .data(data)
      .enter()
      .append("path")
      .attr("d", arcGenerator)
      .attr("fill", (d: any) => d.color)
      .style('stroke', 'none'); // Initialize with no border
  
    // Append labels for the countries
    clusterGroup.selectAll("text")
      .data(data)
      .enter()
      .append("text")
      .attr("transform", (d: any) => `translate(${arcGenerator.centroid(d)})`)
      .attr("text-anchor", "middle")
      .text((d: any) => d.country)
   
      .style("font-weight", "bold")
      .style("fill", "white")     // Set the text color to white
   
  
    // Save centroid data for node placement later
    let countryCentroids: { [country: string]: { startAngle: number, endAngle: number, middleAngle: number, color: string | number, country: string } } = {};
    data.forEach(d => {
      countryCentroids[d.country] = {
        startAngle: d.startAngle,
        endAngle: d.endAngle,
        middleAngle: d.middleAngle,
        color: d.color,
        country: d.country
      };
    });
  
    // Store the countryCentroids for this cluster in the component property
    this.clusterCountryCentroids[clusterNode.clusterId] = countryCentroids;
  
    // Add artist network within the cluster
    this.createArtistNetwork(value, clusterGroup, clusterNode, countryCentroids);
  
    return clusterGroup.node() as SVGGElement;
  }


  private resetClusterFocus(): void {
    if(this.selectedClusterNode){
       // Reset the selected cluster node's border
       this.g.selectAll(`.cluster-${this.selectedClusterNode.clusterId} path`)
       .style('stroke', 'none');
 
     // Clear the selection
     this.selectedClusterNode = null;
     this.selectionService.selectCluster(this.allArtists);
     this.selectionService.selectClusterEdges([]);
     this.selectionService.selectFocusCluster(null);
    }
  }
  private focusHandler(clusterNode:ClusterNode){
   
    const selectedArtists = clusterNode.artists;
    const selectedEdges = this.intraCommunityEdges[clusterNode.clusterId];
  

      // Reset the previous cluster node's border if there is one
      if (this.selectedClusterNode) {
        this.g.selectAll(`.cluster-${this.selectedClusterNode.clusterId} path`)
          .style('stroke', 'none');
      }
  
      // Set the new cluster node as selected and change its border
      this.selectedClusterNode = clusterNode;
      this.g.selectAll(`.cluster-${clusterNode.clusterId} path`)
        .style('stroke', 'black')
        .style('stroke-width', '0.5vw'); // Adjust the border width as needed
  
      // Select the new cluster node
      this.selectionService.selectCluster(selectedArtists);
      this.selectionService.selectClusterEdges(selectedEdges);
      this.selectionService.selectFocusCluster([[selectedArtists], [selectedEdges]]);
   
      
    
  }
  // Cluster click handler
// Cluster click handler
private onClusterClick(clusterNode: ClusterNode): void {
  // If an artist node was clicked, do nothing
  if (this.isNodeClick) {
    this.isNodeClick = false;
    return;
  }
  const type = this.decisionService.getDecisionSunburst();

  const selectedArtists = clusterNode.artists;
  const selectedEdges = this.intraCommunityEdges[clusterNode.clusterId];

  // If the same cluster is clicked again, deselect it
  if (this.selectedClusterNode && this.selectedClusterNode.clusterId === clusterNode.clusterId) {
    // Reset the selected cluster node's border
    this.g.selectAll(`.cluster-${this.selectedClusterNode.clusterId} path`)
      .style('stroke', 'none');

    // Clear the selection
    this.selectedClusterNode = null;
    this.selectionService.selectArtists(null);
    this.selectionService.selectCluster(this.allArtists);
    this.selectionService.selectClusterEdges([]);
    this.selectionService.selectCountries(this.allCountries);
    this.selectionService.selectFocusCluster(null);
  
   

  } else {
    // Reset the previous cluster node's border if there is one
    if (this.selectedClusterNode) {
      this.g.selectAll(`.cluster-${this.selectedClusterNode.clusterId} path`)
        .style('stroke', 'none');
    }

    // Set the new cluster node as selected and change its border
    this.selectedClusterNode = clusterNode;
    this.g.selectAll(`.cluster-${clusterNode.clusterId} path`)
      .style('stroke', 'black')
      .style('stroke-width', '0.5vw'); // Adjust the border width as needed

    // Select the new cluster node
    this.selectionService.selectArtists(selectedArtists);
    this.selectionService.selectCluster(selectedArtists);
    this.selectionService.selectClusterEdges(selectedEdges);
    this.selectionService.selectFocusCluster([[selectedArtists], [selectedEdges]]);
    const countries:string[]= [];
    selectedArtists.forEach(artist => {
      switch(type){
        case 'nationality':
          if(!countries.includes(artist.nationality))
          countries.push(artist.nationality);
          break;
        case 'birthcountry':
          if(!countries.includes(artist.birthcountry))
          countries.push(artist.birthcountry);
          break;
        case 'deathcountry':
          if(!countries.includes(artist.deathcountry))
          countries.push(artist.deathcountry);
          break;
        case 'mostexhibited':
          if(!countries.includes(artist.most_exhibited_in))
          countries.push(artist.most_exhibited_in);
          break;
      };
          
    });
    this.selectionService.selectCountries(countries);
    
  }
}


  private createArtistNetwork(value: string, clusterGroup: any, cluster: ClusterNode, countryCentroids: { [country: string]: { startAngle: number, endAngle: number, middleAngle: number, color: string | number, country: string } }): void {
      const artists = cluster.artists;
      const relationships = this.intraCommunityEdges[cluster.clusterId];
      const size = this.decisionService.getDecisionSize();
   
      const metricMap = this.calculateNormalizedMaps(size)[cluster.clusterId];
      const degreeMap = this.degreesMap[cluster.clusterId] || new Map<number, number>();
  
      // Define the central position of the cluster
      const centerX = 0;
      const centerY = 0;
  
      let artistNodes: ArtistNode[] = this.createArtistNodes(artists, countryCentroids, degreeMap, metricMap, cluster, centerX, centerY, value);
      this.artistNodes[cluster.clusterId] = artistNodes;
    
  
    // Ensure nodes are constrained within the bounds of the sunburst
    artistNodes.forEach(node => {
      if (node.x !== undefined && node.y !== undefined) {
        const distance = Math.sqrt(node.x * node.x + node.y * node.y);
        const maxDistance = cluster.innerRadius - node.radius;
        if (distance > maxDistance) {
          const scalingFactor = maxDistance / distance;
          node.x *= scalingFactor;
          node.y *= scalingFactor;
        }
      }
    });
  
    const getNodeIndexById = (id: number) => artistNodes.findIndex((node: ArtistNode) => node.id === id);
  
    const sharedExhibitionMinArtworksValues = relationships.map((relationship: exhibited_with) => relationship.sharedExhibitionMinArtworks);
    const normalizedSharedExhibitionMinArtworks = this.normalizeLogarithmically(new Map(sharedExhibitionMinArtworksValues.map((value, index) => [index, value])));
    const formattedRelationships = relationships.map((relationship: exhibited_with, index) => {
      const sourceIndex = getNodeIndexById(relationship.startId);
      const targetIndex = getNodeIndexById(relationship.endId);
      return {
        source: artistNodes[sourceIndex],
        target: artistNodes[targetIndex],
        sharedExhibitions: relationship.sharedExhibitions,
        sharedExhibitionMinArtworks: normalizedSharedExhibitionMinArtworks.get(index) || 0
      };
    });
  
    formattedRelationships.sort((a, b) => a.sharedExhibitionMinArtworks - b.sharedExhibitionMinArtworks);
  
    const edges = clusterGroup.selectAll(".artist-edge")
      .data(formattedRelationships)
      .enter()
      .append("line")
      .attr("class", "artist-edge")
      .style('stroke', (d: any) => {
   
        const clusterId = cluster.clusterId; // Assuming you have access to the current cluster ID
     
        return this.intraCommunityEdges[clusterId].length === 2 ? 'black' : this.edgeColorScale(d.sharedExhibitionMinArtworks);
      })
      .style('stroke-width', '0.1vw')
      .attr('x1', (d: any) => d.source.x)
      .attr('y1', (d: any) => d.source.y)
      .attr('x2', (d: any) => d.target.x)
      .attr('y2', (d: any) => d.target.y);
  
    const circles = clusterGroup.selectAll(".artist-node")
      .data(artistNodes)
      .enter()
      .append("circle")
      .attr("class", "artist-node")
      .attr('r', (d: any) => d.radius)
      .attr('cx', (d: any) => d.x)
      .attr('cy', (d: any) => d.y)
      .style('fill', (d: any) => d.color)
      .on('mouseover', function (this: SVGCircleElement, event: MouseEvent, d: any) {
        const element = d3.select(this);
        const [x, y] = d3.pointer(event, window.document.body);
        d3.select('#tooltip')
          .style('display', 'block')
          .style('left', `${x + 10}px`)
          .style('top', `${y + 10}px`)
          .html(`Name: ${d.artist.firstname} ${d.artist.lastname}<br/>Technique: ${d.artist.distinct_techniques}<br/>Nationality: ${d.artist.nationality}`);
      })
      .on('mouseout', function () {
        d3.select('#tooltip').style('display', 'none');
      })
      .on('click', (event: MouseEvent, d: any) => this.handleNodeClick(d, event));
  
    const text = clusterGroup.selectAll(".artist-node").append("g").attr("class", "labels").selectAll("g")
      .data(circles)
      .enter().append("g");
  
    text.append("text")
      .attr("x", 14)
      .attr("y", ".31em")
      .style("font-family", "sans-serif")
      .style("font-size", "0.7em")
      .text(function (d: any) { return d.id; });
  
    const sizes = this.getNodeSize(clusterGroup);
    const { width: clusterWidth, height: clusterHeight } = this.getClusterGroupDimensions(clusterGroup);
    const padding = window.innerWidth/100*0.2;

    const centralNode = artistNodes.reduce((maxNode, node) => {
      const degree = degreeMap.get(node.artist.id) || 0;
      return degree > (degreeMap.get(maxNode.artist.id) || 0) ? node : maxNode;
    }, artistNodes[0]);

    const simulation = d3.forceSimulation(artistNodes)
    .force("collision", d3.forceCollide((d: any) => {
      if (d.id === centralNode.id) {
        return 0; // Exclude the central node from collision
      }
      return this.calculateCollisionRadius(sizes[d.id] || 0);
    }))
    .force("repelFromCenter", this.repelFromCenterForce(artistNodes, centralNode, sizes[centralNode.id] || 0, 2)) // Add custom repel force
    .force("boundary", this.boundaryForce(artistNodes, cluster.innerRadius - padding)) // Add boundary force
    .on("tick", () => {
      this.g.selectAll('.artist-node')
        .attr('cx', (d: any) => d.x)
        .attr('cy', (d: any) => d.y);
      edges
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);
    });
  simulation.nodes(artistNodes);
  this.simulation[cluster.clusterId] = simulation;
  simulation.alpha(1).restart();

 
  }
  
  
  private createEdgeColorScale(baseColor: string, minArtworks: number, maxArtworks: number): d3.ScaleLinear<string, number> {
    const baseColorRGB = d3.rgb(baseColor);
    const lighterColor = d3.color(baseColorRGB.toString());
    if (lighterColor) {
        lighterColor.opacity = 0.1; // Set the opacity to 0.3 (30%)
    }
  
  
    if (minArtworks === maxArtworks) {
      // If all values are the same, return a scale that maps everything to the darker color
      console.log('minArtworks === maxArtworks')
      return d3.scaleLinear<string, number>()
        .domain([0, 1])
        .range([baseColor, baseColor]);
    } else {
      return d3.scaleLinear<string, number>()
        .domain([minArtworks, maxArtworks])
        .range([lighterColor?.toString() || baseColor, baseColor]);
    }
}
  
  // Artist node click handler

  
  private handleNodeClick(artistNode: ArtistNode, event: MouseEvent): void {
    let defs = this.svg.append('defs');
  
    let filter = defs.append('filter')
      .attr('id', 'shadow')
      .attr('x', '-50%')
      .attr('y', '-50%')
      .attr('width', '200%')
      .attr('height', '200%');
  
    filter.append('feDropShadow')
      .attr('dx', 0)
      .attr('dy', 0)
      .attr('stdDeviation', 4)
      .attr('flood-color', 'black')
      .attr('flood-opacity', 0.8);
  
    let feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode');
    feMerge.append('feMergeNode')
      .attr('in', 'SourceGraphic');
  
    this.isNodeClick = true;
  
    const circle = d3.selectAll(".artist-node").filter((d: any) => d.id === artistNode.id).node() as SVGCircleElement;
  
    if (this.selectedNode && this.selectedNode[0] === circle) {
      this.resetNodeSelection();
    } else {
      this.selectNode(artistNode, circle);
    }
  }
  
  private resetNodeSelection() {
    if(this.selectedNode){
    const previousNode = this.selectedNode[0];
    const previousColor = this.selectedNode[1];
    
    previousNode.style.fill = previousColor;
     // Retrieve the bound data using D3's datum function
     const previousArtistNodeData = d3.select(previousNode).datum() as ArtistNode;
     const previousArtistNodeId = previousArtistNodeData.id;
     console.log('selected artist node', previousArtistNodeData.id)
 
     const clusterNode = this.artistClusterMap.get(previousArtistNodeId);
     if (clusterNode) {
       this.selectionService.selectArtists(clusterNode.artists);
     } else {
       this.selectionService.selectArtists(null);
     }
   } else {
     this.selectionService.selectArtists(null);
   }
    
    this.g.selectAll(".artist-edge").style('stroke', (d: any) => this.edgeColorScale(d.sharedExhibitionMinArtworks));
  
    this.g.selectAll(".artist-node").style('opacity', '1');
    this.g.selectAll(".artist-node").style('filter', '');
  

   
  
    
    this.selectedNode = null;
    //this.selectionService.selectArtists(null);
    this.selectionService.selectCluster(this.allArtists);
    this.selectionService.selectClusterEdges([]);
    this.selectionService.selectFocusArtist(null);
    this.selectionService.selectCountries(this.allCountries);
  }
  
  private selectNode(artistNode: ArtistNode, circle: SVGCircleElement) {
    if (this.selectedNode) {
      const previousNode = this.selectedNode[0];
      const previousColor = this.selectedNode[1];
      previousNode.style.fill = previousColor;
      this.g.selectAll(".artist-edge").style('stroke', (d: any) => this.edgeColorScale(d.sharedExhibitionMinArtworks));
      this.g.selectAll(".artist-node").style('opacity', '1');
    }
  
    this.selectedNode = [circle, circle.style.fill];
    circle.style.filter = 'url(#shadow)';
  
    const originalColor = d3.color(circle.style.fill) as d3.RGBColor;
    const darkerColor = d3.rgb(originalColor).darker(1);
  
    const sharedExhibitionMinArtworksValues: number[] = [];
    this.g.selectAll(".artist-edge").each((d: any) => {
      sharedExhibitionMinArtworksValues.push(d.sharedExhibitionMinArtworks);
    });
  
    const minArtworks = d3.min(sharedExhibitionMinArtworksValues) ?? 0;
    const maxArtworks = d3.max(sharedExhibitionMinArtworksValues) ?? 1;
    const edgeColorScale = this.createEdgeColorScale(darkerColor.toString(), minArtworks, maxArtworks);
  
    const selectedNodeId = artistNode.id;
    const connectedNodeIds: Set<number> = new Set<number>();
    this.g.selectAll(".artist-edge").each((d: any) => {
      if (d.source.id === selectedNodeId) {
        connectedNodeIds.add(d.target.id);
      } else if (d.target.id === selectedNodeId) {
        connectedNodeIds.add(d.source.id);
      }
    });
  
    this.g.selectAll(".artist-edge").filter((d: any) => {
      return d.source.id === selectedNodeId || d.target.id === selectedNodeId;
    }).style('stroke', (d: any) => edgeColorScale(d.sharedExhibitionMinArtworks));
  
    this.g.selectAll(".artist-edge").filter((d: any) => {
      const clusterNode = this.artistClusterMap.get(artistNode.id);
      if (!clusterNode) return false;
      const clusterId = clusterNode.clusterId;
      const sourceClusterNode = this.artistClusterMap.get(d.source.id);
      const targetClusterNode = this.artistClusterMap.get(d.target.id);
  
      return (sourceClusterNode && sourceClusterNode.clusterId === clusterId) && (targetClusterNode && targetClusterNode.clusterId === clusterId) && (d.source.id !== selectedNodeId && d.target.id !== selectedNodeId);
    }).style('stroke', 'none');
  
    const clusterNode2 = this.artistClusterMap.get(artistNode.id);
    if (clusterNode2) {
      const clusterId = clusterNode2.clusterId;
      this.g.selectAll(".artist-node").each((d: any, i: number, nodes: any) => {
        const nodeCluster = this.artistClusterMap.get(d.id);
        if (!connectedNodeIds.has(d.id) && d.id !== selectedNodeId && nodeCluster && nodeCluster.clusterId === clusterId) {
          d3.select(nodes[i]).style('opacity', '0.2');
        }
      });
  
      this.focusHandler(clusterNode2);
    }
  
    this.selectionService.selectFocusArtist(artistNode.artist);
    this.selectionService.selectArtists([artistNode.artist]);
  
    const artist = artistNode.artist;
    const type = this.decisionService.getDecisionSunburst();
  
    switch (type) {
      case 'nationality':
        this.selectionService.selectCountries([artist.nationality]);
        break;
      case 'birthcountry':
        this.selectionService.selectCountries([artist.birthcountry]);
        break;
      case 'deathcountry':
        this.selectionService.selectCountries([artist.deathcountry]);
        break;
      case 'mostexhibited':
        this.selectionService.selectCountries([artist.most_exhibited_in]);
        break;
    };
  
    const clusterNode = this.artistClusterMap.get(artistNode.id);
    if (clusterNode) {
      const selectedClusterArtists = clusterNode.artists;
      const selectedClusterEdges = this.intraCommunityEdges[clusterNode.clusterId];
      this.selectionService.selectCluster(selectedClusterArtists);
      this.selectionService.selectClusterEdges(selectedClusterEdges);
    }
  }
  
  

  private repelFromCenterForce(artistNodes: ArtistNode[],centralNode: ArtistNode, radius: number, padding: number = 5): (alpha: number) => void {
    return function(alpha: number) {
        centralNode.x = 0; // Ensure the central node stays at the center
        centralNode.y = 0; // Ensure the central node stays at the center

        artistNodes.forEach((d: ArtistNode) => {
            if (d !== centralNode && d.y !== undefined && d.x !== undefined &&centralNode.x !== undefined && centralNode.y !== undefined   ) {
                const dx = d.x - centralNode.x;
                const dy = d.y - centralNode.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const minDistance = radius + padding + d.radius;

                if (distance < minDistance) {
                    const angle = Math.atan2(dy, dx);
                    d.x = centralNode.x + Math.cos(angle) * minDistance;
                    d.y = centralNode.y + Math.sin(angle) * minDistance;
                }
            }
        });
    };
}

  private createArtistNodes(artists: Artist[], countryCentroids: any, degreeMap: Map<number, number>, metricMap: Map<number, number>, cluster: ClusterNode, centerX: number, centerY: number, value: string): ArtistNode[] {
    return artists.map((artist: Artist) => {
      let countryData: any;
      switch (value) {
        case 'nationality':
          countryData = countryCentroids[artist.nationality];
          break;
        case 'birthcountry':
          countryData = countryCentroids[artist.birthcountry];
          break;
        case 'deathcountry':
          countryData = countryCentroids[artist.deathcountry];
          break;
        case 'mostexhibited':
          countryData = countryCentroids[artist.most_exhibited_in];
          break;
      }
      const newPos = this.calculateNewPosition(value,artist, countryData, degreeMap, metricMap, cluster, centerX, centerY);
      return {
        id: artist.id,
        artist: artist,
        x: newPos.x,
        y: newPos.y,
        vx: 0,
        vy: 0,
        angle: countryData.middleAngle,
        radius: newPos.radius,
        color: newPos.color,
        countryData: countryData
      };
    });
  }



  private getNodeSize(clusterGroup:any):number[]{
    // Select all circles with the class 'node'
    const circles = clusterGroup.selectAll('.artist-node');
    
    // Get the radii (sizes) of all circles
    const sizes: number[] = [];
    circles.each(function(this: any, d: any) {
      const radius = parseFloat(d3.select(this).attr('r')); // Get the radius attribute and convert it to a number
      sizes[d.id] = radius; // Store the radius in the sizes array
    });
   
    return sizes;
  }
  
  // Used to order them by default
  private prepareData(artists: Artist[], value: string): Artist[] {

    const regionMap = new Map<string, any[]>();

    // Initialize regions in the map to preserve order
    this.regionOrder.forEach(region => {
      regionMap.set(region, []);
    });
    if(value === 'nationality'){
      artists.forEach(artist => {
        let regionArtists = regionMap.get(artist.europeanRegionNationality);
        if (regionArtists) {
          regionArtists.push(artist);
        }
      });
    }
    // Group artists by country and region
 else if(value === 'birthcountry'){
  artists.forEach(artist => {
    let regionArtists = regionMap.get(artist.europeanRegionBirth);
    if (regionArtists) {
      regionArtists.push(artist);
    }
  });
}
 // Group artists by country and region
 else if(value === 'deathcountry'){
  artists.forEach(artist => {
    let regionArtists = regionMap.get(artist.europeanRegionDeath);
    if (regionArtists) {
      regionArtists.push(artist);
    }
  });
}
else if(value === 'mostexhibited'){
  artists.forEach(artist => {
    let regionArtists = regionMap.get(artist.europeanRegionMostExhibited);
    if (regionArtists) {
      regionArtists.push(artist);
    }
  });
}
    

    // Flatten the map to an array for d3 processing, filtering out empty regions
    const sortedArtists = Array.from(regionMap.entries())
      .filter(([region, artists]) => artists.length > 0)
      .flatMap(([region, artists]) => artists);


    return sortedArtists;
  }

  // Used to generate the possible radius properties for each sunburst cluster
  private createSunburstProperties(clusterSize: number, maxSize: number): [number, number] {
    const minRadius = this.minClusterRadius; // Use the minimum cluster radius as the base
    const maxRadius = Math.min(this.baseWidth, this.baseHeight) / 3; // Adjust max radius to fit within SVG dimensions
  
    const sunburstThickness =2* window.innerWidth/100;
  
    // Calculate the proportional radius based on cluster size
    const outerRadius = minRadius + ((maxRadius - minRadius) * (clusterSize / maxSize));
    const innerRadius = outerRadius - sunburstThickness;
  
    return [outerRadius, innerRadius];
  }
  
  
  private getClusterGroupDimensions(clusterGroup: any): { width: number, height: number } {
    const bbox = clusterGroup.node().getBBox();
    return { width: bbox.width, height: bbox.height };
  }
  
  
  // Define the boundary force
private boundaryForce(artistNodes: ArtistNode[], innerRadius: number): (alpha: number) => void {
  const padding = window.innerWidth/100*0.2;
  return function(alpha: number) {
    artistNodes.forEach((d: any) => {
      const distance = Math.sqrt(d.x * d.x + d.y * d.y);
      const maxDistance = innerRadius - padding - d.radius;
      if (distance > maxDistance) {
        const scalingFactor = maxDistance / distance;
        d.x *= scalingFactor;
        d.y *= scalingFactor;
      }
    });
  };
}


  private createGlobalColorScale(value:string): d3.ScaleSequential<string, number> {
    const allCountries = new Set<string>();
    if(value === 'nationality'){
      this.clusters.forEach(cluster => {
        cluster.forEach(artist => {
          allCountries.add(artist.nationality); // Assuming nationality as the country key
        });
      });
    }
    else if(value === 'birthcountry')  {
      this.clusters.forEach(cluster => {
        cluster.forEach(artist => {
          allCountries.add(artist.birthcountry); // Assuming nationality as the country key
        });
      });
    }
    else if(value === 'deathcountry')  {
      this.clusters.forEach(cluster => {
        cluster.forEach(artist => {
          allCountries.add(artist.deathcountry); // Assuming nationality as the country key
        });
      });
    }
    else if(value === 'mostexhibited')  {
      this.clusters.forEach(cluster => {
        cluster.forEach(artist => {
          allCountries.add(artist.most_exhibited_in); // Assuming nationality as the country key
        });
      });
    }
    const countryArray = Array.from(allCountries);

    countryArray.forEach((country, index) => {
      this.countryIndexMap.set(country, index);
    });
    return this.createColorScale(countryArray);
  }

  private createColorScale(countries: string[]): d3.ScaleSequential<string, number> {
    // Create a scale that maps [0, number of countries] to [0, 1]
    const colorScale = d3.scaleSequential(d3.interpolateWarm)
      .domain([0, countries.length - 1]);

    return colorScale;
  }

  private calculateNodeDegrees(relationships: exhibited_with[]): Map<number, number> {
    const degreeMap = new Map<number, number>();

    relationships.forEach(rel => {
      degreeMap.set(rel.startId, (degreeMap.get(rel.startId) || 0) + 1);
      degreeMap.set(rel.endId, (degreeMap.get(rel.endId) || 0) + 1);
    });

    return degreeMap;
  }

  private normalizeLinear(values: Map<number, number>): Map<number, number> {
    const maxValue = Math.max(...values.values());
    const minValue = Math.min(...values.values());
    const range = maxValue - minValue;
    const normalized = new Map<number, number>();
    values.forEach((value, id) => {
      normalized.set(id, (value - minValue) / range); // Normalize by dividing by the max degree
    });
    return normalized;
  }

  private normalizeLogarithmically(values: Map<number, number>): Map<number, number> {
    const logMaxValue = Math.log1p(Math.max(...values.values()));
    const logMinValue = Math.log1p(Math.min(...values.values()));
    const range = logMaxValue - logMinValue;
    const normalized = new Map<number, number>();
    values.forEach((value, id) => {
      normalized.set(id, (Math.log1p(value) - logMinValue) / range); // Normalize by dividing by the max degree
    });
    return normalized;
  }

  private normalizeSqrt(values: Map<number, number>): Map<number, number> {
    const sqrtMaxValue = Math.sqrt(Math.max(...values.values()));
    const sqrtMinValue = Math.sqrt(Math.min(...values.values()));
    const range = sqrtMaxValue - sqrtMinValue;
    const normalized = new Map<number, number>();
    values.forEach((value, id) => {
      normalized.set(id, (Math.sqrt(value) - sqrtMinValue) / range); // Normalize by dividing by the max degree
    });
    return normalized;
  }

  private setupRadialScale(innerRadius: number): d3.ScaleLinear<number, number> {
    const padding = window.innerWidth/100*0.2;
    return d3.scaleLinear()
      .domain([0, 1])  // Normalized degree
      .range([innerRadius - padding, 10]);
  }

  private calculateRadiusForNode(value: number, innerRadius: number): number {
    
    const minRadius =0.2 * window.innerWidth/100; // Minimum radius for the least connected node
    const maxRadius =window.innerWidth/100; // Maximum radius for the most connected node
    const calculatedRadius = minRadius + (maxRadius - minRadius) * value;
  
    return calculatedRadius;
  }
  
  private calculateCollisionRadius(size: number): number {
    const baseRadius = size; // Use the visual radius function
    const padding = 2; // Additional padding to prevent visual overlaps
    return baseRadius + padding;
  }

  private calculateNodeDegreesForClusters(): void {
    this.intraCommunityEdges.forEach((relationships, clusterId) => {
      const degreeMap = new Map<number, number>();
      relationships.forEach(rel => {
        degreeMap.set(rel.startId, (degreeMap.get(rel.startId) || 0) + 1);
        degreeMap.set(rel.endId, (degreeMap.get(rel.endId) || 0) + 1);
      });
      const normalizedDegrees = this.normalizeLinear(degreeMap);
      this.degreesMap[clusterId] = normalizedDegrees;
    });
    
  }

  


  

}
