export class AddArtwork {
    /**
     * @param {Function} onAdd - Callback(artwork) called when a new artwork is submitted
     */
    constructor(onAdd) {
        this.onAdd = onAdd;
        this._objectUrl = null;

        this.modal = document.getElementById('add-artwork-modal');
        this.overlay = document.getElementById('add-artwork-overlay');
        this.closeBtn = document.getElementById('add-artwork-close');
        this.form = document.getElementById('add-artwork-form');
        this.dropzone = document.getElementById('add-artwork-dropzone');
        this.fileInput = document.getElementById('add-artwork-file');
        this.preview = document.getElementById('add-artwork-preview');
        this.placeholder = document.getElementById('add-artwork-placeholder');

        this.titleInput = document.getElementById('add-artwork-title');
        this.projectInput = document.getElementById('add-artwork-project');
        this.categorySelect = document.getElementById('add-artwork-category');
        this.dateInput = document.getElementById('add-artwork-date');
        this.descriptionInput = document.getElementById('add-artwork-description');

        this.initEvents();
    }

    initEvents() {
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

        // Blur category select after selecting so hover state clears
        this.categorySelect.addEventListener('change', () => {
            this.categorySelect.blur();
        });

        // Flatpickr manages opening the calendar on click — no manual showPicker() needed

        // ── Image upload 

        // Click on image pane opens file picker
        this.dropzone.addEventListener('click', () => {
            this.fileInput.click();
        });

        // File selected via picker
        this.fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) this.loadPreview(file);
        });

        // Drag and drop
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

    /**
     * @param {File} file
     */
    loadPreview(file) {
        // Revoke previous object URL to avoid memory leaks
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
        document.documentElement.style.overflow = 'hidden';
        setTimeout(() => this.titleInput.focus(), 100);
    }

    close() {
        if (this.slimSelect) this.slimSelect.close();
        if (this.flatpickr) this.flatpickr.close();
        this.modal.classList.add('hidden');
        document.documentElement.style.overflow = '';
        this.reset();
    }

    reset() {
        this.form.reset();
        // Reset Slim Select and Flatpickr to blank state
        if (this.slimSelect) this.slimSelect.setSelected('');
        if (this.flatpickr) this.flatpickr.clear();
        // Clear image preview
        this.preview.src = '';
        this.preview.classList.add('hidden');
        this.placeholder.classList.remove('hidden');
        if (this._objectUrl) {
            URL.revokeObjectURL(this._objectUrl);
            this._objectUrl = null;
        }
    }

    /**
     * Generates a URL-safe slug from a title string
     * @param {string} title
     * @returns {string}
     */
    generateSlug(title) {
        return title
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // strip accents
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

        // Visual feedback on button
        const btn = this.form.querySelector('button[type="submit"]');
        const originalText = btn.textContent;
        btn.textContent = 'Added!';
        btn.classList.add('success');

        setTimeout(() => {
            btn.textContent = originalText;
            btn.classList.remove('success');

            // Detach objectUrl before closing so reset() doesn't revoke it —
            // the collage still needs it to render the image.
            this._objectUrl = null;

            this.close();
            if (this.onAdd) this.onAdd(newArtwork);
        }, 600);
    }
}
