# FreeplaneWeb

You can access the deployed application here: [https://url00.github.io/FreeplaneWeb/](https://url00.github.io/FreeplaneWeb/)

A tool to view and search existing Freeplane mind map documents from a web browser with both desktop and mobile supported.

## Client-Side First

**Everything happens locally in your browser.** This web application is designed for privacy and offline use. When you load a mind map file, it is processed directly on your device. No data is ever uploaded to a server.

## Key Features

-   **View Mind Maps:** Provides a readable view of FreeMind/FreePlane formatted XML files.
-   **Search Content:** Easily search for text within the nodes of your mind map.
-   **Interactive Graph:** The mind map is displayed as an interactive, force-directed graph using d3.js, which supports smooth zooming and panning via touch or mouse.
-   **Offline Support:** Can be used without an internet connection once loaded.

## Key Technologies

-   **Static Site:** No server-side backend is required.
-   **d3.js:** Used for rendering the interactive and dynamic node graph.
-   **esbuild:** Manages the client-side JavaScript bundle.
