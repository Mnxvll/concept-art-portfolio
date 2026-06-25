export class Modal {
    /**
     * @param {Array} artworks - Full database of artworks to enable project grouping
     */
    constructor(artworks = []) {
        this.artworks = artworks;
        this.currentProjectGroup = [];
        this.currentIndex = 0;

        this.modal = document.getElementById('artwork-modal');
        this.overlay = document.getElementById('modal-overlay');
        this.closeBtn = document.getElementById('modal-close');
        
        // Navigation arrows
        this.prevBtn = document.getElementById('modal-prev');
        this.nextBtn = document.getElementById('modal-next');

        // Data elements
        this.image = document.getElementById('modal-image');
        this.title = document.getElementById('modal-title');
        this.category = document.getElementById('modal-category');
        this.description = document.getElementById('modal-description');

        this.initEvents();
    }

    initEvents() {
        // Close modal when X is clicked
        this.closeBtn.addEventListener('click', () => this.close());
        
        // Close modal when clicking outside the content (on the overlay)
        this.overlay.addEventListener('click', () => this.close());

        // Arrow clicks
        this.prevBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent bubbling up and closing the modal
            this.prev();
        });

        this.nextBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.next();
        });

        // Keyboard events
        document.addEventListener('keydown', (e) => {
            // Only listen if modal is open
            if (this.modal.classList.contains('hidden')) return;
            
            if (e.key === 'Escape') this.close();
            if (e.key === 'ArrowLeft') this.prev();
            if (e.key === 'ArrowRight') this.next();
        });
    }

    /**
     * @param {Object} artwork 
     */
    open(artwork) {
        // Find if this artwork belongs to a project
        if (artwork.project) {
            // Group all artworks from the same project
            this.currentProjectGroup = this.artworks.filter(a => a.project === artwork.project);
            // Find current index in this group
            this.currentIndex = this.currentProjectGroup.findIndex(a => a.id === artwork.id);
        } else {
            // It's a standalone artwork, group is just itself
            this.currentProjectGroup = [artwork];
            this.currentIndex = 0;
        }

        this.updateUI();

        // Prevent body scroll so user doesn't scroll the gallery behind the modal
        document.body.style.overflow = 'hidden';

        // Show modal
        this.modal.classList.remove('hidden');
    }

    updateUI() {
        const currentArt = this.currentProjectGroup[this.currentIndex];

        // Populate data
        this.image.src = currentArt.image_url;
        this.image.alt = currentArt.title;
        this.title.textContent = currentArt.title;
        this.category.textContent = currentArt.category;
        this.description.textContent = currentArt.description;

        // Manage arrows visibility
        if (this.currentProjectGroup.length > 1) {
            this.prevBtn.classList.remove('hidden');
            this.nextBtn.classList.remove('hidden');
        } else {
            this.prevBtn.classList.add('hidden');
            this.nextBtn.classList.add('hidden');
        }
    }

    next() {
        if (this.currentProjectGroup.length <= 1) return;
        // Move to next, loop back to 0 if at the end
        this.currentIndex = (this.currentIndex + 1) % this.currentProjectGroup.length;
        this.updateUI();
    }

    prev() {
        if (this.currentProjectGroup.length <= 1) return;
        // Move to prev, loop back to end if at the beginning
        this.currentIndex = (this.currentIndex - 1 + this.currentProjectGroup.length) % this.currentProjectGroup.length;
        this.updateUI();
    }

    close() {
        // Hide modal
        this.modal.classList.add('hidden');

        // Restore body scroll
        document.body.style.overflow = 'auto';

        // Clear image to prevent seeing old image momentarily on next open
        setTimeout(() => {
            this.image.src = '';
            this.currentProjectGroup = [];
            this.currentIndex = 0;
        }, 400); // Wait for CSS transition (0.4s) to finish
    }
}
