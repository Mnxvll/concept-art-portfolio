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
        this.currentColumns = 0;
        this.resizeTimer = null;

        window.addEventListener('resize', () => {
            if (this.resizeTimer) clearTimeout(this.resizeTimer);
            this.resizeTimer = setTimeout(() => {
                this.checkAndRender();
            }, 150);
        });
    }

    render() {
        // Initial render forces column check
        this.currentColumns = 0;
        this.checkAndRender();
    }

    checkAndRender() {
        // Determine columns based on window width
        let cols = 3;
        if (window.innerWidth <= 768) {
            cols = 1;
        } else if (window.innerWidth <= 1200) {
            cols = 2;
        }

        // Only re-render if the number of columns changed
        if (this.currentColumns !== cols) {
            this.currentColumns = cols;
            this.forceRender();
        }
    }

    forceRender() {
        this.container.innerHTML = '';

        const columns = [];
        for (let i = 0; i < this.currentColumns; i++) {
            const col = document.createElement('div');
            col.className = 'collage__column';
            columns.push(col);
            this.container.appendChild(col);
        }

        // Setup observer for entrance animations
        let appearDelay = 0;
        let appearTimeout = null;
        const appearObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    setTimeout(() => {
                        entry.target.classList.add('is-visible');
                    }, appearDelay);
                    appearDelay += 100;

                    clearTimeout(appearTimeout);
                    appearTimeout = setTimeout(() => {
                        appearDelay = 0;
                    }, 200);

                    appearObserver.unobserve(entry.target);
                }
            });
        }, { rootMargin: '50px 0px', threshold: 0.05 });

        // Setup observer for mobile "hover" effect (active state on scroll)
        const hasHover = window.matchMedia('(hover: hover)').matches;
        let observer = null;

        if (!hasHover) {
            const observerOptions = {
                root: null,
                rootMargin: '-49.5% 0px -49.5% 0px',
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

            let wasAtBottom = false;
            window.addEventListener('scroll', () => {
                const items = document.querySelectorAll('.collage__item');
                if (items.length === 0) return;

                const lastItem = items[items.length - 1];
                const isAtBottom = (window.innerHeight + window.scrollY) >= document.body.offsetHeight - 150;

                if (isAtBottom) {
                    if (!wasAtBottom) {
                        items.forEach(item => {
                            if (item !== lastItem) item.classList.remove('is-active');
                        });
                        lastItem.classList.add('is-active');
                        wasAtBottom = true;
                    }
                } else {
                    if (wasAtBottom) {
                        lastItem.classList.remove('is-active');
                        const center = window.innerHeight / 2;
                        items.forEach(item => {
                            const r = item.getBoundingClientRect();
                            if (r.top <= center && r.bottom >= center) {
                                item.classList.add('is-active');
                            }
                        });
                        wasAtBottom = false;
                    }
                }
            }, { passive: true });
        }

        this.artworks.forEach((art, index) => {
            const item = document.createElement('div');
            item.className = 'collage__item';

            const img = document.createElement('img');
            img.src = art.image_url;
            img.alt = art.title;
            img.className = 'collage__image';
            img.loading = 'lazy';

            // Fade-in when the image finishes loading
            img.addEventListener('load', () => img.classList.add('loaded'));
            // Handle already-cached images (load event won't fire)
            if (img.complete) img.classList.add('loaded');

            item.addEventListener('click', () => {
                if (this.onArtworkClick) {
                    this.onArtworkClick(art);
                }
            });

            const overlay = document.createElement('div');
            overlay.className = 'collage__overlay';

            const title = document.createElement('h3');
            title.className = 'collage__title';
            title.textContent = art.title;

            // Delete button for Admin Mode
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'collage__delete-btn';
            deleteBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>';
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // Don't trigger the modal
                document.dispatchEvent(new CustomEvent('requestDeleteArtwork', { detail: art }));
            });

            overlay.appendChild(title);
            item.appendChild(img);
            item.appendChild(overlay);
            item.appendChild(deleteBtn);

            // Distribute items into columns sequentially
            const colIndex = index % this.currentColumns;
            columns[colIndex].appendChild(item);

            appearObserver.observe(item);

            if (observer) {
                observer.observe(item);
            }
        });
    }
}
