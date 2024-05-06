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

  //Decisions
   private degreesMap: Map<number, number> = new Map<number, number>();
  private totalExhibitionsMap: Map<number, number> = new Map<number, number>();
 private totalExhibitedArtworksMap: Map<number, number> = new Map<number, number>();
 private differentTechniquesMap: Map<number, number> = new Map<number, number>();


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
  //Forces
  private simulation: d3.Simulation<ArtistNode, undefined> | null = null;

// Create a color scale
private edgeColorScale = d3.scaleSequential(d3.interpolateGreys) // You can use any color scale you prefer
    .domain([0, 1]); // Adjust the domain based on your normalized values range


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

  this.subscriptions.add(this.decisionService.currentSunburst.subscribe(sunburst => {
    this.updateVisualization('sunburst', sunburst);
  }));
}

ngOnDestroy() {
  this.subscriptions.unsubscribe();
}


private  loadInitialData() {
  this.artistService.getArtistsWithNationalityTechnique().subscribe((data) => {
  this.artists = data[0];

  this.relationships = data[1];
  console.log(this.relationships);
  this.isLoading = false; // Set loading to false when data is loaded
 
  this.selectionService.selectArtist(this.artists);
  this.createSvg();
  this.drawSunburst();
  this.drawNetwork();
}, (error) => {
  console.error('There was an error', error);
  this.isLoading = false; // Make sure to set loading to false on error as well
});
}


private createSvg(): void {
  this.svg = d3.select("figure#network")
  .append("svg")
  .attr("width", this.width + (this.margin * 2))
  .attr("height", this.height + (this.margin * 2))
  .append("g")
  .attr("transform", `translate(${this.width / 2 + this.margin}, ${this.height / 2 + this.margin})`);
}

updateVisualization(type: string, value: string) {
  // React to the change
  
  console.log(`Updated ${type} to ${value}`);
  if(this.svg){

  if(type==='size'){
    this.updateNodeSize(value);
  }
  if(type==='sunburst'){
    this.updateSunburst(value);
  }
 
}

}
private updateSunburst(value: string) {
  if(value === 'default: Artist (preferred) nationality'){
    // Remove existing SVG
    d3.select("figure#network").select("svg").remove();

    //Create new svg
    this.createSvg();
/*     this.drawSunburst('nationality');
    this.drawNetwork('nationality'); */
  }
  else if(value === 'artist birthcountry'){
    // Remove existing SVG
    d3.select("figure#network").select("svg").remove();

    //Create new svg
    this.createSvg();
  /*   this.drawSunburst('nationality');
    this.drawNetwork('nationality'); */
  }
}
private updateNodeSize(value: string) {
  if(value === 'Amount of Exhibitions'){
if(this.totalExhibitionsMap.size === 0) {
    // Create a Map<number, number> to hold the total exhibition values
    const totalExhibitionsMap = new Map<number, number>();
    this.artists.forEach(artist => {
        totalExhibitionsMap.set(artist.id, artist.total_exhibitions);
    });
    // Normalize the values using the normalizeLinear function
    const normalizedTotalExhibitions = this.normalizeLinear(totalExhibitionsMap);
    this.totalExhibitionsMap = normalizedTotalExhibitions;
  }
    // Select all circles with the class 'node'
    const circles = this.svg.selectAll('.node');

    // Update the radius of each circle based on the normalized total exhibitions
    circles.attr('r', (d: any) => {
        // Retrieve the normalized value for the current artist from the map
        const normalizedValue = this.totalExhibitionsMap.get(d.artist.id)||0;
        // Use the normalized value to calculate the radius for the current circle
        return this.calculateRadiusForNode(normalizedValue);
    });
   
    
}
else if(value === "default: Importance (Degree)")
  {
     // Select all circles with the class 'node'

     const circles = this.svg.selectAll('.node');
 
     // Update the radius of each circle based on the normalized total exhibitions
     circles.attr('r', (d: any) => {
         // Retrieve the normalized value for the current artist from the map
         const normalizedValue = this.degreesMap.get(d.artist.id)||0;
         // Use the normalized value to calculate the radius for the current circle
         return this.calculateRadiusForNode(normalizedValue);
     });
  }
  else if(value === 'Amount of different techniques'){
    if(this.differentTechniquesMap.size === 0) {

      
        // Create a Map<number, number> to hold the total exhibition values
        const differentTechniquesMap = new Map<number, number>();
        this.artists.forEach(artist => {

          differentTechniquesMap.set(artist.id, artist.distinct_techniques.length);
        });
    
        
        // Normalize the values using the normalizeLinear function
        const normalizeddifferentTechniquesMap = this.normalizeLinear(differentTechniquesMap);
    
        this.differentTechniquesMap = normalizeddifferentTechniquesMap
      }
     
        // Select all circles with the class 'node'
        const circles = this.svg.selectAll('.node');
    
        // Update the radius of each circle based on the normalized total exhibitions
        circles.attr('r', (d: any) => {
            // Retrieve the normalized value for the current artist from the map
            const normalizedValue = this.differentTechniquesMap.get(d.artist.id)||0;
            // Use the normalized value to calculate the radius for the current circle
            return this.calculateRadiusForNode(normalizedValue);
        });
       
        
    }
  else if(value === 'Amount of exhibited Artworks'){
    if(this.totalExhibitedArtworksMap.size === 0) {

      
        // Create a Map<number, number> to hold the total exhibition values
        const totalExhibitedArtworksMap = new Map<number, number>();
        this.artists.forEach(artist => {
            totalExhibitedArtworksMap.set(artist.id, artist.total_exhibited_artworks);
        });
    
        
        // Normalize the values using the normalizeLinear function
        const normalizedTotalExhibitions = this.normalizeLinear(totalExhibitedArtworksMap);
    
        this.totalExhibitedArtworksMap = normalizedTotalExhibitions
      }
 
        // Select all circles with the class 'node'
        const circles = this.svg.selectAll('.node');
    
        // Update the radius of each circle based on the normalized total exhibitions
        circles.attr('r', (d: any) => {
            // Retrieve the normalized value for the current artist from the map
            const normalizedValue = this.totalExhibitedArtworksMap.get(d.artist.id)||0;
            // Use the normalized value to calculate the radius for the current circle
            return this.calculateRadiusForNode(normalizedValue);
        });
       
        
    }
  this.resetSimulation();
  
}
private getNodeSize():number[]{
  // Select all circles with the class 'node'
  const circles = this.svg.selectAll('.node');
  
  // Get the radii (sizes) of all circles
  const sizes: number[] = [];
  circles.each(function(this: any, d: any) {
    const radius = parseFloat(d3.select(this).attr('r')); // Get the radius attribute and convert it to a number
    sizes[d.id] = radius; // Store the radius in the sizes array
  });
 
  return sizes;
}

