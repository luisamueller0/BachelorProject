import { Component, OnInit } from '@angular/core';
import { Artist, ArtistNode, ClusterNode } from '../../models/artist';
import exhibited_with from '../../models/exhibited_with';
import { Subscription } from 'rxjs';
import * as d3 from 'd3';
import { DecisionService } from '../../services/decision.service';
import { ArtistService } from '../../services/artist.service';

@Component({
  selector: 'app-clusterVisualization',
  templateUrl: './clusterVisualization.component.html',
  styleUrls: ['./clusterVisualization.component.css']
})
export class ClusterVisualizationComponent implements OnInit {

  private isLoading: boolean = true;
  // Data from backend
  private clusters: Artist[][] = [];
  private intraCommunityEdges: exhibited_with[][] = [];
  private interCommunityEdges: exhibited_with[] = [];

  // User Interactions
  private subscriptions: Subscription = new Subscription();

  // SVG properties
  private svg: any;
  private g: any; // Group for zooming
  private margin = 50;
  private width = 2000 - (this.margin * 2);
  private height = 2000 - (this.margin * 2);

  // For selections
  private degreesMap: Map<number, number> = new Map<number, number>();
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

  constructor(private decisionService: DecisionService,
              private artistService: ArtistService) { }

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
  }

  private loadInitialData() {
    // Fetch data from backend
    this.artistService.clusterAmountArtistsNationality([300, 400], 2)
      .subscribe(data => {
        console.log(data)
        this.clusters = data[0];
        this.intraCommunityEdges = data[1] as exhibited_with[][];
        this.interCommunityEdges = data[2] as exhibited_with[];
        console.log('intercommunity edge:', this.interCommunityEdges[0])
        console.log(this.clusters, this.intraCommunityEdges, this.interCommunityEdges)

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
    this.renderClusters();
  }

  private createSvg(): void {
    const zoom: d3.ZoomBehavior<Element, unknown> = d3.zoom<Element, unknown>()
    .scaleExtent([0.1, 10])
    .on('zoom', (event: any) => {
      this.g.attr('transform', event.transform);
    });

  this.svg = d3.select("figure#network")
    .append("svg")
    .attr("width", this.width + (this.margin * 2))
    .attr("height", this.height + (this.margin * 2))
    .call(zoom as any) // Cast to any to resolve type issue
    .append("g")
    .attr("transform", `translate(${this.width / 2 + this.margin}, ${this.height / 2 + this.margin})`);

 
    this.g = this.svg.append('g');
    // Debug: Log the SVG element to ensure it is created correctly
    console.log("SVG element created:", this.svg);
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
        x: Math.random() * this.width - this.width / 2,
        y: Math.random() * this.height - this.height / 2
      };
    });

    // Debug: Log the initial cluster nodes to ensure they have correct properties
    console.log("Initial cluster nodes:", clusterNodes);

    const clusterGroups = clusterNodes.map(clusterNode => this.createSunburst(clusterNode));

    // Bind the data to the cluster elements using d3.join()
    this.g.selectAll(".cluster")
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

    // Render edges between clusters
    this.renderInterCommunityEdges(clusterNodes);

    // Simulate the clusters
    this.simulateClusters(clusterNodes);
  }

  private renderInterCommunityEdges(clusterNodes: ClusterNode[]): void {
    const edgeScale = d3.scaleLinear()
      .domain(d3.extent(this.interCommunityEdges, d => d.sharedExhibitionMinArtworks) as [number, number])
      .range([1, 10]); // Adjust range as needed for stroke width
    console.log(this.interCommunityEdges[0])
    this.g.selectAll(".inter-community-edge")
      .data(this.interCommunityEdges)
      .enter()
      .append("line")
      .attr("class", "inter-community-edge")
      .style("stroke", 'black')
      .style("stroke-width", (d: any) => edgeScale(d.sharedExhibitionMinArtworks))
      .attr("x1", (d: any) => this.findClusterNodeById(clusterNodes, d.startId).x)
      .attr("y1", (d: any) => this.findClusterNodeById(clusterNodes, d.startId).y)
      .attr("x2", (d: any) => this.findClusterNodeById(clusterNodes, d.endId).x)
      .attr("y2", (d: any) => this.findClusterNodeById(clusterNodes, d.endId).y);
  }

  private findClusterNodeById(clusterNodes: ClusterNode[], id: number): ClusterNode {
    return clusterNodes.find(clusterNode => clusterNode.clusterId === id)!;
  }

  private simulateClusters(clusterNodes: ClusterNode[]): void {
    this.clusterSimulation = d3.forceSimulation(clusterNodes)
      .force("collision", d3.forceCollide<ClusterNode>().radius(d => d.outerRadius + 20)) // Increase padding
      .force("x", d3.forceX(0).strength(0.2)) // Increase the strength
      .force("y", d3.forceY(0).strength(0.2)) // Increase the strength
      .on("tick", () => this.ticked());

    // Debug: Log the cluster simulation setup
    console.log("Cluster simulation setup:", this.clusterSimulation);
  }

  private ticked(): void {
    const clusterNodes = this.clusterSimulation!.nodes() as ClusterNode[];

    // Debug: Log the cluster nodes during the tick to check their properties
    console.log("Cluster nodes during tick:", clusterNodes);

    this.g.selectAll(".cluster")
      .attr("transform", (d: ClusterNode) => {
        // Debug: Log each cluster node's position
        console.log("Cluster node position:", d.x, d.y);
        return `translate(${d.x}, ${d.y})`;
      });

    this.g.selectAll(".inter-community-edge")
      .attr("x1", (d: any) => this.findClusterNodeById(clusterNodes, d.startId).x)
      .attr("y1", (d: any) => this.findClusterNodeById(clusterNodes, d.startId).y)
      .attr("x2", (d: any) => this.findClusterNodeById(clusterNodes, d.endId).x)
      .attr("y2", (d: any) => this.findClusterNodeById(clusterNodes, d.endId).y);
  }

  private createSunburst(clusterNode: ClusterNode): SVGGElement {
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
      currentAngle = endAngle;
      const countryIndex = this.countryIndexMap.get(country) as number;
      return {
        country,
        startAngle,
        endAngle,
        innerRadius: clusterNode.innerRadius,
        outerRadius: clusterNode.outerRadius,
        color: this.globalColorScale(countryIndex) // Get color from ordinal scale
      };
    });

    // Create a new group for this cluster
    const clusterGroup = d3.create("svg:g")
      .attr("class", "cluster")
      .attr("transform", `translate(${clusterNode.x}, ${clusterNode.y})`);

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

    return clusterGroup.node() as SVGGElement;
  }

  // Helper methods

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
    const minRadius = 200; // Minimum radius for the smallest cluster
    const maxRadius = Math.min(this.width, this.height) / (this.clusters.length *2) ; // Maximum radius for the largest cluster, constrained by the SVG size

    // Calculate the proportional radius
    const outerRadius = minRadius + ((maxRadius - minRadius) * (clusterSize / maxSize));
    const innerRadius = outerRadius - this.sunburstThickness;

    return [outerRadius, innerRadius];
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

  private calculateRadiusForNode(value: number): number {
    const minRadius = 6; // Minimum radius for the least connected node
    const maxRadius = 30; // Maximum radius for the most connected node
    const calculatedRadius = minRadius + (maxRadius - minRadius) * value;

    return calculatedRadius;

    // Linear scaling
  }

  private calculateCollisionRadius(size: number): number {
    const baseRadius = size; // Use the visual radius function
    const padding = 2; // Additional padding to prevent visual overlaps
    return baseRadius + padding;
  }
}
