import { artworks } from './services/mockData.js';
import { Collage } from './components/Collage.js';

document.addEventListener('DOMContentLoaded', () => {
    // Select the main container from index.html
    const collageContainer = document.getElementById('collage-container');

    // Instantiate the component passing the container and mock data
    const collage = new Collage(collageContainer, artworks);

    // Execute rendering
    collage.render();
});
