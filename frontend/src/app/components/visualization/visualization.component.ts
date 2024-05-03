import { Component, OnInit, ElementRef } from '@angular/core';
import * as d3 from 'd3';
import { ArtistService } from '../../services/artist.service';
import { Artist,ArtistNode } from '../../models/artist';
import exhibited_with  from '../../models/exhibited_with';
import { DecisionService } from '../../services/decision.service';
import { Subscription } from 'rxjs';
import { SelectionService } from '../../services/selection.service';

@Component({
  selector: 'app-visualization',
  templateUrl: './visualization.component.html',
  styleUrls: ['./visualization.component.css']
})
export class VisualizationComponent implements OnInit {
  // Loading indicator
  isLoading: boolean = true;

  //Data properties
  artists: Artist[] = [];
  relationships: exhibited_with[] = [];

  //Selection properties
  private subscriptions: Subscription = new Subscription();

  //SVG properties
  private svg: any;
  private margin = 50;
  private width = 1000 - (this.margin * 2);
  private height =  1000 - (this.margin * 2);

// Sunburst properties
  private outerRadius: number = Math.min(this.width, this.height) / 2;
  private sunburstThickness:number = 50;
  private innerRadius: number = this.outerRadius - this.sunburstThickness;

  //Inner order:
  private regionOrder: string[] = ["North Europe", "Eastern Europe", "Central Europe","Southern Europe", "Western Europe", "Others"];


