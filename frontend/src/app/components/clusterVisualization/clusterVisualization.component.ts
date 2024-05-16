import { Component, OnInit } from '@angular/core';
import { Artist, ArtistNode, ClusterNode } from '../../models/artist';
import exhibited_with from '../../models/exhibited_with';
import { Subscription } from 'rxjs';
import * as d3 from 'd3';
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

  public isLoading: boolean = true;
  // Data from backend
  private clusters: Artist[][] = [];
  private intraCommunityEdges: exhibited_with[][] = [];
  private interCommunityEdges: InterCommunityEdge[] = [];
  private clusterNodes: ClusterNode[] = [];

  // User Interactions
  private subscriptions: Subscription = new Subscription();

  // SVG properties
  private svg: any;
  private g: any; // Group for zooming
  private margin = 50;
  private baseWidth = 2000 - (this.margin * 2);
  private baseHeight = 2000 - (this.margin * 2);
  private minClusterRadius = 200; // Minimum radius for each cluster

  // Create a color scale
  private edgeColorScale = d3.scaleSequential(d3.interpolateGreys) // You can use any color scale you prefer
    .domain([0, 1]); // Adjust the domain based on your normalized values range

  // For selections
  private degreesMap: { [clusterId: number]: Map<number, number> } = {};
  private totalExhibitionsMap: Map<number, number> = new Map<number, number>();
  private totalExhibitedArtworksMap: Map<number, number> = new Map<number, number>();
  private differentTechniquesMap: Map<number, number> = new Map<number, number>();

  // Sunburst Properties
  private sunburstThickness: number = 50;

  // Inner order selection
  private regionOrder: string[] = ["North Europe", "Eastern Europe", "Central Europe", "Southern Europe", "Western Europe", "Others"];

  // Network Properties
  private selectedNode: [SVGCircleElement, string] | null = null;
  private selectedCluster: any = null;

  // Forces in the clusters
  private simulation: d3.Simulation<ArtistNode, undefined> | null = null;

  // Forces between the clusters
  private clusterSimulation: d3.Simulation<ClusterNode, undefined> | null = d3.forceSimulation<ClusterNode>();

  private countryIndexMap = new Map<string, number>();
  private globalColorScale: d3.ScaleSequential<string, number> = d3.scaleSequential(d3.interpolateSpectral); // Default color scale

  private clusterCountryCentroids: { [clusterId: number]: { [country: string]: { startAngle: number, endAngle: number, middleAngle: number, color: string | number, country: string } } } = {};
  
  constructor(private decisionService: DecisionService, 
    private artistService: ArtistService,
    private selectionService: SelectionService) {
       // Bind the method
    //this.handleNodeClick = this.handleNodeClick.bind(this);
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
    this.subscriptions.add(this.decisionService.currentRange.subscribe(range => {
      this.updateArtists(range);
    }));

    this.subscriptions.add(this.decisionService.currentK.subscribe(k => {
      this.updateCluster(k);
    }));
  }

  updateVisualization(type: string, value: any) {
    console.log(type, value);
  }

  updateArtists(range: any) {
    console.log(range);
  }

  updateCluster(k: number) {
    console.log(k);
    const range = this.decisionService.getDecisionRange();
    if(range[0].length !== 0){
      console.log('range:', range)
      console.log('k value:', k)
      this.isLoading = true;
      this.artistService.clusterAmountArtistsNationality(range[0], k).subscribe((data) => {
      const clusters = data[0];
      const intraCommunityEdges = data[1] as exhibited_with[][];
      const interCommunityEdges = data[2] as exhibited_with[];
      console.log('k data', data)
      this.loadNewData(clusters, intraCommunityEdges, interCommunityEdges);

    }, error => {
      console.error('There was an error', error);
      this.isLoading = false;
    });
      
    
    }
  }
