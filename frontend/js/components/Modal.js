export class Modal {
    constructor() {
        this.modal = document.getElementById('artwork-modal');
        this.overlay = document.getElementById('modal-overlay');
        this.closeBtn = document.getElementById('modal-close');
        
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

        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.close();
        });
    }

    /**
     * @param {Object} artwork 
     */
    open(artwork) {
        // Populate data
        this.image.src = artwork.image_url;
        this.image.alt = artwork.title;
        this.title.textContent = artwork.title;
        this.category.textContent = artwork.category;
        this.description.textContent = artwork.description;

        // Prevent body scroll so user doesn't scroll the gallery behind the modal
        document.body.style.overflow = 'hidden';

        // Show modal
        this.modal.classList.remove('hidden');
    }

    close() {
        // Hide modal
        this.modal.classList.add('hidden');

        // Restore body scroll
        document.body.style.overflow = 'auto';

        // Clear image to prevent seeing old image momentarily on next open
        setTimeout(() => {
            this.image.src = '';
        }, 400); // Wait for CSS transition (0.4s) to finish
    }
}
