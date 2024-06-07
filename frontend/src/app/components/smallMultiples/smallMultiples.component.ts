import { Component, OnInit, ViewChild, ElementRef, OnChanges, OnDestroy, HostListener } from '@angular/core';
import * as d3 from 'd3';
import { Subscription } from 'rxjs';
import { SelectionService } from '../../services/selection.service';
import { DecisionService } from '../../services/decision.service';
import { ArtistService } from '../../services/artist.service';
import { Artist, ClusterNode } from '../../models/artist';
import exhibited_with from '../../models/exhibited_with';

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

  private clusters: Artist[][] = [];
  private intraCommunityEdges: exhibited_with[][] = [];
  private interCommunityEdges: any[] = [];
  private clusterNodes: ClusterNode[] = [];
  private allCountries: string[] = [];
  private minClusterRadius = 50; // Minimum radius for each cluster
  private degreesMap: { [clusterId: number]: Map<number, number> } = {};
  private totalExhibitionsMap: { [clusterId: number]: Map<number, number> } = {};
  private totalExhibitedArtworksMap: { [clusterId: number]: Map<number, number> } = {};
  private differentTechniquesMap: { [clusterId: number]: Map<number, number> } = {};
  private edgeColorScale = d3.scaleSequential(d3.interpolateGreys).domain([0, 1]);

  private regionOrder: string[] = ["North Europe", "Eastern Europe", "Southern Europe", "Western Europe", "Others", "\\N"];

  constructor(
    private selectionService: SelectionService,
    private decisionService: DecisionService,
    private artistService: ArtistService
  ) {}

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
    const yData = ['nationality', 'birthcountry', 'deathcountry', 'mostexhibited']; // The desired categories

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
      .attr("transform", (d:any) => `translate(${xScale(String(d.x))},${yScale(d.y)})`);

    cells.each((d:any, i:number, nodes:any) => {
      console.log(`Drawing cell for cluster ${d.x} and category ${d.y}`);
      this.drawClusterInCell(d3.select(nodes[i]), d.x, d.y);
    });
  }

  private drawClusterInCell(cell: any, x: number, y: string): void {
    const clusterIndex = x - 1; // Adjust cluster index to match your data structure
    const cluster = this.clusters[clusterIndex];
    if (!cluster) {
      console.log(`No cluster data for index ${clusterIndex}`);
      return;
    }

    console.log(`Drawing cluster ${clusterIndex} in cell for category ${y}`);

    const [outerRadius, innerRadius] = this.createSunburstProperties(cluster.length, this.clusters[0].length);
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
      .style('stroke', 'none');

    clusterGroup.selectAll("text")
      .data(data)
      .enter()
      .append("text")
      .attr("transform", (d: any) => `translate(${arcGenerator.centroid(d)})`)
      .attr("text-anchor", "middle")
      .text((d: any) => d.country)
      .style("font-weight", "bold")
      .style("fill", "white");

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

  private createSunburstProperties(clusterSize: number, maxSize: number): [number, number] {
    const minRadius = this.minClusterRadius;
    const maxRadius = Math.min(this.contentWidth, this.contentHeight) / 3;
    const sunburstThickness = 20;

    const outerRadius = minRadius + ((maxRadius - minRadius) * (clusterSize / maxSize));
    const innerRadius = outerRadius - sunburstThickness;

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