private resetSimulation() {
  const sizes = this.getNodeSize();
if(this.simulation){
  // Update collision force with new sizes
  this.simulation.force("collision", d3.forceCollide((d: any) => this.calculateCollisionRadius(sizes[d.id] || 0)));

  // Update angular force
  this.simulation.force("angular", (alpha) => {
      // Angular constraint to keep nodes within their segment
      this.nodes.forEach((d: any) => {
          const currentAngle = Math.atan2(d.y - this.height / 2, d.x - this.width / 2);
          const deltaAngle = currentAngle - d.angle;
          if (Math.abs(deltaAngle) > 0.1) {  // Adjust sensitivity as needed
              const correctedAngle = d.angle + Math.sign(deltaAngle) * 0.1;  // Gradually adjust
              d.x += (d.radius * Math.sin(correctedAngle) - d.x) * alpha;
              d.y += (-d.radius * Math.cos(correctedAngle) - d.y) * alpha;
          }
      });
  });

  // Update tick function
  this.simulation.on("tick", () => {
      this.boundaryForce(0.5);
      // Update node positions
      this.svg.selectAll('.node')
          .attr('cx', (d: any) => d.x)
          .attr('cy', (d: any) => d.y);
      this.edges
          .attr("x1", (d: any) => d.source.x)
          .attr("y1", (d: any) => d.source.y)
          .attr("x2", (d: any) => d.target.x)
          .attr("y2", (d: any) => d.target.y);
  });

  // Restart the simulation
  this.simulation.alpha(1).restart();
}
}

 




