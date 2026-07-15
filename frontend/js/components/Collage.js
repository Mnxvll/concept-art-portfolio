// Masonry-style collage grid with lazy loading and entrance animations
export class Collage {
    /**
     * @param {HTMLElement} container - DOM element where the collage is rendered
     * @param {Array} artworks - Array of artwork objects
     * @param {Function} onArtworkClick - Callback when an artwork card is clicked
     */
    constructor(container, artworks, onArtworkClick) {
        this.container = container;
        this.artworks = artworks;
        this.onArtworkClick = onArtworkClick;
        this.currentColumns = 0;
        this.resizeTimer = null;

        // Re-render when the container width changes (handles window resize)
        this.resizeObserver = new ResizeObserver((entries) => {
            for (let entry of entries) {
                if (this.resizeTimer) clearTimeout(this.resizeTimer);
                this.resizeTimer = setTimeout(() => {
                    this.checkAndRender(entry.contentRect.width);
                }, 100);
            }
        });
        
        this.resizeObserver.observe(this.container);

        // Event delegation: handle clicks on artwork cards and delete buttons
        this.container.addEventListener('click', (e) => {
            const deleteBtn = e.target.closest('.collage__delete-btn');
            if (deleteBtn) {
                e.stopPropagation();
                const item = deleteBtn.closest('.collage__item');
                if (item) {
                    const artId = item.dataset.id;
                    const art = this.artworks.find(a => a.id === artId);
                    if (art) {
                        document.dispatchEvent(new CustomEvent('requestDeleteArtwork', { detail: art }));
                    }
                }
                return;
            }

            const item = e.target.closest('.collage__item');
            if (item) {
                const artId = item.dataset.id;
                const art = this.artworks.find(a => a.id === artId);
                if (art && this.onArtworkClick) {
                    this.onArtworkClick(art);
                }
            }
        });
    }

    // Public method that forces a full re-render
    render() {
        this.currentColumns = 0;
        this.checkAndRender();
    }

    // Only re-renders if the column count changed (avoids unnecessary DOM work)
    checkAndRender(width = this.container.clientWidth) {
        let cols = 3;
        if (width <= 768) {
            cols = 1;
        } else if (width <= 1200) {
            cols = 2;
        }

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

        // Staggered entrance animation: each card delays slightly after the previous
        let appearDelay = 0;
        let appearTimeout = null;
        const appearObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    setTimeout(() => {
                        entry.target.classList.add('is-visible');
                    }, appearDelay);
                    appearDelay += 100;

                    // Reset delay after a pause so new batches start fresh
                    clearTimeout(appearTimeout);
                    appearTimeout = setTimeout(() => {
                        appearDelay = 0;
                    }, 200);

                    appearObserver.unobserve(entry.target);
                }
            });
        }, { rootMargin: '50px 0px', threshold: 0.05 });

        // On touch devices (no hover), simulate hover by activating the card
        // closest to the vertical center of the viewport
        const hasHover = window.matchMedia('(hover: hover)').matches;
        let observer = null;

        if (!hasHover) {
            const observerOptions = {
                root: null,
                // Narrow 1px band at the center of the viewport
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

            // Edge case: when the user scrolls to the very bottom, the center-band
            // observer can't reach the last item. Detect this and force-activate it.
            let wasAtBottom = false;
            let scrollTicking = false;

            window.addEventListener('scroll', () => {
                if (!scrollTicking) {
                    window.requestAnimationFrame(() => {
                        const isAtBottom = (window.innerHeight + window.scrollY) >= document.documentElement.scrollHeight - 150;

                        if (isAtBottom) {
                            if (!wasAtBottom) {
                                const items = document.querySelectorAll('.collage__item');
                                if (items.length > 0) {
                                    const lastItem = items[items.length - 1];
                                    items.forEach(item => {
                                        if (item !== lastItem) item.classList.remove('is-active');
                                    });
                                    lastItem.classList.add('is-active');
                                }
                                wasAtBottom = true;
                            }
                        } else {
                            if (wasAtBottom) {
                                // Leaving the bottom: let the center-band observer take over again
                                const items = document.querySelectorAll('.collage__item');
                                if (items.length > 0) {
                                    const lastItem = items[items.length - 1];
                                    lastItem.classList.remove('is-active');
                                    const center = window.innerHeight / 2;
                                    items.forEach(item => {
                                        const r = item.getBoundingClientRect();
                                        if (r.top <= center && r.bottom >= center) {
                                            item.classList.add('is-active');
                                        }
                                    });
                                }
                                wasAtBottom = false;
                            }
                        }
                        scrollTicking = false;
                    });
                    scrollTicking = true;
                }
            }, { passive: true });
        }

        // Build each artwork card and distribute into columns (round-robin)
        this.artworks.forEach((art, index) => {
            const item = document.createElement('div');
            item.className = 'collage__item';
            item.dataset.id = art.id;

            const img = document.createElement('img');
            img.src = art.image_url;
            img.alt = art.title;
            img.className = 'collage__image';
            img.loading = 'lazy';

            // Fade-in when the image finishes loading
            img.addEventListener('load', () => img.classList.add('loaded'));
            if (img.complete) img.classList.add('loaded');

            const overlay = document.createElement('div');
            overlay.className = 'collage__overlay';

            const title = document.createElement('h3');
            title.className = 'collage__title';
            title.textContent = art.title;

            // Delete button (visible only in admin mode via CSS)
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'collage__delete-btn';
            deleteBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>';

            overlay.appendChild(title);
            item.appendChild(img);
            item.appendChild(overlay);
            item.appendChild(deleteBtn);

            const colIndex = index % this.currentColumns;
            columns[colIndex].appendChild(item);

            appearObserver.observe(item);

            if (observer) {
                observer.observe(item);
            }
        });
    }
}
