// Add artwork modal with image upload (drag-and-drop or file picker)
export class AddArtwork {
    /**
     * @param {HTMLElement} modalElement - The modal's root DOM element
     * @param {Function} onAdd - Callback invoked with the new artwork object on submit
     */
    constructor(modalElement, onAdd) {
        this.onAdd = onAdd;
        this._objectUrl = null;

        this.modal = modalElement;
        
        if (!this.modal) return;
        
        this.overlay = this.modal.querySelector('#add-artwork-overlay');
        this.closeBtn = this.modal.querySelector('#add-artwork-close');
        this.form = this.modal.querySelector('#add-artwork-form');
        this.dropzone = this.modal.querySelector('#add-artwork-dropzone');
        this.fileInput = this.modal.querySelector('#add-artwork-file');
        this.preview = this.modal.querySelector('#add-artwork-preview');
        this.placeholder = this.modal.querySelector('#add-artwork-placeholder');

        this.titleInput = this.modal.querySelector('#add-artwork-title');
        this.projectInput = this.modal.querySelector('#add-artwork-project');
        this.categorySelect = this.modal.querySelector('#add-artwork-category');
        this.dateInput = this.modal.querySelector('#add-artwork-date');
        this.descriptionInput = this.modal.querySelector('#add-artwork-description');

        this.initEvents();
    }

    initEvents() {
        // Initialize third-party widgets once admin assets are loaded
        document.addEventListener('adminModeActivated', () => {
            if (typeof SlimSelect !== 'undefined' && !this.slimSelect) {
                this.slimSelect = new SlimSelect({
                    select: this.categorySelect,
                    settings: { showSearch: false, closeOnSelect: true },
                    events: {
                        afterChange: () => {
                            if (document.activeElement) document.activeElement.blur();
                        }
                    }
                });
            }

            if (typeof flatpickr !== 'undefined' && !this.flatpickr) {
                this.flatpickr = flatpickr(this.dateInput, {
                    dateFormat: 'Y-m-d',
                    maxDate: 'today',
                    disableMobile: true,
                });
            }
        });

        this.closeBtn.addEventListener('click', () => this.close());
        this.overlay.addEventListener('click', () => this.close());

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !this.modal.classList.contains('hidden')) {
                this.close();
            }
        });

        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.submit();
        });

        this.categorySelect.addEventListener('change', () => {
            this.categorySelect.blur();
        });

        // -- Image upload --

        this.dropzone.addEventListener('click', () => {
            this.fileInput.click();
        });

        this.fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) this.loadPreview(file);
        });

        this.dropzone.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.dropzone.classList.add('drag-over');
        });

        this.dropzone.addEventListener('dragleave', (e) => {
            if (!this.dropzone.contains(e.relatedTarget)) {
                this.dropzone.classList.remove('drag-over');
            }
        });

        this.dropzone.addEventListener('drop', (e) => {
            e.preventDefault();
            this.dropzone.classList.remove('drag-over');
            const file = e.dataTransfer.files[0];
            if (file && file.type.startsWith('image/')) {
                this.fileInput.files = e.dataTransfer.files;
                this.loadPreview(file);
            }
        });
    }

    // Show a preview of the selected image using an Object URL
    loadPreview(file) {
        // Revoke the previous URL to avoid memory leaks
        if (this._objectUrl) {
            URL.revokeObjectURL(this._objectUrl);
        }
        this._objectUrl = URL.createObjectURL(file);
        this.preview.src = this._objectUrl;
        this.preview.classList.remove('hidden');
        this.placeholder.classList.add('hidden');
    }

    open() {
        this.modal.classList.remove('hidden');
        document.body.classList.add('modal-open');
        setTimeout(() => this.titleInput.focus(), 100);
    }

    close() {
        if (this.slimSelect) this.slimSelect.close();
        if (this.flatpickr) this.flatpickr.close();
        this.modal.classList.add('hidden');
        document.body.classList.remove('modal-open');
        this.reset();
    }

    reset() {
        this.form.reset();
        if (this.slimSelect) this.slimSelect.setSelected('');
        if (this.flatpickr) this.flatpickr.clear();
        this.preview.src = '';
        this.preview.classList.add('hidden');
        this.placeholder.classList.remove('hidden');
        if (this._objectUrl) {
            URL.revokeObjectURL(this._objectUrl);
            this._objectUrl = null;
        }
    }

    // Generate a URL-safe slug from a title (strips accents, special chars, etc.)
    generateSlug(title) {
        return title
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9\s-]/g, '')
            .trim()
            .replace(/\s+/g, '-');
    }

    submit() {
        const title = this.titleInput.value.trim();
        const project = this.projectInput.value.trim() || null;
        const category = this.categorySelect.value;
        const image_url = this._objectUrl;
        const artwork_date = this.dateInput.value;
        const description = this.descriptionInput.value.trim();

        // Validate required fields and highlight missing ones briefly
        if (!title || !category || !image_url || !artwork_date || !description) {
            if (!image_url) {
                this.dropzone.classList.add('drag-over');
                setTimeout(() => this.dropzone.classList.remove('drag-over'), 800);
            }
            if (!category) {
                const wrapper = document.getElementById('add-artwork-category-wrapper');
                if (wrapper) {
                    const target = wrapper.querySelector('.ss-main') || wrapper;
                    target.classList.add('force-hover');
                    setTimeout(() => target.classList.remove('force-hover'), 800);
                }
            }
            if (!artwork_date) {
                this.dateInput.classList.add('force-hover');
                setTimeout(() => this.dateInput.classList.remove('force-hover'), 800);
            }
            return;
        }

        const newArtwork = {
            id: `artwork-${Date.now()}`,
            title,
            slug: this.generateSlug(title),
            project,
            category,
            description,
            image_url,
            cloudinary_id: 'none',
            artwork_date,
            createdAt: new Date().toISOString(),
        };

        // Brief success animation on the submit button
        const btn = this.form.querySelector('button[type="submit"]');
        const originalText = btn.textContent;
        btn.textContent = 'Added!';
        btn.classList.add('success');

        setTimeout(() => {
            btn.textContent = originalText;
            btn.classList.remove('success');

            // Detach the objectUrl before closing so reset() doesn't revoke it;
            // the collage still needs it to render the new card's image
            this._objectUrl = null;

            this.close();
            if (this.onAdd) this.onAdd(newArtwork);
        }, 600);
    }
}
