import { config } from '../config.js';

export class Modal {
    /**
     * @param {Array} artworks - Full database of artworks to enable project grouping
     */
    constructor(artworks = []) {
        this.artworks = artworks;
        this.currentProjectGroup = [];
        this.currentIndex = 0;

        // Base modal elements
        this.modal = document.getElementById('artwork-modal');
        this.overlay = document.getElementById('modal-overlay');
        this.closeBtn = document.getElementById('modal-close');

        // Share elements
        this.shareBtn = document.getElementById('modal-share');
        this.shareText = document.getElementById('modal-share-text');

        // Navigation arrows
        this.prevBtn = document.getElementById('modal-prev');
        this.nextBtn = document.getElementById('modal-next');

        // Data elements
        this.image = document.getElementById('modal-image');
        this.title = document.getElementById('modal-title');
        this.category = document.getElementById('modal-category');
        this.categorySelect = document.getElementById('modal-category-select');
        this.description = document.getElementById('modal-description');
        this.date = document.getElementById('modal-date');
        this.datePicker = document.getElementById('modal-date-picker');
        this.saveBtn = document.getElementById('modal-save-btn');

        // Prevent selecting future dates
        const today = new Date().toISOString().split('T')[0];
        this.datePicker.setAttribute('max', today);

        this.textPane = document.querySelector('.modal__text-pane');

        // Fullscreen elements
        this.fullscreenView = document.getElementById('fullscreen-view');
        this.fullscreenImage = document.getElementById('fullscreen-image');



        this.initEvents();
    }

