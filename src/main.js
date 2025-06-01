import { parseMindMapXml } from './parser.js';
import * as d3 from 'd3';

document.addEventListener('DOMContentLoaded', () => {
    const fileInputElement = document.getElementById('fileInput');
    const searchInputElement = document.getElementById('searchInput');
    const graphContainerElement = document.getElementById('graphContainer');

    let currentMindMapData = null;

    if (!fileInputElement) {
        console.error("File input element not found!");
        return;
    }
    if (!graphContainerElement) {
        console.error("Graph container element not found!");
        return;
    }

    fileInputElement.addEventListener('change', handleFileLoad);
    if (searchInputElement) {
        searchInputElement.addEventListener('input', handleSearch);
    }

    function handleFileLoad(event) {
        const file = event.target.files[0];
        if (!file) {
            console.log("No file selected.");
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const xmlString = e.target.result;
            try {
                currentMindMapData = parseMindMapXml(xmlString);
                if (currentMindMapData) {
                    console.log("Mind map parsed successfully:", currentMindMapData);
                    // Placeholder for Phase 2: renderGraph(currentMindMapData);
                    alert("Mind map loaded and parsed. Check console for data. Visualization coming in Phase 2.");
                    renderGraph(currentMindMapData); // Call initial render
                } else {
                    console.error("Failed to parse mind map XML.");
                    alert("Error parsing mind map XML. Check console for details.");
                }
            } catch (error) {
                console.error("Error processing file:", error);
                alert(`Error processing file: ${error.message}`);
            }
        };
        reader.onerror = (e) => {
            console.error("FileReader error:", e);
            alert("Error reading file.");
        };
        reader.readAsText(file);
    }

    function handleSearch(event) {
        const searchTerm = event.target.value;
        if (!currentMindMapData) {
            return;
        }
        // Placeholder for Phase 3: filterAndRenderGraph(searchTerm);
        console.log("Search term:", searchTerm);
        // For now, re-render the full graph or implement a simple filter
        renderGraph(currentMindMapData, searchTerm);
    }

    function renderGraph(data, searchTerm = "") {
        // Clear previous graph
        graphContainerElement.innerHTML = '';

        if (!data) return;
        
        const width = graphContainerElement.clientWidth;
        const height = graphContainerElement.clientHeight || 400; // Fallback height

        const svg = d3.select(graphContainerElement)
            .append("svg")
            .attr("width", width)
            .attr("height", height)
            .call(d3.zoom().on("zoom", (event) => {
                g.attr("transform", event.transform);
            }))
            .append("g");

        const g = svg.append("g");

        const root = d3.hierarchy(data);
        const treeLayout = d3.tree().size([height - 40, width - 160]); // Adjusted for padding/margins
        treeLayout(root);

        // Links
        g.selectAll('.link')
            .data(root.links())
            .enter()
            .append('path')
            .attr('class', 'link')
            .attr('d', d3.linkHorizontal()
                .x(d => d.y)
                .y(d => d.x))
            .style('fill', 'none')
            .style('stroke', '#ccc')
            .style('stroke-width', '1.5px');

        // Nodes
        const node = g.selectAll('.node')
            .data(root.descendants())
            .enter()
            .append('g')
            .attr('class', d => `node ${d.children ? "node--internal" : "node--leaf"}`)
            .attr('transform', d => `translate(${d.y},${d.x})`);

        node.append('circle')
            .attr('r', 5)
            .style('fill', d => {
                if (searchTerm && d.data.name.toLowerCase().includes(searchTerm.toLowerCase())) {
                    return 'orange'; // Highlight matching nodes
                }
                return d.children ? '#555' : '#999';
            });

        node.append('text')
            .attr('dy', '.35em')
            .attr('x', d => d.children ? -13 : 13)
            .style('text-anchor', d => d.children ? 'end' : 'start')
            .text(d => d.data.name)
            .style('font-size', '10px');

        // Initial transform to center the graph or fit it
        // This is a simple centering, might need more sophisticated logic for large graphs
        const firstNode = root.descendants()[0];
        if(firstNode) {
             const initialTransform = d3.zoomIdentity.translate(80, height / 2 - firstNode.x).scale(0.8);
             d3.select(graphContainerElement).select('svg').call(d3.zoom().transform, initialTransform);
        }
    }
});
