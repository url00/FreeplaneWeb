import { parseMindMapXml } from './parser.js';
import * as d3 from 'd3';

document.addEventListener('DOMContentLoaded', () => {
    const fileInputElement = document.getElementById('fileInput');
    const searchInputElement = document.getElementById('searchInput');
    const graphContainerElement = document.getElementById('graphContainer');
    const listContainerElement = document.getElementById('listContainer');
    const nodeLimitInputElement = document.getElementById('nodeLimitInput');
    const maxDepthInputElement = document.getElementById('maxDepthInput');
    const showGraphBtn = document.getElementById('showGraphBtn');
    const showListBtn = document.getElementById('showListBtn');

    let currentMindMapData = null;
    let currentDisplayMode = 'graph';

    if (!fileInputElement) {
        console.error("File input element not found!");
        return;
    }
    if (!graphContainerElement) {
        console.error("Graph container element not found!");
        return;
    }

    // 1. Define debounce utility
    function debounce(func, delay) {
        let timeoutId;
        return function(...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                func.apply(this, args);
            }, delay);
        };
    }

    // 2. Define functions to be debounced
    function executeSearch(searchTerm) {
        if (!currentMindMapData) {
            return;
        }

        const dataToRender = searchTerm.trim() === ""
            ? currentMindMapData
            : filterMindMapData(currentMindMapData, searchTerm.toLowerCase(), maxDepthInputElement ? parseInt(maxDepthInputElement.value, 10) : 2);

        if (dataToRender) {
            if (currentDisplayMode === 'graph') {
                renderGraph(dataToRender, searchTerm.toLowerCase());
            } else {
                renderList(dataToRender);
            }
        } else {
            graphContainerElement.innerHTML = '<p style="text-align:center; padding:20px;">No matching nodes found.</p>';
            listContainerElement.innerHTML = '<p style="text-align:center; padding:20px;">No matching nodes found.</p>';
        }
    }

    function handleResize() {
        if (currentMindMapData) {
            // Re-render with current search state
            const searchTerm = searchInputElement ? searchInputElement.value : "";
            executeSearch(searchTerm); // Use executeSearch to re-apply filter and render
        }
    }

    // 3. Create debounced versions
    const debouncedExecuteSearch = debounce(executeSearch, 1000); // 1000ms delay
    const debouncedHandleResize = debounce(handleResize, 250); // 250ms delay for resize

    // 4. Setup event listeners
    fileInputElement.addEventListener('change', handleFileLoad);
    if (searchInputElement) {
        searchInputElement.addEventListener('input', (event) => {
            const searchTerm = event.target.value;
            debouncedExecuteSearch(searchTerm);
        });
    }
    if (nodeLimitInputElement) {
        nodeLimitInputElement.addEventListener('change', () => {
            const searchTerm = searchInputElement ? searchInputElement.value : "";
            executeSearch(searchTerm);
        });
    }
    if (maxDepthInputElement) {
        maxDepthInputElement.addEventListener('change', () => {
            const searchTerm = searchInputElement ? searchInputElement.value : "";
            executeSearch(searchTerm);
        });
    }
    
    showGraphBtn.addEventListener('click', () => switchTab('graph'));
    showListBtn.addEventListener('click', () => switchTab('list'));

    window.addEventListener('resize', debouncedHandleResize);

    // 5. Other function definitions
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

    // The original handleSearch function is now replaced by the event listener calling debouncedExecuteSearch
    // and the executeSearch function itself.

    /**
     * Recursively filters the mind map data based on a search term.
     * A node is included if it or any of its descendants match the search term.
     * @param {object} node The current node to process.
     * @param {string} searchTerm The lowercase search term.
     * @param {number} maxDepth The maximum depth of children to include for a matching node.
     * @returns {object|null} A new node object if it or its descendants match, otherwise null.
     */
    function filterMindMapData(node, searchTerm, maxDepth) {
        if (!node) {
            return null;
        }

        // Helper function to clone a node and its descendants down to a certain depth
        function cloneWithDepth(targetNode, depth) {
            if (!targetNode || depth < 0) {
                return null;
            }
            const newNode = { ...targetNode, children: undefined }; // Clone basic properties
            if (targetNode.children && depth > 0) {
                newNode.children = targetNode.children
                    .map(child => cloneWithDepth(child, depth - 1))
                    .filter(c => c !== null);
                if (newNode.children.length === 0) {
                    delete newNode.children;
                }
            }
            return newNode;
        }

        const nodeMatches = node.name && node.name.toLowerCase().includes(searchTerm);

        if (nodeMatches) {
            // If the node itself matches, clone it and its children down to maxDepth
            return cloneWithDepth(node, maxDepth);
        }

        // If the node doesn't match, check its children
        if (node.children && node.children.length > 0) {
            const filteredChildren = node.children
                .map(child => filterMindMapData(child, searchTerm, maxDepth))
                .filter(c => c !== null);

            if (filteredChildren.length > 0) {
                // If any children (or their descendants) match, return a new node with just the matching branches
                const newNode = { ...node };
                newNode.children = filteredChildren;
                return newNode;
            }
        }

        return null; // No match in this branch
    }

    function switchTab(mode) {
        currentDisplayMode = mode;
        if (mode === 'graph') {
            graphContainerElement.style.display = 'block';
            listContainerElement.style.display = 'none';
        } else {
            listContainerElement.style.display = 'block';
            graphContainerElement.style.display = 'none';
        }
        const searchTerm = searchInputElement ? searchInputElement.value : "";
        executeSearch(searchTerm);
    }

    function renderList(data) {
        listContainerElement.innerHTML = ''; // Clear previous list
        if (!data) {
            listContainerElement.innerHTML = '<p style="text-align:center; padding:20px;">No data to display.</p>';
            return;
        }
        const ul = document.createElement('ul');
        ul.style.listStyleType = 'disc';
        ul.style.paddingLeft = '20px';
        buildList(data, ul);
        listContainerElement.appendChild(ul);
    }

    function buildList(node, parentElement) {
        if (!node) return;
        const li = document.createElement('li');
        li.textContent = node.name;
        parentElement.appendChild(li);

        if (node.children && node.children.length > 0) {
            const ul = document.createElement('ul');
            ul.style.listStyleType = 'circle';
            ul.style.paddingLeft = '20px';
            li.appendChild(ul);
            node.children.forEach(child => buildList(child, ul));
        }
    }

    function renderGraph(data, searchTerm = "") {
        graphContainerElement.innerHTML = '';
        if (!data) {
            graphContainerElement.innerHTML = '<p style="text-align:center; padding:20px;">No data to display.</p>';
            return;
        }

        const root = d3.hierarchy(data);
        const nodes = root.descendants();
        const links = root.links();
        const numNodes = nodes.length;
        const nodeLimit = nodeLimitInputElement ? parseInt(nodeLimitInputElement.value, 10) : 50;

        if (numNodes > nodeLimit) {
            graphContainerElement.innerHTML = `<p style="text-align:center; padding:20px;">Mind map is too large to display (${numNodes} nodes).<br>Please use search to filter the content or increase the node limit.</p>`;
            return;
        }

        const width = graphContainerElement.clientWidth;
        const height = graphContainerElement.clientHeight || 600;

        const svg = d3.select(graphContainerElement)
            .append("svg")
            .attr("width", width)
            .attr("height", height)
            .attr("viewBox", [-width / 2, -height / 2, width, height]);

        const g = svg.append("g");

        const simulation = d3.forceSimulation(nodes)
            .force("link", d3.forceLink(links).id(d => d.id).distance(100).strength(0.5))
            .force("charge", d3.forceManyBody().strength(-400))
            .force("center", d3.forceCenter())
            .force("collide", d3.forceCollide().radius(d => d.radius || 30));

        const link = g.append("g")
            .attr("stroke", "#999")
            .attr("stroke-opacity", 0.6)
            .selectAll("line")
            .data(links)
            .join("line")
            .attr("stroke-width", d => Math.sqrt(d.target.value));

        const node = g.append("g")
            .selectAll("g")
            .data(nodes)
            .join("g");

        node.append("circle")
            .attr("r", 10)
            .attr("fill", d => {
                if (searchTerm && d.data.name.toLowerCase().includes(searchTerm.toLowerCase())) {
                    return 'orange';
                }
                return d.children ? '#555' : '#999';
            });

        const textMaxWidth = 150;
        const lineHeight = "1.2em";

        node.append("text")
            .attr("x", 15)
            .attr("y", "0.35em")
            .attr("stroke", "none")
            .attr("stroke-width", 0)
            .style("font-size", "12px")
            .style("fill", "black")
            .style("text-anchor", "start")
            .text(d => d.data.name)
            .call(wrapText, textMaxWidth, lineHeight);

        // Set collision radius after text is wrapped and sized
        node.each(function(d) {
            const bbox = this.getBBox();
            d.radius = Math.max(bbox.width, bbox.height) / 2 + 10; // Add padding
        });
        
        // Restart simulation with updated radius
        simulation.force("collide", d3.forceCollide().radius(d => d.radius).strength(1));
        simulation.alpha(1).restart();


        simulation.on("tick", () => {
            link
                .attr("x1", d => d.source.x)
                .attr("y1", d => d.source.y)
                .attr("x2", d => d.target.x)
                .attr("y2", d => d.target.y);

            node
                .attr("transform", d => `translate(${d.x},${d.y})`);
        });
        
        svg.call(d3.zoom().on("zoom", (event) => {
            g.attr("transform", event.transform);
        }));
    }

    /**
     * Wraps SVG text to a given width.
     * @param {d3.Selection} textSelection D3 selection of text elements.
     * @param {number} maxWidth The maximum width for the text.
     * @param {string|number} lineHeight The height of each line (e.g., "1.1em" or a pixel value).
     */
    function wrapText(textSelection, maxWidth, lineHeight) {
        textSelection.each(function(d) {
            const text = d3.select(this);
            const words = d.data.name.split(/\s+/).reverse();
            let word;
            let line = [];
            let lineNumber = 0;
            const x = text.attr("x");
            const y = text.attr("y");
            const dy = parseFloat(text.attr("dy")) || 0;

            text.text(null); // Clear existing text to prepare for tspans

            let tspan = text.append("tspan").attr("x", x).attr("y", y).attr("dy", dy + "em");

            while (word = words.pop()) {
                line.push(word);
                tspan.text(line.join(" "));
                if (tspan.node().getComputedTextLength() > maxWidth && line.length > 1) {
                    line.pop();
                    tspan.text(line.join(" "));
                    line = [word];
                    tspan = text.append("tspan")
                        .attr("x", x)
                        .attr("y", y)
                        .attr("dy", ++lineNumber * parseFloat(lineHeight) + dy + "em")
                        .text(word);
                }
            }
        });
    }

});