loadNewData(clusters: Artist[][], intraCommunityEdges: exhibited_with[][], interCommunityEdges: exhibited_with[]){
  this.svg.selectAll("*").remove();
  this.clusters = clusters;
  this.intraCommunityEdges = intraCommunityEdges;
  this.interCommunityEdges = interCommunityEdges.map(edge => ({
    source: edge.startId,
    target: edge.endId,
    sharedExhibitionMinArtworks: edge.sharedExhibitionMinArtworks
  }));
  let allArtists:Artist[]= [];
  this.clusters.forEach(cluster => {;
    allArtists.push(...cluster);
  });
  this.selectedCluster = allArtists;
  this.selectionService.selectArtist(this.selectedCluster);

  // Calculate degrees for each cluster
  this.calculateNodeDegreesForClusters();

  // Call createGlobalColorScale after clusters are initialized
  this.globalColorScale = this.createGlobalColorScale();

  this.renderClusters(); // Render clusters first
  this.renderInterCommunityEdges(); // Render inter-community edges next

  this.isLoading = false;
 

}
  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  
  private loadInitialData() {
   
    // Fetch data from backend
    this.artistService.clusterAmountArtistsNationality([200, 400], 5)
      .subscribe(data => {
        console.log(data);
        this.clusters = data[0];
        
        this.intraCommunityEdges = data[1] as exhibited_with[][];
        const interCommunityEdgesRaw = data[2] as exhibited_with[];
        console.log('intercommunity edges:', interCommunityEdgesRaw);
        this.interCommunityEdges = interCommunityEdgesRaw.map(edge => ({
          source: edge.startId,
          target: edge.endId,
          sharedExhibitionMinArtworks: edge.sharedExhibitionMinArtworks
        }));

        let allArtists:Artist[]= [];
        this.clusters.forEach(cluster => {;
          allArtists.push(...cluster);
        });
        this.selectedCluster = allArtists;
        this.isLoading = false;
        this.selectionService.selectArtist(this.selectedCluster);

        // Calculate degrees for each cluster
        this.calculateNodeDegreesForClusters();

        // Call createGlobalColorScale after clusters are initialized
        this.globalColorScale = this.createGlobalColorScale();

        this.initializeVisualization();

        this.isLoading = false;
      }, error => {
        console.error('There was an error', error);
        this.isLoading = false;
      });
  }

  private initializeVisualization() {
    this.createSvg();
    this.renderClusters(); // Render clusters first
    this.renderInterCommunityEdges(); // Render inter-community edges next
  }

  private createSvg(): void {
    const zoom: d3.ZoomBehavior<Element, unknown> = d3.zoom<Element, unknown>()
      .scaleExtent([0.1, 10])
      .on('zoom', (event: any) => {
        this.g.attr('transform', event.transform);
      });
  
    // Calculate the dimensions based on the number of clusters
    const dimensions = this.calculateSvgDimensions(this.clusters.length);
    this.baseWidth = dimensions.width;
    this.baseHeight = dimensions.height;
  
    this.svg = d3.select("figure#network")
      .append("svg")
      .attr("width", this.baseWidth + (this.margin * 2))
      .attr("height", this.baseHeight + (this.margin * 2))
      .call(zoom as any) // Cast to any to resolve type issue
      .append("g")
      .attr("transform", `translate(${this.baseWidth / 2 + this.margin}, ${this.baseHeight / 2 + this.margin})`);
  
    this.g = this.svg.append('g');
  
    // Add a group for clusters
    this.g.append('g')
      .attr('class', 'clusters');
  
    // Add a group for inter-community edges
    this.g.append('g')
      .attr('class', 'inter-community-edges');
  
    // Debug: Log the SVG element to ensure it is created correctly
    console.log("SVG element created:", this.svg);
  }
  
  private calculateSvgDimensions(numClusters: number): { width: number, height: number } {
    const clustersPerRow = Math.ceil(Math.sqrt(numClusters));
    const clusterSpacing = this.minClusterRadius * 2;
    const width = clustersPerRow * clusterSpacing;
    const height = clustersPerRow * clusterSpacing;
    return { width, height };
  }
  
  private renderClusters(): void {
    const maxSize = Math.max(...this.clusters.map(cluster => cluster.length));

    const clusterNodes: ClusterNode[] = this.clusters.map((cluster, index) => {
      const [outerRadius, innerRadius] = this.createSunburstProperties(cluster.length, maxSize);
      return {
        clusterId: index,
        artists: cluster,
        outerRadius: outerRadius,
        innerRadius: innerRadius,
        x: Math.random() * this.baseWidth - this.baseWidth / 2,
        y: Math.random() * this.baseHeight - this.baseWidth / 2
      };
    });

    // Debug: Log the initial cluster nodes to ensure they have correct properties
    console.log("Initial cluster nodes:", clusterNodes);

    const clusterGroups = clusterNodes.map(clusterNode => this.createClusterGroup(clusterNode));

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
    // Simulate the clusters
    this.simulateClusters(clusterNodes);
  }