  // Network properties
  private countryCentroids: { [country: string]: { startAngle: number, endAngle: number, middleAngle: number, color: string | number, country: string} } = {};
  private nodes:ArtistNode[] = [];
  private edges: any;
  private selectedNode: [SVGCircleElement, string] | null = null;




constructor(private artistService: ArtistService,
  private decisionService:DecisionService,
  private selectionService: SelectionService) {
    // Bind the method
    this.handleNodeClick = this.handleNodeClick.bind(this);
}


ngOnInit(): void {
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


}

ngOnDestroy() {
  this.subscriptions.unsubscribe();
}

updateVisualization(type: string, value: string) {
  // React to the change
  console.log(`Updated ${type} to ${value}`);
  // Refresh your D3 visualization here
/*   if (type === 'order') {
    // Update the order of the sunburst
    this.updateInnerOrder(value);
  } else if (type === 'size') {
    // Update the size of the sunburst
    this.updateNodeSize(value);
  } else if (type === 'thickness') {
    // Update the thickness of the sunburst
    this.updateEdgeThickness(value);
  } */
}

/*
private updateInnerOrder(value: string): void {
  // Sort your data based on the `value` which could be a certain property or attribute
  // For instance, if `value` is 'alphabetical', sort by country name
  const sortedData = this.sortDataByValue(value);

  const arcGenerator = d3.arc()
    .innerRadius(this.innerRadius)
    .outerRadius(this.outerRadius);

  this.svg.selectAll("path")
    .data(sortedData)
    .transition()  // Smooth transition
    .duration(750)  // Duration of transition in milliseconds
    .attr("d", arcGenerator)
    .attr("fill", (d: any) => d.color);  // Update only the 'd' attribute to change the order

  this.updateLabels(sortedData, arcGenerator);
}

private sortDataByValue(value: string): any[] {
  // Assuming you have a function to sort your data based on the given 'value'
  // This function should return the sorted array of data used in the sunburst.
  return this.yourDataSortingFunction(value);
}

private updateLabels(data: any[], arcGenerator: any): void {
  this.svg.selectAll("text")
    .data(data)
    .transition()
    .duration(750)
    .attr("transform", (d: any) => `translate(${arcGenerator.centroid(d)})`)
    .text((d: any) => d.country);
}*/


/* // Method to update the node sizes based on the normalized degree
private updateNodeSize(value:String): void {
  if(value=='default: Importance (degree)'){
  // Assuming `this.nodes` holds your nodes with a property `degree` for the normalized degrees
  this.svg.selectAll("circle.node")
    .transition()
    .duration(750)
    .attr("r", (d: any) => this.calculateRadiusForNode(d.degree));  // Calculate radius based on degree
  }
}
 */
// Utility function to calculate the radius for a node based on its degree
/* private calculateRadiusForNode(degree: number): number {
  const minRadius = 6; // Minimum radius for the least connected node
  const maxRadius = 15; // Maximum radius for the most connected node
  // Mapping the degree (which is normalized between 0 and 1) to the radius range
  return minRadius + (maxRadius - minRadius) * degree;
}

private updateEdgeThickness(value: string): void {
  if(value = '#exhibtions of Artist 1 and 2'){


  const newThickness = parseFloat(value);  // Convert `value` to a float for thickness

  this.svg.selectAll("line.link")
    .transition()
    .duration(750)
    .style("stroke-width", newThickness);
}
} */


private  loadInitialData() {
  this.artistService.getArtistsWithNationalityTechnique().subscribe((data) => {

  this.artists = data[0];
  this.relationships = data[1];
  this.isLoading = false; // Set loading to false when data is loaded
  const degrees = this.calculateNodeDegrees(this.relationships);
  const normalizedDegrees = this.normalizeDegrees(degrees);
  this.selectionService.selectArtist(this.artists);
  this.createSvg();
  this.drawSunburst();
  this.drawNetwork(normalizedDegrees);

}, (error) => {
  console.error('There was an error', error);
  this.isLoading = false; // Make sure to set loading to false on error as well
});
}

private calculateNodeDegrees(relationships: exhibited_with[]): Map<number, number> {
  const degreeMap = new Map<number, number>();

  relationships.forEach(rel => {
    degreeMap.set(rel.startId, (degreeMap.get(rel.startId) || 0) + 1);
    degreeMap.set(rel.endId, (degreeMap.get(rel.endId) || 0) + 1);
  });

  return degreeMap;
}

private normalizeDegrees(degrees: Map<number, number>): Map<number, number> {
  const maxDegree = Math.max(...degrees.values());
  const minDegree = Math.min(...degrees.values());
  const range = maxDegree - minDegree;
  const normalized = new Map<number, number>();
  degrees.forEach((degree, id) => {
    normalized.set(id, (degree -minDegree)/ range); // Normalize by dividing by the max degree
  });
  return normalized;
}

private prepareData(): any[] {
  const regionMap = new Map<string, any[]>();

  // Initialize regions in the map to preserve order
  this.regionOrder.forEach(region => {
    regionMap.set(region, []);
  });

  // Group artists by country and region
  this.artists.forEach(artist => {
    let regionArtists = regionMap.get(artist.europeanRegion);
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


private createSvg(): void {
  this.svg = d3.select("figure#network")
  .append("svg")
  .attr("width", this.width + (this.margin * 2))
  .attr("height", this.height + (this.margin * 2))
  .append("g")
  .attr("transform", `translate(${this.width / 2 + this.margin}, ${this.height / 2 + this.margin})`);
}




private drawSunburst():void{
  //const countries = this.artists.map(artist => artist.country);
  const countryMap = new Map<string, Artist[]>();
  const sortedArtists:Artist[] = this.prepareData();
  sortedArtists.forEach(artist => console.log(artist.europeanRegion, '', artist.country));
  sortedArtists.forEach(artist => {
    if (!countryMap.has(artist.country)) {
      countryMap.set(artist.country, []);
    }
    countryMap.get(artist.country)!.push(artist);
  });

  const countries = Array.from(countryMap.keys()); // Distinct list of countries
  console.log(countries)
  const totalArtists = this.artists.length;
  const minimumAngle = Math.PI / 18;


  // Create a scale that determines the angle based on the number of artists
  let totalAngleAvailable = 2 * Math.PI; // Total angle available (360 degrees)
  let dynamicAngles = new Map<string, number>();

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


  //const countryColorScale = d3.scaleOrdinal(d3.schemeCategory10);
  const countryColorScale = this.createColorScale(countries);


  let currentAngle = 0;
  const data = countries.map((country, i) => {
    const angle = dynamicAngles.get(country);
    const startAngle = currentAngle;
    const endAngle = currentAngle + (angle as number);
    const middleAngle = (startAngle + endAngle) / 2;
    currentAngle = endAngle;
    return {
      country,
      startAngle,
      endAngle,
      middleAngle,
      //color: this.createColorScale(countries)(country) // Assign color by country
      color: countryColorScale(i)  // Assign color by index
    };
  });

  // Create an arc generator
  const arcGenerator = d3.arc()
  .innerRadius(this.innerRadius)
  .outerRadius(this.outerRadius);

  // Draw arcs
  this.svg.selectAll("path")
  .data(data)
  .enter()
  .append("path")
  .attr("d", arcGenerator)
  .attr("fill", (d:any) => d.color);

  // Draw labels
  this.svg.selectAll("text")
  .data(data)
  .enter()
  .append("text")
  .attr("transform", (d:any) => `translate(${arcGenerator.centroid(d)})`)
  .attr("text-anchor", "middle")
  .text((d:any) => d.country);

  // Save centroid data for node placement later
  this.countryCentroids = {};
  data.forEach(d => {
    this.countryCentroids[d.country] = {
      startAngle: d.startAngle,
      endAngle: d.endAngle,
      middleAngle: d.middleAngle,
      color: d.color,
      country: d.country
    };
  });
  console.log('CountryCentroids:', this.countryCentroids);

}

private createColorScale(countries: string[]): d3.ScaleSequential<string, number> {
  // Create a scale that maps [0, number of countries] to [0, 1]
  const colorScale = d3.scaleSequential(d3.interpolateWarm)
                        .domain([0, countries.length - 1]);

  return colorScale;
}
/* private createColorScale(countries: string[]): d3.ScaleOrdinal<string, string> {
  const colors = [
    "#1f77b4", "#aec7e8", "#ff7f0e", "#ffbb78", "#2ca02c", "#98df8a",
    "#d62728", "#ff9896", "#9467bd", "#c5b0d5", "#8c564b", "#c49c94",
    "#e377c2", "#f7b6d2", "#7f7f7f", "#c7c7c7", "#bcbd22", "#dbdb8d",
    "#17becf", "#9edae5"
  ]; // This array can be adjusted based on the actual number of countries.
  return d3.scaleOrdinal(colors).domain(countries);
}

 */

/* private prepareMatrix(): number[][] {
  const matrix: number[][] = [];

  // Initialize the matrix with zeros
  for (let i = 0; i < this.artists.length; i++) {
    matrix[i] = new Array(this.artists.length).fill(0);
  }

  // Fill the matrix based on the relationships
  this.relationships.forEach(rel => {
    const startIndex = this.getIndexById(rel.startId);
    const endIndex = this.getIndexById(rel.endId);
    matrix[startIndex][endIndex] += 1; // Increment count for start node
    matrix[endIndex][startIndex] += 1; // Increment count for end node (bidirectional)
  });

  return matrix;
}

// Helper function to get the index of an artist by its ID
private getIndexById(id: number): number {
  return this.artists.findIndex(artist => artist.id === id);
}

private drawChordDiagram() {
const matrix = this.prepareMatrix();



  // Create a chord layout
  const chordLayout = d3.chord()
    .padAngle(0.05)
    .sortSubgroups(d3.descending)
    .matrix(matrix);

  // Define arc generators for the chords
  const arc = d3.arc()
    .innerRadius(this.outerRadius + 10)
    .outerRadius(this.outerRadius + 20);

  // Define a ribbon generator for the chords
  const ribbon = d3.ribbon()
    .radius(this.outerRadius + 10);

  // Append groups for the chords
  const chords = this.svg.append("g")
    .selectAll("g")
    .data(chordLayout)
    .join("g")
    .selectAll("path")
    .data(d => d)
    .join("path")
    .attr("d", ribbon)
    .style("fill", d => countryCentroids[countries[d.target.index]].color) // Use country color for chords
    .style("stroke", "none");

  // Add mouseover and mouseout events to display tooltip
  chords.on('mouseover', function (event, d) {
      // Display tooltip
    })
    .on('mouseout', function (event, d) {
      // Hide tooltip
    });
} */




private setupRadialScale(): d3.ScaleLinear<number, number> {
  return d3.scaleLinear()
           .domain([0, 1])  // Normalized degree
           .range([this.innerRadius-10, 10]);
}

private calculateRadiusForNode(degree: number): number {
  const minRadius = 6; // Minimum radius for the least connected node
  const maxRadius = 15; // Maximum radius for the most connected node
  return minRadius + (maxRadius - minRadius) * degree; // Linear scaling
}
private calculateCollisionRadius(degree: number): number {
  const baseRadius = this.calculateRadiusForNode(degree); // Use the visual radius function
  const padding = 2; // Additional padding to prevent visual overlaps
  return baseRadius + padding;
}

private handleNodeClick(node: ArtistNode, event: MouseEvent): void {
  console.log('Clicked on:', node.title);
  this.selectionService.selectArtist([node.title]);
  const circle = event.currentTarget as SVGCircleElement;
// Check if the currently selected node is the same as the clicked node
if (this.selectedNode && this.selectedNode[0] === circle) {
  // If it's the same node, deselect it
  circle.style.fill = this.selectedNode[1];
  this.selectedNode = null;  // Clear the selected node
  this.selectionService.selectArtist(this.artists);  // Reset the selection
  // Reset edge colors
  this.edges.style('stroke', 'lightgray');
} else {
  // If it's a different node or no node is currently selected
  if (this.selectedNode) {
    // Reset the previous node's color if another node was selected before
    const previousNode = this.selectedNode[0];
    const previousColor = this.selectedNode[1];
    previousNode.style.fill = previousColor;
    // Reset edge colors
    this.edges.style('stroke', 'lightgray');
  }
  
  // Set the new node as the selected node and change its color
  this.selectedNode = [circle, circle.style.fill];
  
  // Darken the original color for the selected node
  const originalColor = d3.color(circle.style.fill) as d3.RGBColor;
  const darkerColor = d3.rgb(originalColor).darker(1); // Adjust the darkness factor as needed
  circle.style.fill = darkerColor.toString();  // Change the fill color to the darker shade

   // Highlight edges connected to the selected node
   const selectedNodeId = node.id;
   this.edges.style('stroke', (d: any) => {
     // Check if the edge is connected to the selected node
     if (d.source.id === selectedNodeId || d.target.id === selectedNodeId) {
       // If connected, change the color to black
       return darkerColor.toString();
     } else {
       // If not connected, keep the color light gray
       return 'lightgray';
     }
   });
}
}

private drawNetwork(degrees: Map<number, number>): void {

  console.log('Amount of Artists:', this.artists.length);
  // Format artists as nodes
  const nodes: ArtistNode[] = this.artists.map((artist: Artist) => {
    console.log(artist.country, this.countryCentroids[artist.country]); // This will show if some country data is missing or undefined
    const countryData = this.countryCentroids[artist.country];
    console.log(countryData)
    const degree = degrees.get(artist.id) || 0;
    console.log(degree);
    const radial = this.setupRadialScale()(degree);
    const angle = countryData.middleAngle;
    const x =  radial * Math.sin(angle);
    const y = - radial * Math.cos(angle);
    return {
        id: artist.id,
        title: artist,
        x: x,
        y: y,
        vx: 0, // velocity in x
        vy: 0, // velocity in y
        angle: angle,
        radius: radial,
        color: countryData.color,
        countryData: countryData
    };
  });
  console.log(nodes)

  // Create a mapping object to look up node indices by ID
  const getNodeIndexById = (id: number) => {
  return nodes.findIndex((node: ArtistNode) => node.id === id);
  };

/**
 * This method processes the list of relationships to format them for use in the D3 visualization.
 * Each relationship in the 'relationships' array links two artists by their IDs, representing a connection in the network.
 * However, for D3 to visualize these links, it requires references to the actual node objects, not just their IDs.
 * This function maps each relationship to the corresponding source and target node objects by looking up their indices
 * in the 'nodes' array using their IDs. This allows D3 to directly access the node objects when rendering the links in the network graph.
 *
 * @returns An array of formatted relationships where each relationship is an object containing 'source' and 'target' properties.
 * These properties are references to the node objects that D3 can use to render the links in the visualization.
 */
  const formattedRelationships = this.relationships.map((relationship: exhibited_with) => {
    const sourceIndex = getNodeIndexById(relationship.startId);
    const targetIndex = getNodeIndexById(relationship.endId);
    return {
      source: nodes[sourceIndex],
      target: nodes[targetIndex],
    };
  });

  // Append edges to the SVG
  const edges = this.svg.selectAll('.link')
    .data(formattedRelationships)
    .enter()
    .append('line')
    .attr('class', 'link')
    .style('stroke', 'lightgray')
    .style('stroke-width', 2)
    .attr('x1', (d: any) => d.source.x)
    .attr('y1', (d: any) => d.source.y)
    .attr('x2', (d: any) => d.target.x)
    .attr('y2', (d: any) => d.target.y);
this.edges = edges;

  const centerX = this.width / 2 + this.margin;
  const centerY = this.height / 2 + this.margin;
  const innerRadius = this.innerRadius;
  function boundaryForce(alpha:number) {
    for (let node of nodes) {
      // Calculate the current radius and angle from the center
      let dx = (node.x as number) - (centerX as number);
      let dy = (node.y as number) - centerY;
      let distance = Math.sqrt(dx * dx + dy * dy);
      let angle = Math.atan2(dy, dx);

      // Define inner and outer boundary limits
      let innerBoundary = innerRadius + 50; // 10 is a margin from the inner boundary

      if (distance < innerBoundary) {
        node.x = centerX + innerBoundary * Math.cos(angle);
        node.y = centerY + innerBoundary * Math.sin(angle);
      }
    }
  }


  // Setup the force simulation
  const simulation = d3.forceSimulation(nodes)
  .force("collision", d3.forceCollide((d: any) => this.calculateCollisionRadius(degrees.get(d.id) || 0)))
  //.force("collision", d3.forceCollide().radius(10))
  .force("angular", (alpha) => {
    // Angular constraint to keep nodes within their segment
    nodes.forEach((d:any) => {
        const currentAngle = Math.atan2(d.y - this.height / 2, d.x - this.width / 2);
        const deltaAngle = currentAngle - d.angle;
        if (Math.abs(deltaAngle) > 0.1) {  // Adjust sensitivity as needed
            const correctedAngle = d.angle + Math.sign(deltaAngle) * 0.1;  // Gradually adjust
            d.x += ( d.radius * Math.sin(correctedAngle) - d.x) * alpha;
            d.y += ( - d.radius * Math.cos(correctedAngle) - d.y) * alpha;
        }
    });
  })
  .on("tick", () => {
    boundaryForce(0.5);
    // Update node positions
    this.svg.selectAll('.node')
      .attr('cx', (d:any) => d.x)
      .attr('cy', (d:any) => d.y);
      edges
      .attr("x1", (d:any) => d.source.x)
      .attr("y1", (d:any) => d.source.y)
      .attr("x2", (d:any) => d.target.x)
      .attr("y2", (d:any) => d.target.y);
  });

 /*  unused forces:
  .force("boundary", boundaryForce)
  .force("center", d3.forceCenter(this.width / 2, this.height / 2))
  .force("radial", d3.forceRadial((d:ArtistNode) => d.radius, this.width / 2, this.height / 2)) */

const selectionService=this.selectionService;

  // Append circles (nodes) to the SVG
  const circles = this.svg.selectAll('.node')
    .data(nodes)
    .enter()
    .append('circle')
    .attr('class', 'node')
    .attr('r', (d: any) => this.calculateRadiusForNode(degrees.get(d.id) || 0)) // Adjust radius based on degree
      .attr('cx', (d:any) => d.x) // Ensure correct positioning
      .attr('cy', (d:any) => d.y)
    .style('fill', (d:any) => d.color)  // Apply the color
    .on('mouseover', function (this: SVGCircleElement, event: MouseEvent, d: any) {
      const element = d3.select(this);
      const [x, y] = d3.pointer(event, window.document.body);
      d3.select('#tooltip')
        .style('display', 'block')
        .style('left', `${x + 10}px`)
        .style('top', `${y + 10}px`)
        .html(`Name: ${d.title.firstname} ${d.title.lastname}<br/>Technique: ${d.title.distinct_techniques}<br/>Nationality: ${d.title.country}`);
    })
    .on('mouseout', function () {
      d3.select('#tooltip').style('display', 'none');
    })
    .on('click', (event: MouseEvent, d: any) => this.handleNodeClick(d, event));
      
    


  // Append text labels for nodes
  const text = this.svg.append("g").attr("class", "labels").selectAll("g")
    .data(circles)
    .enter().append("g");

  text.append("text")
    .attr("x", 14)
    .attr("y", ".31em")
    .style("font-family", "sans-serif")
    .style("font-size", "0.7em")
    .text(function(d: any) { return d.id; });

  // Bind nodes to the simulation
  simulation.nodes(nodes);
}

// Code that can be used to normalize the degrees logarithmically or by square root

private normalizeDegreesLogarithmically(degrees: Map<number, number>): Map<number, number> {
  const normalized = new Map<number, number>();
  degrees.forEach((degree, id) => {
      const logDegree = Math.log1p(degree); // Use log1p to avoid log(0)
      normalized.set(id, logDegree);
  });

  const maxLogDegree = Math.max(...Array.from(normalized.values()));
  normalized.forEach((value, id) => {
      normalized.set(id, value / maxLogDegree); // Normalize by the maximum log degree
  });

  return normalized;
}

private normalizeDegreesSqrt(degrees: Map<number, number>): Map<number, number> {
  const normalized = new Map<number, number>();
  const maxDegree = Math.sqrt(Math.max(...degrees.values()));

  degrees.forEach((degree, id) => {
      normalized.set(id, Math.sqrt(degree) / maxDegree);
  });

  return normalized;
}
}

/* .call(d3.drag()  // enable drag support
        .on("start", (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on("drag", (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on("end", (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        }));
 */
