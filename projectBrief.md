# FreeplaneWeb
A tool to view and search existing freeplane mindmap documents from a web browser, particularly a mobile one.

## Purpose
Provides a searchable, read only view of an existing FreeMind/FreePlane formated  XML file.

## Key features
- Search for node text content via input field.
- Display view of current matching nodes for search along with direct parent and direct descendants.

## Target audience
- Mobile users viewing site from phone.

## Key Technologies
-  Statically hosted site.
- Browser/client-side searching, filtering, and display.
- Should support offline usage.
- esbuild to create and manage the client bundle.
- Should use d3.js for node graph display. Must support zoom and pan via touch.
