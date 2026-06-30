export class Collage {
    /**
     * @param {HTMLElement} container - The DOM element where the collage will be injected
     * @param {Array} artworks - Array of artworks (ARTWORK model)
     * @param {Function} onArtworkClick - Callback executed when an artwork is clicked
     */
    constructor(container, artworks, onArtworkClick) {
        this.container = container;
        this.artworks = artworks;
        this.onArtworkClick = onArtworkClick;
    }

    render() {
        this.container.innerHTML = ''; // Clear the container

        // Setup observer for mobile "hover" effect (active state on scroll)
        const hasHover = window.matchMedia('(hover: hover)').matches;
        let observer = null;

        if (!hasHover) {
            const observerOptions = {
                root: null,
                rootMargin: '-49% 0px -49% 0px', // Trigger when in the middle 20% of viewport
                threshold: 0
            };

            observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('is-active');
                    } else {
                        entry.target.classList.remove('is-active');
                    }
                });
            }, observerOptions);
        }

        this.artworks.forEach((art) => {
            const item = document.createElement('div');
            item.className = 'collage__item';

            const img = document.createElement('img');
            img.src = art.image_url;
            img.alt = art.title;
            img.className = 'collage__image';
            img.loading = 'lazy'; // Native lazy loading

            // Add click listener
            item.addEventListener('click', () => {
                if (this.onArtworkClick) {
                    this.onArtworkClick(art);
                }
            });

            // Create overlay container
            const overlay = document.createElement('div');
            overlay.className = 'collage__overlay';

            // Create title
            const title = document.createElement('h3');
            title.className = 'collage__title';
            title.textContent = art.title;

            // Assemble the puzzle
            overlay.appendChild(title);
            item.appendChild(img);
            item.appendChild(overlay);
            this.container.appendChild(item);

            if (observer) {
                observer.observe(item);
            }
        });
    }
}