    initEvents() {
        this.closeBtn.addEventListener('click', () => this.close());
        this.overlay.addEventListener('click', () => this.close());

        this.shareBtn.addEventListener('click', () => {
            const currentArt = this.currentProjectGroup[this.currentIndex];

            if (navigator.share) {
                this.shareBtn.classList.add('success');
                this.shareText.innerHTML = '&nbsp;:&nbsp&nbsp&nbsp&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;)';
                this.shareText.classList.remove('hidden');

                navigator.share({
                    title: currentArt.title,
                    text: `Check out ${currentArt.title} on ${config.name}'s portfolio`,
                    url: window.location.href
                }).then(() => {
                    this.shareBtn.classList.remove('success');
                    this.shareText.classList.add('hidden');
                }).catch(err => {
                    this.shareBtn.classList.remove('success');
                    this.shareText.classList.add('hidden');
                    console.error('Share cancelled or failed: ', err);
                });
            } else {
                navigator.clipboard.writeText(window.location.href).then(() => {
                    this.shareBtn.classList.add('success');
                    this.shareText.textContent = 'Copied!';
                    this.shareText.classList.remove('hidden');
                    setTimeout(() => {
                        this.shareBtn.classList.remove('success');
                        this.shareText.classList.add('hidden');
                    }, 1000);
                }).catch(err => {
                    console.error('Failed to copy link: ', err);
                });
            }
        });

        this.prevBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.prev();
        });

        this.nextBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.next();
        });

        this.image.addEventListener('click', () => this.openFullscreen());

        this.fullscreenView.addEventListener('click', (e) => {
            if (e.target === this.fullscreenView) this.closeFullscreen();
        });

        document.addEventListener('keydown', (e) => {
            if (this.modal.classList.contains('hidden')) return;

            if (e.key === 'Escape') {
                if (!this.fullscreenView.classList.contains('hidden')) {
                    this.closeFullscreen();
                    return;
                }
                if (!this.modal.classList.contains('hidden')) {
                    this.close();
                }
            }

            if (!this.modal.classList.contains('hidden') && this.fullscreenView.classList.contains('hidden')) {
                if (document.activeElement.isContentEditable || document.activeElement.tagName === 'INPUT') return;

                if (e.key === 'ArrowLeft') this.prev();
                if (e.key === 'ArrowRight') this.next();
            }
        });

        const enforceLimit = (element, maxLimit) => {
            element.addEventListener('keydown', (e) => {
                const allowedKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Tab'];
                if (allowedKeys.includes(e.key) || e.ctrlKey || e.metaKey) return;

                if (element.innerText.length >= maxLimit) {
                    e.preventDefault();
                }
            });
            element.addEventListener('paste', (e) => {
                e.preventDefault();
                const text = (e.clipboardData || window.clipboardData).getData('text');
                const remaining = maxLimit - element.innerText.length;
                if (remaining > 0) {
                    const selection = window.getSelection();
                    if (!selection.rangeCount) return;
                    const range = selection.getRangeAt(0);
                    range.deleteContents();
                    const textNode = document.createTextNode(text.substring(0, remaining));
                    range.insertNode(textNode);
                    range.setStartAfter(textNode);
                    range.setEndAfter(textNode);
                    selection.removeAllRanges();
                    selection.addRange(range);
                }
            });
            element.addEventListener('input', () => {
                element.style.outline = '';
            });
        };

        enforceLimit(this.title, 100);
        enforceLimit(this.description, 2000);

        // Admin mode listeners
        document.addEventListener('adminModeActivated', () => {
            this.title.contentEditable = true;
            this.description.contentEditable = true;

            if (typeof SlimSelect !== 'undefined' && !this.slimSelect && this.categorySelect) {
                this.slimSelect = new SlimSelect({
                    select: this.categorySelect,
                    settings: { showSearch: false, closeOnSelect: true },
                    events: {
                        afterChange: () => {
                            if (document.activeElement) document.activeElement.blur();
                        }
                    }
                });
                
                // If the modal is already open and showing an artwork, set its category
                if (this.currentProjectGroup.length > 0 && this.currentProjectGroup[this.currentIndex]) {
                    this.slimSelect.setSelected(this.currentProjectGroup[this.currentIndex].category);
                }
            }

            if (typeof flatpickr !== 'undefined' && !this.flatpickr) {
                this.flatpickr = flatpickr(this.datePicker, {
                    dateFormat: 'Y-m-d',
                    maxDate: 'today',
                    disableMobile: true,
                });
                if (this.datePicker.value) {
                    this.flatpickr.setDate(this.datePicker.value);
                }
            }
        });

        document.addEventListener('adminModeDeactivated', () => {
            this.title.contentEditable = false;
            this.description.contentEditable = false;
        });

        const saveEdits = () => {
            if (!this.currentProjectGroup || this.currentProjectGroup.length === 0) return;

            // Validate required fields
            let hasError = false;
            const titleText = this.title.innerText.trim();
            const descText = this.description.innerText.trim();

            this.title.style.outline = '';
            this.description.style.outline = '';

            if (!titleText) {
                this.title.style.outline = '2px solid rgba(255, 71, 87, 0.9)';
                hasError = true;
            }
            if (!descText) {
                this.description.style.outline = '2px solid rgba(255, 71, 87, 0.9)';
                hasError = true;
            }

            if (hasError) return;

            const currentArt = this.currentProjectGroup[this.currentIndex];
            currentArt.title = titleText;
            currentArt.category = this.categorySelect ? this.categorySelect.value : this.category.innerText;
            this.category.innerText = currentArt.category;
            currentArt.description = descText;
            currentArt.artwork_date = this.datePicker.value;
            this.date.textContent = 'Created on ' + currentArt.artwork_date;

            // Visual feedback
            const originalText = this.saveBtn.textContent;
            this.saveBtn.textContent = 'Saved!';
            this.saveBtn.classList.add('success');

            setTimeout(() => {
                this.saveBtn.textContent = originalText;
                this.saveBtn.classList.remove('success');
                this.close(); // Close the modal
            }, 600);
        };

        this.saveBtn.addEventListener('click', saveEdits);

        // Flatpickr handles calendar opening on click

        // Blur select after choosing an option so hover state clears immediately
        this.categorySelect.addEventListener('change', () => {
            this.categorySelect.blur();
        });

        // Close Flatpickr calendar when scrolling the text pane to prevent it from floating
        if (this.textPane) {
            this.textPane.addEventListener('scroll', () => {
                if (this.flatpickr && this.flatpickr.isOpen) {
                    this.flatpickr.close();
                }
            });
        }
    }

    /**
     * @param {Object} artwork 
     * @param {boolean} pushHistory - Whether to push a new state to browser history
     */
    open(artwork, pushHistory = true) {
        if (artwork.project) {
            this.currentProjectGroup = this.artworks.filter(a => a.project === artwork.project);
            this.currentIndex = this.currentProjectGroup.findIndex(a => a.id === artwork.id);
        } else {
            this.currentProjectGroup = [artwork];
            this.currentIndex = 0;
        }

        const isCurrentlyHidden = this.modal.classList.contains('hidden');

        this.updateUI(pushHistory);

        if (isCurrentlyHidden) {
            this.originalHtmlOverflow = document.documentElement.style.overflow;
            document.documentElement.style.overflow = 'hidden';

            document.body.classList.add('modal-open');
        }

        this.modal.classList.remove('hidden');
    }

    /**
     * @param {boolean} pushHistory 
     */
    updateUI(pushHistory = true) {
        const currentArt = this.currentProjectGroup[this.currentIndex];

        this.image.src = currentArt.image_url;
        this.image.alt = currentArt.title;
        this.title.innerText = currentArt.title;
        this.category.innerText = currentArt.category;
        if (this.categorySelect) {

            const existingCustom = this.categorySelect.querySelector('option[data-custom]');
            if (existingCustom) existingCustom.remove();

            // If the artwork's category is not in the list, add it temporarily
            const exists = Array.from(this.categorySelect.options).some(opt => opt.value === currentArt.category);
            if (!exists && currentArt.category) {
                const customOpt = document.createElement('option');
                customOpt.value = currentArt.category;
                customOpt.textContent = currentArt.category;
                customOpt.setAttribute('data-custom', 'true');
                this.categorySelect.insertBefore(customOpt, this.categorySelect.firstChild);
            }
            this.categorySelect.value = currentArt.category;
            if (this.slimSelect) {
                this.slimSelect.setSelected(currentArt.category);
            }
        }
        this.description.innerText = currentArt.description;
        this.date.textContent = 'Created on ' + currentArt.artwork_date;
        this.datePicker.placeholder = currentArt.artwork_date || 'Date';
        this.datePicker.value = currentArt.artwork_date;
        if (this.flatpickr) {
            this.flatpickr.setDate(currentArt.artwork_date);
        }

        const isAdmin = document.body.classList.contains('admin-mode');
        this.title.contentEditable = isAdmin;
        this.description.contentEditable = isAdmin;

        if (this.currentProjectGroup.length > 1) {
            this.prevBtn.classList.remove('hidden');
            this.nextBtn.classList.remove('hidden');
        } else {
            this.prevBtn.classList.add('hidden');
            this.nextBtn.classList.add('hidden');
        }

        if (pushHistory) {
            const newUrl = window.location.pathname + '?obra=' + currentArt.slug;
            window.history.pushState({ slug: currentArt.slug }, '', newUrl);
        }

        if (this.textPane) {
            this.textPane.scrollTop = 0;
        }
    }

    next() {
        if (this.currentProjectGroup.length <= 1) return;
        this.currentIndex = (this.currentIndex + 1) % this.currentProjectGroup.length;
        this.updateUI();
    }

    prev() {
        if (this.currentProjectGroup.length <= 1) return;
        this.currentIndex = (this.currentIndex - 1 + this.currentProjectGroup.length) % this.currentProjectGroup.length;
        this.updateUI();
    }

    close(pushHistory = true) {
        if (this.slimSelect) this.slimSelect.close();
        if (this.flatpickr) this.flatpickr.close();
        if (!pushHistory) {
            this.modal.style.transition = 'none';
            const content = this.modal.querySelector('.modal__content');
            if (content) content.style.transition = 'none';
        }

        if (pushHistory) {
            window.history.pushState(null, '', window.location.pathname);
        }

        const cleanup = () => {
            document.documentElement.style.overflow = this.originalHtmlOverflow || '';
            document.body.classList.remove('modal-open');

            this.modal.classList.add('hidden');
            this.image.src = '';
            this.currentProjectGroup = [];
            this.currentIndex = 0;

            if (!pushHistory) {
                requestAnimationFrame(() => {
                    this.modal.style.transition = '';
                    const content = this.modal.querySelector('.modal__content');
                    if (content) content.style.transition = '';
                });
            }
        };

        if (!pushHistory) {
            cleanup();
        } else {
            this.modal.classList.add('hidden');
            setTimeout(cleanup, 400);
        }
    }

    openFullscreen() {
        this.fullscreenImage.src = this.image.src;
        this.fullscreenImage.alt = this.image.alt;
        this.fullscreenView.classList.remove('hidden');
    }

    closeFullscreen() {
        this.fullscreenView.classList.add('hidden');
        setTimeout(() => {
            this.fullscreenImage.src = '';
        }, 300);
    }
}
