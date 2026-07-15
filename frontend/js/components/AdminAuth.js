export class Admin {
    constructor() {
        this.modal = document.getElementById('login-modal');
        this.closeBtn = document.getElementById('login-close');
        this.form = document.getElementById('login-form');
        this.overlay = document.getElementById('login-overlay');

        if (this.modal && this.form) {
            this.initEventListeners();
        }
    }

    initEventListeners() {
        // Keyboard shortcut: Ctrl + Shift + A
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 's') {
                e.preventDefault();
                this.toggleModal();
            }
        });

        // Close modal
        if (this.closeBtn) {
            this.closeBtn.addEventListener('click', () => this.closeModal());
        }
        if (this.overlay) {
            this.overlay.addEventListener('click', () => this.closeModal());
        }

        // Handle Form Submission (Mock Authentication)
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.authenticate();
        });
    }

    toggleModal() {
        // If already in admin mode, the shortcut acts as a logout toggle
        if (document.body.classList.contains('admin-mode')) {
            this.logout();
            return;
        }

        if (this.modal.classList.contains('hidden')) {
            this.modal.classList.remove('hidden');
            // Focus the email input
            setTimeout(() => {
                const emailInput = document.getElementById('admin-email');
                if (emailInput) emailInput.focus();
            }, 100);
        } else {
            this.closeModal();
        }
    }

    logout() {
        console.log("Admin logged out.");
        document.body.classList.remove('admin-mode');
        // Let other components know admin mode is off
        document.dispatchEvent(new CustomEvent('adminModeDeactivated'));
        // Reload page to reset state
        window.location.reload();
    }

    closeModal() {
        this.modal.classList.add('hidden');
    }

    authenticate() {
        const passInput = document.getElementById('admin-pass');
        const password = passInput.value;

        // Mock authentication: any input activates admin mode
        if (password.length > 0) {
            console.log("Admin authenticated (Mock). Enabling Admin Mode...");
            document.body.classList.add('admin-mode');
            this.closeModal();
            passInput.value = ''; // clear password

            this.loadAdminAssets().then(() => {
                // Dispatch event to let other components know admin mode is on
                document.dispatchEvent(new CustomEvent('adminModeActivated'));
            }).catch(err => {
                console.error("Failed to load admin assets:", err);
            });
        }
    }

    loadAdminAssets() {
        const assets = [
            { type: 'css', url: 'https://cdn.jsdelivr.net/npm/slim-select@2/dist/slimselect.css' },
            { type: 'js', url: 'https://cdn.jsdelivr.net/npm/slim-select@2/dist/slimselect.min.js' },
            { type: 'css', url: 'https://cdn.jsdelivr.net/npm/flatpickr/dist/flatpickr.min.css' },
            { type: 'js', url: 'https://cdn.jsdelivr.net/npm/flatpickr' }
        ];

        const loadPromises = assets.map(asset => {
            return new Promise((resolve, reject) => {
                if (asset.type === 'css') {
                    if (document.querySelector(`link[href="${asset.url}"]`)) return resolve();
                    const link = document.createElement('link');
                    link.rel = 'stylesheet';
                    link.href = asset.url;
                    link.onload = resolve;
                    link.onerror = reject;
                    const customStyles = document.querySelector('link[href="./assets/css/gallery.css"]');
                    if (customStyles) {
                        document.head.insertBefore(link, customStyles);
                    } else {
                        document.head.appendChild(link);
                    }
                } else if (asset.type === 'js') {
                    if (document.querySelector(`script[src="${asset.url}"]`)) return resolve();
                    const script = document.createElement('script');
                    script.src = asset.url;
                    script.onload = resolve;
                    script.onerror = reject;
                    document.head.appendChild(script);
                }
            });
        });

        return Promise.all(loadPromises);
    }
}
