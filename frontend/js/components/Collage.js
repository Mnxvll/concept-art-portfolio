export class Collage {
    /**
     * @param {HTMLElement} container - The DOM element where the collage will be injected
     * @param {Array} artworks - Array of artworks (ARTWORK model)
     */
    constructor(container, artworks) {
        this.container = container;
        this.artworks = artworks;
    }

    render() {
        this.container.innerHTML = ''; // Clear the container

        this.artworks.forEach((art) => {
            const item = document.createElement('div');
            item.className = 'collage__item';

            const img = document.createElement('img');
            img.src = art.image_url;
            img.alt = art.title;
            img.className = 'collage__image';
            img.loading = 'lazy'; // Native lazy loading

            item.appendChild(img);
            this.container.appendChild(item);
        });
    }
}
