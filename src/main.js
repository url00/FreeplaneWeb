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
        console.log("Executing search for:", searchTerm); // Log when debounced function runs

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
                    console.log("Mind map parsed successfully:", currentMindMapData);
                    // Placeholder for Phase 2: renderGraph(currentMindMapData);
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
        // Clear previous graph
        graphContainerElement.innerHTML = '';

        if (!data) {
            graphContainerElement.innerHTML = '<p style="text-align:center; padding:20px;">No data to display.</p>';
            return;
        }

        const rootForCount = d3.hierarchy(data);
        const numNodes = rootForCount.descendants().length;
        const nodeLimit = nodeLimitInputElement ? parseInt(nodeLimitInputElement.value, 10) : 20;

        if (numNodes > nodeLimit) {
            graphContainerElement.innerHTML = `<p style="text-align:center; padding:20px;">Mind map is too large to display (${numNodes} nodes).<br>Please use search to filter the content.</p>`;
            return;
        }
        
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

        const nodeWidth = 180; // Horizontal space for each node
        const nodeHeight = 70;  // Vertical space for each node, to accommodate wrapped text
        const textMaxWidth = 150; // Max width for text before wrapping
        const lineHeight = "1.1em"; // Line height for wrapped text

        const root = d3.hierarchy(data);
        // Use nodeSize for fixed spacing, better for text wrapping
        const treeLayout = d3.tree().nodeSize([nodeHeight, nodeWidth]);
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
            .style('font-size', '10px')
            .call(wrapText, textMaxWidth, lineHeight); // Call text wrapping function

        // Initial transform to center the graph or fit it
        // Adjust translation based on new nodeWidth and potential graph spread
        const firstNode = root.descendants()[0];
        if(firstNode) {
             // Translate to bring the first node near the left edge, vertically centered.
             // The x-coordinate from d3.tree with nodeSize is relative to its parent in that dimension.
             // The root node's x is typically 0 if nodeSize is used for vertical separation.
             // We need to find the graph bounds to center it properly or fit it.
             // For now, a simple initial translation:
             let minX = 0, maxX = 0, minY = 0, maxY = 0;
             root.each(d => {
                if (d.x < minX) minX = d.x;
                if (d.x > maxX) maxX = d.x;
                if (d.y < minY) minY = d.y;
                if (d.y > maxY) maxY = d.y;
             });
            
             const graphHeight = maxX - minX + nodeHeight; // Approximate graph height
             const graphWidth = maxY - minY + nodeWidth; // Approximate graph width

             let initialScale = Math.min( (height - 40) / graphHeight, (width - 40) / graphWidth, 1); // Add padding
             if (initialScale > 1) initialScale = 1; // Don't scale up beyond 1

             // Center the graph
             const translateX = (width - graphWidth * initialScale) / 2 - (minY * initialScale) + 20; // +20 for some left padding
             const translateY = (height - graphHeight * initialScale) / 2 - (minX * initialScale) + 20; // +20 for some top padding
            
             const initialTransform = d3.zoomIdentity.translate(translateX, translateY).scale(initialScale);
             d3.select(graphContainerElement).select('svg').call(d3.zoom().transform, initialTransform);
        }
    }

    /**
     * Wraps SVG text to a given width.
     * @param {d3.Selection} textSelection D3 selection of text elements.
     * @param {number} maxWidth The maximum width for the text.
     * @param {string|number} lineHeight The height of each line (e.g., "1.1em" or a pixel value).
     */
    function wrapText(textSelection, maxWidth, lineHeight) {
        textSelection.each(function(d) { // 'd' is the data bound to the node
            const text = d3.select(this);
            const words = d.data.name.split(/\s+/).reverse(); // Process words in reverse for easy pop
            let word;
            let line = [];
            let lineNumber = 0;
            const x = text.attr("x"); // Original x position
            const initialDy = parseFloat(text.attr("dy")) || 0; // Original dy (e.g., 0.35em)
            
            text.text(null); // Clear existing text

            let tspan = text.append("tspan")
                .attr("x", x)
                .attr("dy", initialDy + "em"); // Use 'em' if initialDy was like '0.35em'

            while (word = words.pop()) {
                line.push(word);
                tspan.text(line.join(" "));
                // Check if tspan exceeds maxWidth. For robust checking, use getComputedTextLength().
                // However, getComputedTextLength can be slow if called for many nodes.
                // A simpler heuristic or fixed char count per line might be used if performance is an issue.
                // For now, let's assume a more direct check if possible, or rely on visual adjustment.
                // This is a common challenge in SVG text wrapping.
                // A common approach is to test length, if too long, remove last word, finalize tspan, start new tspan with that word.
                if (tspan.node().getComputedTextLength() > maxWidth && line.length > 1) {
                    line.pop(); // Remove the word that made it too long
                    tspan.text(line.join(" "));
                    line = [word]; // Start new line with the popped word
                    lineNumber++;
                    tspan = text.append("tspan")
                        .attr("x", x)
                        .attr("dy", lineNumber === 0 && initialDy !== 0 ? initialDy + "em" : lineHeight) // Subsequent lines use lineHeight
                        .text(word);
                }
            }
        });
    }

});
