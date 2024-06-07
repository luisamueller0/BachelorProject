import { Component, OnInit, ViewChild, ElementRef, OnChanges, OnDestroy, HostListener } from '@angular/core';
import * as d3 from 'd3';
import { Subscription } from 'rxjs';
import { SelectionService } from '../../services/selection.service';
import { DecisionService } from '../../services/decision.service';
import { ArtistService } from '../../services/artist.service';
import { Artist, ArtistNode, ClusterNode } from '../../models/artist';
import exhibited_with from '../../models/exhibited_with';

interface InterCommunityEdge extends d3.SimulationLinkDatum<ClusterNode> {
  source: number | ClusterNode;
  target: number | ClusterNode;
  sharedExhibitionMinArtworks: number;
}
@Component({
  selector: 'app-smallMultiples',
  templateUrl: './smallMultiples.component.html',
  styleUrls: ['./smallMultiples.component.css']
})
export class SmallMultiplesComponent implements OnInit, OnChanges, OnDestroy {
  @ViewChild('matrix', { static: true }) private chartContainer!: ElementRef;
  public isLoading: boolean = true;
  private firstK: number = -1;
  private isIniatialized: boolean = false;

  private svg: any;
  private contentWidth: number = 0;
  private contentHeight: number = 0;
  private margin = {
    top: 2,
    right: 2,
    bottom: 5,
    left: 4
  };


  private clusters: Artist[][] = [];
  private intraCommunityEdges: exhibited_with[][] = [];
  private interCommunityEdges: InterCommunityEdge[] = [];
  private clusterNodes: ClusterNode[] = [];
  public allArtists: Artist[] = [];
  private artistClusterMap: Map<number, ClusterNode> = new Map<number, ClusterNode>();
  private artistNodes: ArtistNode[][] = [];
  private selectedClusterNode: ClusterNode | null = null;
  private allCountries: string[] = [];
  private g: any; // Group for zooming

  private subscriptions: Subscription = new Subscription();

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



  constructor(
    private selectionService: SelectionService,
    private decisionService: DecisionService,
    private artistService: ArtistService
  ) {
    //this.handleNodeClick = this.handleNodeClick.bind(this);
  }

  ngOnInit(): void {
    //default data
    this.createChart();

    this.subscriptions.add(this.decisionService.currentSize.subscribe(size => {
      this.updateNodeSize(size);
    }));

    this.subscriptions.add(this.decisionService.currentK.subscribe(k => {
      this.updateCluster(k);
    }));
    this.subscriptions.add(this.decisionService.currentSearchedArtistId.subscribe((id:number|null) => this.highlightArtistNode(id)));



    window.addEventListener('resize', this.onResize.bind(this));
  }