private drawSunburst():void{
  //const countries = this.artists.map(artist => artist.country);
  const countryMap = new Map<string, Artist[]>();
  const sortedArtists:Artist[] = this.prepareData();
  sortedArtists.forEach(artist => {
    if (!countryMap.has(artist.country)) {
      countryMap.set(artist.country, []);
    }
    countryMap.get(artist.country)!.push(artist);
  });

  const countries = Array.from(countryMap.keys()); // Distinct list of countries
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


}



private drawNetwork(): void {
if(this.degreesMap.size === 0) {
  const degrees = this.calculateNodeDegrees(this.relationships);
  const normalizedDegrees = this.normalizeLinear(degrees);
  this.degreesMap = normalizedDegrees;
}
  // Format artists as nodes
  const nodes: ArtistNode[] = this.artists.map((artist: Artist) => {

    const countryData = this.countryCentroids[artist.country];

    const degree = this.degreesMap.get(artist.id) || 0;

    const radial = this.setupRadialScale()(degree);
    const angle = countryData.middleAngle;
    const x =  radial * Math.sin(angle);
    const y = - radial * Math.cos(angle);
    return {
        id: artist.id,
        artist: artist,
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
  
  this.nodes= nodes;

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
 // Extract the sharedExhibitionMinArtworks values from the relationships array
const sharedExhibitionMinArtworksValues = this.relationships.map((relationship: exhibited_with) => relationship.sharedExhibitionMinArtworks);

// Normalize the sharedExhibitionMinArtworks values using normalizeLinear
const normalizedSharedExhibitionMinArtworks = this.normalizeLogarithmically(new Map(sharedExhibitionMinArtworksValues.map((value, index) => [index, value])));

// Map the normalized values to the formattedRelationships array
const formattedRelationships = this.relationships.map((relationship: exhibited_with, index) => {
    const sourceIndex = getNodeIndexById(relationship.startId);
    const targetIndex = getNodeIndexById(relationship.endId);
    return {
        source: nodes[sourceIndex],
        target: nodes[targetIndex],
        sharedExhibitions: relationship.sharedExhibitions,
        sharedExhibitionMinArtworks: normalizedSharedExhibitionMinArtworks.get(index) || 0 // Use normalized value or default to 0
    };
});



  // Append edges to the SVG
  const edges = this.svg.selectAll('.link')
    .data(formattedRelationships)
    .enter()
    .append('line')
    .attr('class', 'link')
    .style('stroke', (d: any) => this.edgeColorScale(d.sharedExhibitionMinArtworks))
    .style('stroke-width', 2)
    .attr('x1', (d: any) => d.source.x)
    .attr('y1', (d: any) => d.source.y)
    .attr('x2', (d: any) => d.target.x)
    .attr('y2', (d: any) => d.target.y)
    
    ;
this.edges = edges;
 /*  // Append edges to the SVG
  const edges = this.svg.selectAll('.link')
    .data(formattedRelationships)
    .enter()
    .append('line')
    .attr('class', 'link')
  //  .style('stroke', 'lightgray')
    .style('stroke-width', 2)
    .attr('x1', (d: any) => d.source.x)
    .attr('y1', (d: any) => d.source.y)
    .attr('x2', (d: any) => d.target.x)
    .attr('y2', (d: any) => d.target.y)
    .style('stroke', (d: any) => {
      // Check the condition and return the appropriate color
      return d.sharedExhibitions < 3? 'lightgray' : 'red';
    });
    ;
this.edges = edges; */



  // Append circles (nodes) to the SVG
  const circles = this.svg.selectAll('.node')
    .data(nodes)
    .enter()
    .append('circle')
    .attr('class', 'node')
    .attr('r', (d: any) => this.calculateRadiusForNode(this.degreesMap.get(d.id) || 0)) // Adjust radius based on degree
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
        .html(`Name: ${d.artist.firstname} ${d.artist.lastname}<br/>Technique: ${d.artist.distinct_techniques}<br/>Nationality: ${d.artist.country}`);
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


    const sizes = this.getNodeSize();
  // Setup the force simulation
  const simulation = d3.forceSimulation(nodes)
  .force("collision", d3.forceCollide((d: any) => this.calculateCollisionRadius(sizes[d.id] || 0)))
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
    this.boundaryForce(0.5);
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

  // Bind nodes to the simulation
  simulation.nodes(nodes);
  this.simulation = simulation;
}

private boundaryForce(alpha: number): void {
  const centerX = this.width / 2 + this.margin;
  const centerY = this.height / 2 + this.margin;
  const innerRadius = this.innerRadius;
  const nodes = this.nodes;

  for (let node of nodes) {
      // Calculate the current distance from the center
      const dx = node.x ? node.x - centerX : 0;
      const dy = node.y ? node.y - centerY : 0;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Calculate the angle of the node
      const angle = Math.atan2(dy, dx);

      // Define the inner boundary based on the sunburst's inner radius at the current angle
      const innerBoundary = innerRadius + 50; // Adjust the padding as needed

      // Check if the node is within the inner boundary
      if (distance < innerBoundary) {
          // Move the node to the closest point on the inner boundary
          node.x = centerX + innerBoundary * Math.cos(angle);
          node.y = centerY + innerBoundary * Math.sin(angle);
      }
  }
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
  const range = maxValue- minValue;
  const normalized = new Map<number, number>();
  values.forEach((value, id) => {
    normalized.set(id, (value -minValue)/ range); // Normalize by dividing by the max degree
  });
  return normalized;
}

private normalizeLogarithmically(values: Map<number, number>): Map<number, number> {
  const logMaxValue = Math.log1p(Math.max(...values.values()));
  const logMinValue = Math.log1p(Math.min(...values.values()));
  const range = logMaxValue- logMinValue;
  const normalized = new Map<number, number>();
  values.forEach((value, id) => {
    normalized.set(id, (Math.log1p(value) -logMinValue)/ range); // Normalize by dividing by the max degree
  });
  return normalized;
}



private normalizeSqrt(values: Map<number, number>): Map<number, number> {
  const sqrtMaxValue = Math.sqrt(Math.max(...values.values()));
  const sqrtMinValue = Math.sqrt(Math.min(...values.values()));
  const range = sqrtMaxValue- sqrtMinValue;
  const normalized = new Map<number, number>();
  values.forEach((value, id) => {
    normalized.set(id, (Math.sqrt(value) -sqrtMinValue)/ range); // Normalize by dividing by the max degree
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


// Code that can be used to normalize the degrees logarithmically or by square root


private createColorScale(countries: string[]): d3.ScaleSequential<string, number> {
  // Create a scale that maps [0, number of countries] to [0, 1]
  const colorScale = d3.scaleSequential(d3.interpolateWarm)
                        .domain([0, countries.length - 1]);

  return colorScale;
}


private setupRadialScale(): d3.ScaleLinear<number, number> {
  return d3.scaleLinear()
           .domain([0, 1])  // Normalized degree
           .range([this.innerRadius-10, 10]);
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

private handleNodeClick(node: ArtistNode, event: MouseEvent): void {
  console.log('Clicked on:', node.artist);
  this.selectionService.selectArtist([node.artist]);
  const circle = event.currentTarget as SVGCircleElement;
// Check if the currently selected node is the same as the clicked node
if (this.selectedNode && this.selectedNode[0] === circle) {
  // If it's the same node, deselect it
  circle.style.fill = this.selectedNode[1];
  this.selectedNode = null;  // Clear the selected node
  this.selectionService.selectArtist(this.artists);  // Reset the selection
  // Reset edge colors
  this.edges.style('stroke', (d: any) => this.edgeColorScale(d.sharedExhibitionMinArtworks))
} else {
  // If it's a different node or no node is currently selected
  if (this.selectedNode) {
    // Reset the previous node's color if another node was selected before
    const previousNode = this.selectedNode[0];
    const previousColor = this.selectedNode[1];
    previousNode.style.fill = previousColor;
    // Reset edge colors
    this.edges.style('stroke', (d: any) => this.edgeColorScale(d.sharedExhibitionMinArtworks))
  }
  
  // Set the new node as the selected node and change its color
  this.selectedNode = [circle, circle.style.fill];
  
  // Darken the original color for the selected node
  const originalColor = d3.color(circle.style.fill) as d3.RGBColor;
  const darkerColor = d3.rgb(originalColor).darker(1); // Adjust the darkness factor as needed
  circle.style.fill = darkerColor.toString();  // Change the fill color to the darker shade

   // Highlight edges connected to the selected node
   const selectedNodeId = node.id;
   this.edges.filter((d: any) => {
    return d.source.id === selectedNodeId || d.target.id === selectedNodeId;
  }).style('stroke', darkerColor.toString());
  
}
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
