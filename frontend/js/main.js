import { artworks } from './services/mockData.js';
import { Collage } from './components/Collage.js';
import { Modal } from './components/Modal.js';

document.addEventListener('DOMContentLoaded', () => {
    // Select the main container from index.html
    const collageContainer = document.getElementById('collage-container');

    // Instantiate Modal passing the full database
    const modal = new Modal(artworks);

    // Instantiate the component passing the container, mock data, and click handler
    const collage = new Collage(collageContainer, artworks, (artwork) => {
        modal.open(artwork);
    });

    // Execute rendering
    collage.render();

    // Back to top button logic
    const backToTopBtn = document.getElementById('back-to-top');

    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) {
            backToTopBtn.classList.add('visible');
        } else {
            backToTopBtn.classList.remove('visible');
        }
    });

    backToTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
});