  ngOnChanges(): void {
    this.visualizeData();
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
    this.visualizeData();
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
  private calculateNodeRadius(artistId: number, normalizedMap: Map<number, number>, innerRadius: number): number {
    const normalizedValue = normalizedMap.get(artistId) || 0;
    return this.calculateRadiusForNode(normalizedValue, innerRadius);
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

this.visualizeData();
    

  }


  private updateNetwork(): void {
    if (!this.chartContainer) return;
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
  private createChart(): void {
    
    // Fetch data from backend
    this.artistService.clusterAmountArtists([200, 2217], 7)
      .subscribe(data => {
    
        this.clusters = data[0];
        this.clusters.forEach((cluster, clusterIndex) => {
          console.log('Cluster ', clusterIndex, ':')
          cluster.forEach(artist => {
            console.log(artist.firstname, artist.lastname, clusterIndex)
          });
        });
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

        this.selectionService.selectCountries(this.allCountries);

        // Calculate degrees for each cluster
        this.calculateNodeDegreesForClusters();

       this.visualizeData();
      }, error => {
        console.error('There was an error', error);
        this.isLoading = false;
      });
   
  }


  private visualizeData(): void {
    this.isLoading = true;
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
      .attr('viewBox', `0 0 ${element.offsetWidth} ${element.offsetHeight}`);
  
    this.g = this.svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);
  
    this.contentWidth = width;
    this.contentHeight = height;
  
    // Add zoom functionality with limited scale extent
    const zoom = d3.zoom()
      .scaleExtent([1, 10]) // Only allow zooming in, starting from default scale (1)
      .on("zoom", (event) => {
        this.g.attr("transform", event.transform);
      });
  
    this.svg.call(zoom);
  
    // Set initial transform to ensure default overview
    this.svg.call(zoom.transform, d3.zoomIdentity);
  }
  

  private drawMatrix(): void {
    const xData = d3.range(1, 8); // Numbers 1 to 7
    const yData = ['nationality', 'birthcountry', 'deathcountry', 'mostexhibited']; // The desired categories
  
    const cellWidth = this.contentWidth / xData.length;
    const cellHeight = this.contentHeight / yData.length;
  
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
    const cells = this.svg.selectAll("g.cell")
      .data(yData.flatMap(y => xData.map(x => ({ x, y }))))
      .enter()
      .append("g")
      .attr("class", "cell")
      .attr("transform", (d: any) => `translate(${xScale(String(d.x))},${yScale(d.y)})`);
  
    cells.each((d: any, i: number, nodes: any) => {
      console.log(`Drawing cell for cluster ${d.x} and category ${d.y}`);
      this.drawClusterInCell(d3.select(nodes[i]), d.x, d.y, cellWidth, cellHeight);
    });
  }
  
  private drawClusterInCell(cell: any, x: number, y: string, cellWidth: number, cellHeight: number): void {
    const clusterIndex = x - 1; // Adjust cluster index to match your data structure
    const cluster = this.clusters[clusterIndex];
    if (!cluster) {
      console.log(`No cluster data for index ${clusterIndex}`);
      return;
    }
  
    console.log(`Drawing cluster ${clusterIndex} in cell for category ${y}`);
  
    const cellSize = Math.min(cellWidth, cellHeight);
    const [outerRadius, innerRadius] = this.createSunburstProperties(cluster.length, this.clusters[0].length, cellSize);
    const clusterNode: ClusterNode = {
      clusterId: clusterIndex,
      artists: cluster,
      outerRadius: outerRadius,
      innerRadius: innerRadius,
      x: 0,
      y: 0,
      meanAvgDate: new Date(),
      meanBirthDate: new Date(),
      totalExhibitedArtworks: 0
    };
  
    const clusterGroup = this.createClusterGroup(clusterNode, y);
    console.log('Cluster group created:', clusterGroup);
    cell.node().appendChild(clusterGroup);
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

    const countries = Array.from(countryMap.keys());
    const totalArtists = clusterNode.artists.length;
    const minimumAngle = Math.PI / 18;

    let totalAngleAvailable = 2 * Math.PI;
    const dynamicAngles = new Map<string, number>();

    countryMap.forEach((artists, country) => {
      dynamicAngles.set(country, minimumAngle);
      totalAngleAvailable -= minimumAngle;
    });

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
      return {
        country,
        startAngle,
        endAngle,
        middleAngle,
        innerRadius: clusterNode.innerRadius,
        outerRadius: clusterNode.outerRadius,
        color: this.artistService.getCountryColor(country, 1)
      };
    });

    const clusterGroup = d3.create("svg:g")
      .attr("class", `cluster cluster-${clusterNode.clusterId}`)
      .attr("transform", `translate(${this.contentWidth / 14}, ${this.contentHeight / 8})`);

    clusterGroup.selectAll("path")
      .data(data)
      .enter()
      .append("path")
      .attr("d", arcGenerator)
      .attr("fill", (d: any) => d.color)
      .style('stroke', 'black');

    clusterGroup.selectAll("text")
      .data(data)
      .enter()
      .append("text")
      .attr("transform", (d: any) => `translate(${arcGenerator.centroid(d)})`)
      .attr("text-anchor", "middle")
      .text((d: any) => d.country)
      .style("font-weight", "bold")
      .style("fill", "white")
     

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

    this.createArtistNetwork(value, clusterGroup, clusterNode, countryCentroids);

