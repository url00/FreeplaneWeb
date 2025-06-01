/**
 * Parses Freeplane/FreeMind XML content into a hierarchical JavaScript object.
 * @param {string} xmlString The XML content as a string.
 * @returns {object|null} A hierarchical object representing the mind map, or null on error.
 */
export function parseMindMapXml(xmlString) {
    try {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlString, "application/xml");

        if (xmlDoc.getElementsByTagName("parsererror").length > 0) {
            console.error("Error parsing XML:", xmlDoc.getElementsByTagName("parsererror")[0].textContent);
            return null;
        }

        const mapNode = xmlDoc.querySelector("map");
        if (!mapNode) {
            console.error("No <map> element found in XML.");
            return null;
        }

        // The root node of the mind map is the first <node> child of <map>
        const rootXmlNode = mapNode.querySelector("node");
        if (!rootXmlNode) {
            console.error("No root <node> element found in <map>.");
            return null;
        }
        
        return convertNode(rootXmlNode);

    } catch (error) {
        console.error("Exception during XML parsing:", error);
        return null;
    }
}

/**
 * Recursively converts an XML node element and its children.
 * @param {Element} xmlNode The XML node element.
 * @returns {object} A JavaScript object representing the node.
 */
function convertNode(xmlNode) {
    const id = xmlNode.getAttribute("ID") || `genid-${Math.random().toString(36).substr(2, 9)}`;
    let text = xmlNode.getAttribute("TEXT") || "";

    // Sometimes text might be in a <richcontent type="html"><b>TEXT</b>...</richcontent> child
    const richContent = xmlNode.querySelector("richcontent[type='html']");
    if (richContent) {
        // A more robust HTML parser might be needed for complex rich content.
        // For now, try to extract text content, prioritizing explicit TEXT attribute if available.
        // This simple extraction might not be perfect for all HTML.
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = richContent.innerHTML;
        const richText = tempDiv.textContent || tempDiv.innerText || "";
        if (!text && richText) { // Only use rich text if TEXT attribute is empty
            text = richText.trim();
        } else if (text && richText && !text.includes(richText.trim())) {
            // If TEXT exists and richText is different and not contained, append it.
            // This is a heuristic and might need refinement based on actual Freeplane XML structure.
            // text += ` (${richText.trim()})`;
        }
    }


    const nodeData = {
        id: id,
        name: text, // d3 often uses 'name' for display text
        attributes: {},
        children: []
    };

    // Store all attributes of the node
    for (const attr of xmlNode.attributes) {
        nodeData.attributes[attr.name] = attr.value;
    }

    const childXmlNodes = Array.from(xmlNode.children).filter(child => child.tagName === "node");
    for (const childXmlNode of childXmlNodes) {
        nodeData.children.push(convertNode(childXmlNode));
    }
    
    // If there are no actual child <node> elements, ensure children array is empty
    // This is important for d3.hierarchy: an empty array means leaf node.
    if (nodeData.children.length === 0) {
        delete nodeData.children; // d3.hierarchy prefers 'children' to be absent for leaf nodes
    }


    return nodeData;
}