private findClusterNodeById(id: number): number {
    return this.clusterNodes.findIndex(clusterNode => clusterNode.clusterId === id)!;
}

private simulateClusters(clusterNodes: ClusterNode[]): void {
  // Convert interCommunityEdges to the format required by d3.forceLink
  const links: InterCommunityEdge[] = this.interCommunityEdges;

  // Define a scale to adjust the link distance based on shared exhibitions
  const linkDistanceScale = d3.scaleLinear()
    .domain(d3.extent(links, d => d.sharedExhibitionMinArtworks) as [number, number])
    .range([50, 300]); // Adjust these values as needed for your visualization

  this.clusterSimulation = d3.forceSimulation<ClusterNode>(clusterNodes)
    .force("collision", d3.forceCollide<ClusterNode>().radius(d => d.outerRadius)) // Increase padding
    .force("link", d3.forceLink<ClusterNode, InterCommunityEdge>(links)
      .id(d => d.clusterId)
      .distance(d => linkDistanceScale(d.sharedExhibitionMinArtworks))
    )
    .force("x", d3.forceX(0).strength(0.2)) // Increase the strength
    .force("y", d3.forceY(0).strength(0.2)) // Increase the strength
    .on("tick", () => this.ticked());

  // Debug: Log the cluster simulation setup
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

private createClusterGroup(clusterNode: ClusterNode): SVGGElement {
  const arcGenerator = d3.arc<any>()
    .innerRadius(clusterNode.innerRadius)
    .outerRadius(clusterNode.outerRadius);

  const countryMap = new Map<string, Artist[]>();
  const sortedArtists: Artist[] = this.prepareData(clusterNode.artists);
  sortedArtists.forEach(artist => {
    if (!countryMap.has(artist.nationality)) {
      countryMap.set(artist.nationality, []);
    }
    countryMap.get(artist.nationality)!.push(artist);
  });

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
      color: this.globalColorScale(countryIndex) // Get color from ordinal scale
    };
  });

  // Create a new group for this cluster
  const clusterGroup = d3.create("svg:g")
    .attr("class", "cluster")
    .attr("transform", `translate(${clusterNode.x}, ${clusterNode.y})`);

  // Append a background circle for the cluster
  clusterGroup.append("circle")
    .attr("class", "cluster-background")
    .attr("r", clusterNode.outerRadius)
    .style("fill", "none") // No fill color
    .style("stroke", "#ccc") // Light gray stroke for the background circle
    .style("stroke-width", 1); // Adjust stroke width as needed

  // Append paths for the sunburst
  clusterGroup.selectAll("path")
    .data(data)
    .enter()
    .append("path")
    .attr("d", arcGenerator)
    .attr("fill", (d: any) => d.color);

  // Append labels for the countries
  clusterGroup.selectAll("text")
    .data(data)
    .enter()
    .append("text")
    .attr("transform", (d: any) => `translate(${arcGenerator.centroid(d)})`)
    .attr("text-anchor", "middle")
    .text((d: any) => d.country);

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
  this.createArtistNetwork(clusterGroup, clusterNode, countryCentroids);

  return clusterGroup.node() as SVGGElement;
}


  private createArtistNetwork(clusterGroup: any, cluster: ClusterNode, countryCentroids: { [country: string]: { startAngle: number, endAngle: number, middleAngle: number, color: string | number, country: string } }): void {
    const artists = cluster.artists;
    const relationships = this.intraCommunityEdges[cluster.clusterId];
    const degreeMap = this.degreesMap[cluster.clusterId] || new Map<number, number>();
  
    // Define the central position of the cluster
    const centerX = 0;
    const centerY = 0;
  
    const artistNodes: ArtistNode[] = artists.map((artist: Artist) => {
      const countryData = countryCentroids[artist.nationality];
      const degree = degreeMap.get(artist.id) || 0;
      const radialScale = this.setupRadialScale(cluster.innerRadius);
      const radial = radialScale(degree);
      const angle = countryData.middleAngle;
      const x = centerX + radial * Math.sin(angle);
      const y = centerY - radial * Math.cos(angle);
      const countryIndex = this.countryIndexMap.get(artist.nationality) as number;
      return {
        id: artist.id,
        artist: artist,
        x: x,
        y: y,
        vx: 0,
        vy: 0,
        angle: angle,
        radius: this.calculateRadiusForNode(degree, cluster.innerRadius),
        color: this.globalColorScale(countryIndex),
        countryData: countryData
      };
    });
  
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
      .style('stroke', (d: any) => this.edgeColorScale(d.sharedExhibitionMinArtworks))
      .style('stroke-width', 2)
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


    const simulation = d3.forceSimulation(artistNodes)
    .force("collision", d3.forceCollide((d: any) => this.calculateCollisionRadius(sizes[d.id] || 0)))
    .force("boundary", this.boundaryForce(artistNodes, cluster.innerRadius - 10)) // Add boundary force
    .on("tick", () => {
      this.svg.selectAll('.node')
        .attr('cx', (d: any) => d.x)
        .attr('cy', (d: any) => d.y);
      edges
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);
    });
  simulation.alpha(1).restart();

 
  }
  
  
  
  // Helper methods


    private calculateOuterRadiusPoint(cluster: ClusterNode, angle: number): { x: number, y: number } {
      let x = 0;
      let y = 0;
      if (cluster.x !== undefined && cluster.y !== undefined) {
        x = cluster.x + cluster.outerRadius * Math.cos(angle);
        y = cluster.y + cluster.outerRadius * Math.sin(angle);
      }
      
      return { x, y };
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
  private prepareData(artists: Artist[]): Artist[] {
    const regionMap = new Map<string, any[]>();

    // Initialize regions in the map to preserve order
    this.regionOrder.forEach(region => {
      regionMap.set(region, []);
    });

    artists.forEach(artist => {
      let regionArtists = regionMap.get(artist.europeanRegionNationality);
      if (regionArtists) {
        regionArtists.push(artist);
      }
    });

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
  
    // Calculate the proportional radius based on cluster size
    const outerRadius = minRadius + ((maxRadius - minRadius) * (clusterSize / maxSize));
    const innerRadius = outerRadius - this.sunburstThickness;
  
    return [outerRadius, innerRadius];
  }
  
  
  private getClusterGroupDimensions(clusterGroup: any): { width: number, height: number } {
    const bbox = clusterGroup.node().getBBox();
    return { width: bbox.width, height: bbox.height };
  }
  
  
  // Define the boundary force
private boundaryForce(artistNodes: ArtistNode[], innerRadius: number, padding: number = 10): (alpha: number) => void {
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


  private createGlobalColorScale(): d3.ScaleSequential<string, number> {
    const allCountries = new Set<string>();
    this.clusters.forEach(cluster => {
      cluster.forEach(artist => {
        allCountries.add(artist.nationality); // Assuming nationality as the country key
      });
    });
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
    return d3.scaleLinear()
      .domain([0, 1])  // Normalized degree
      .range([innerRadius - 10, 10]);
  }

  private calculateRadiusForNode(value: number, innerRadius: number): number {
    const minRadius =10; // Minimum radius for the least connected node
    const maxRadius = innerRadius / 10; // Maximum radius for the most connected node
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