    return clusterGroup.node() as SVGGElement;
  }

  private createArtistNetwork(value: string, clusterGroup: any, cluster: ClusterNode, countryCentroids: { [country: string]: { startAngle: number, endAngle: number, middleAngle: number, color: string | number, country: string } }): void {
    const artists = cluster.artists;
    const relationships = this.intraCommunityEdges[cluster.clusterId];
    const size = this.decisionService.getDecisionSize();
  
    const metricMap = this.calculateNormalizedMaps(size)[cluster.clusterId];
    const degreeMap = this.degreesMap[cluster.clusterId] || new Map<number, number>();
  
    const centerX = 0;
    const centerY = 0;
  
    let artistNodes: any[] = this.createArtistNodes(artists, countryCentroids, degreeMap, metricMap, cluster, centerX, centerY, value);
  
    const getNodeIndexById = (id: number) => artistNodes.findIndex((node: any) => node.id === id);
  
    const sharedExhibitionMinArtworksValues = relationships.map((relationship: any) => relationship.sharedExhibitionMinArtworks);
    const normalizedSharedExhibitionMinArtworks = this.normalizeLogarithmically(new Map(sharedExhibitionMinArtworksValues.map((value, index) => [index, value])));
    const formattedRelationships = relationships.map((relationship: any, index: number) => {
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
        const clusterId = cluster.clusterId;
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
      });
  
    const sizes = this.getNodeSize(clusterGroup);
    const padding = window.innerWidth / 100 * 0.2;
  
    const centralNode = artistNodes.reduce((maxNode, node) => {
      const degree = degreeMap.get(node.artist.id) || 0;
      return degree > (degreeMap.get(maxNode.artist.id) || 0) ? node : maxNode;
    }, artistNodes[0]);
  
    const simulation = d3.forceSimulation(artistNodes)
      .force("collision", d3.forceCollide((d: any) => {
        if (d.id === centralNode.id) {
          return 0;
        }
        return this.calculateCollisionRadius(sizes[d.id] || 0);
      }))
      .force("repelFromCenter", this.repelFromCenterForce(artistNodes, centralNode, sizes[centralNode.id] || 0, 2))
      .force("boundary", this.boundaryForce(artistNodes, cluster.innerRadius - padding))
      .on("tick", () => {
        circles
          .attr('cx', (d: any) => d.x)
          .attr('cy', (d: any) => d.y);
        edges
          .attr("x1", (d: any) => d.source.x)
          .attr("y1", (d: any) => d.source.y)
          .attr("x2", (d: any) => d.target.x)
          .attr("y2", (d: any) => d.target.y);
      });
  
    simulation.nodes(artistNodes);
  }

  private prepareData(artists: Artist[], value: string): Artist[] {
    const regionMap = new Map<string, any[]>();
    this.regionOrder.forEach(region => {
      regionMap.set(region, []);
    });

    if (value === 'nationality') {
      artists.forEach(artist => {
        let regionArtists = regionMap.get(artist.europeanRegionNationality);
        if (regionArtists) {
          regionArtists.push(artist);
        }
      });
    } else if (value === 'birthcountry') {
      artists.forEach(artist => {
        let regionArtists = regionMap.get(artist.europeanRegionBirth);
        if (regionArtists) {
          regionArtists.push(artist);
        }
      });
    } else if (value === 'deathcountry') {
      artists.forEach(artist => {
        let regionArtists = regionMap.get(artist.europeanRegionDeath);
        if (regionArtists) {
          regionArtists.push(artist);
        }
      });
    } else if (value === 'mostexhibited') {
      artists.forEach(artist => {
        let regionArtists = regionMap.get(artist.europeanRegionMostExhibited);
        if (regionArtists) {
          regionArtists.push(artist);
        }
      });
    }

    const sortedArtists = Array.from(regionMap.entries())
      .filter(([region, artists]) => artists.length > 0)
      .flatMap(([region, artists]) => artists);

    return sortedArtists;
  }

  private createSunburstProperties(clusterSize: number, maxSize: number, cellSize: number): [number, number] {
    const minRadius = cellSize / 2
    const maxRadius = cellSize / 2; // Adjust max radius to fit within cells
  
    const outerRadius = minRadius + ((maxRadius - minRadius) * (clusterSize / maxSize));
    const innerRadius = outerRadius - 5; // Reduced thickness for small cells
  
    return [outerRadius, innerRadius];
  }
  
  

  private createColorScale(countries: string[]): d3.ScaleSequential<string, number> {
    const colorScale = d3.scaleSequential(d3.interpolateWarm)
      .domain([0, countries.length - 1]);

    return colorScale;
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
        this.calculateNodeDegreesForClusters();
        metricMap = this.degreesMap[clusterId];
      }
      normalizedMaps[clusterId] = this.normalizeLinear(metricMap);
    });
    return normalizedMaps;
  }

  private normalizeLinear(values: Map<number, number>): Map<number, number> {
    const maxValue = Math.max(...values.values());
    const minValue = Math.min(...values.values());
    const range = maxValue - minValue;
    const normalized = new Map<number, number>();
    values.forEach((value, id) => {
      normalized.set(id, (value - minValue) / range);
    });
    return normalized;
  }

  private normalizeLogarithmically(values: Map<number, number>): Map<number, number> {
    const logMaxValue = Math.log1p(Math.max(...values.values()));
    const logMinValue = Math.log1p(Math.min(...values.values()));
    const range = logMaxValue - logMinValue;
    const normalized = new Map<number, number>();
    values.forEach((value, id) => {
      normalized.set(id, (Math.log1p(value) - logMinValue) / range);
    });
    return normalized;
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

  private getNodeSize(clusterGroup: any): number[] {
    const circles = clusterGroup.selectAll('.artist-node');
    const sizes: number[] = [];
    circles.each(function (this: any, d: any) {
      const radius = parseFloat(d3.select(this).attr('r'));
      sizes[d.id] = radius;
    });
    return sizes;
  }

  private calculateCollisionRadius(size: number): number {
    const baseRadius = size;
    const padding = 2;
    return baseRadius + padding;
  }

  private repelFromCenterForce(artistNodes: any[], centralNode: any, radius: number, padding: number = 5): (alpha: number) => void {
    return function (alpha: number) {
      centralNode.x = 0;
      centralNode.y = 0;
      artistNodes.forEach((d: any) => {
        if (d !== centralNode && d.y !== undefined && d.x !== undefined && centralNode.x !== undefined && centralNode.y !== undefined) {
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

  private boundaryForce(artistNodes: any[], innerRadius: number): (alpha: number) => void {
    const padding = window.innerWidth / 100 * 0.2;
    return function (alpha: number) {
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

  private createArtistNodes(artists: Artist[], countryCentroids: any, degreeMap: Map<number, number>, metricMap: Map<number, number>, cluster: ClusterNode, centerX: number, centerY: number, value: string): any[] {
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
      const newPos = this.calculateNewPosition(value, artist, countryData, degreeMap, metricMap, cluster, centerX, centerY);
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

  private calculateNewPosition(type: string, artist: Artist, countryData: any, degreeMap: Map<number, number>, metricMap: Map<number, number>, cluster: ClusterNode, centerX: number, centerY: number): { x: number, y: number, radius: number, color: string | number } {
    const degree = degreeMap.get(artist.id) || 0;
    const radialScale = this.setupRadialScale(cluster.innerRadius);
    const radial = radialScale(degree);
    const nodeRadius = metricMap.get(artist.id) || 0;
    const angle = countryData.middleAngle;
    const x = centerX + radial * Math.sin(angle);
    const y = centerY - radial * Math.cos(angle);
    return {
      x: x,
      y: y,
      radius: this.calculateRadiusForNode(nodeRadius, cluster.innerRadius),
      color: this.artistService.getCountryColor(countryData.country, 1)
    };
  }

  private setupRadialScale(innerRadius: number): d3.ScaleLinear<number, number> {
    const padding = window.innerWidth / 100 * 0.2;
    return d3.scaleLinear()
      .domain([0, 1])
      .range([innerRadius - padding, 10]);
  }

  private calculateRadiusForNode(value: number, innerRadius: number): number {
    const minRadius = 0.2 * window.innerWidth / 100;
    const maxRadius = window.innerWidth / 100;
    const calculatedRadius = minRadius + (maxRadius - minRadius) * value;
    return calculatedRadius;
  }
}
