import { artworks } from './services/mockData.js';
import { Collage } from './components/Collage.js';
import { Modal } from './components/Modal.js';
import { Admin } from './components/AdminAuth.js';
import { AddArtwork } from './components/AddArtwork.js';
import { config } from './config.js';

document.addEventListener('DOMContentLoaded', () => {
    // Initialize config values in DOM
    const initConfig = () => {
        const setEl = (id, text) => {
            const el = document.getElementById(id);
            if (el) el.textContent = text;
        };
        const setAttr = (id, attr, val) => {
            const el = document.getElementById(id);
            if (el) el.setAttribute(attr, val);
        };
        
        setEl('config-name', config.name);
        setEl('config-role', config.role);
        setEl('config-resume-name', config.name);
        setEl('config-resume-role', config.role);
        setEl('config-login-subtitle', config.name);
        setEl('config-copyright', `© ${config.year} ${config.name}. All rights reserved.`);
        
        setAttr('config-contact', 'href', `mailto:${config.email}`);
        setAttr('config-footer-contact', 'href', `mailto:${config.email}`);
        setEl('config-footer-contact', `Drop me a line at ${config.email}`);
        document.title = `${config.role} Portfolio - ${config.name}`;
        
        const categories = config.categories || [];
        const popSelect = (id) => {
            const sel = document.getElementById(id);
            if (!sel) return;
            const firstOpt = sel.options[0];
            sel.innerHTML = '';
            sel.appendChild(firstOpt);
            categories.forEach(cat => {
                const opt = document.createElement('option');
                opt.value = cat;
                opt.textContent = cat;
                sel.appendChild(opt);
            });
        };
        popSelect('add-artwork-category');
        popSelect('modal-category-select');
    };
    initConfig();
    if ('scrollRestoration' in history) {
        history.scrollRestoration = 'manual';
    }

    // Shared sort comparator: most recent artwork first (#1)
    const byDateDesc = (a, b) => new Date(b.artwork_date) - new Date(a.artwork_date);

    // Helper to read the current artwork slug from the URL (#4)
    const getUrlSlug = () => new URLSearchParams(window.location.search).get('obra');

    const collageContainer = document.getElementById('collage-container');
    const modal = new Modal(artworks);
    const admin = new Admin();
    const addArtworkModal = new AddArtwork((newArtwork) => {
        artworks.push(newArtwork);
        artworks.sort(byDateDesc);
        collage.render();
    });

    // Sort artworks from most recent to oldest before the initial render
    artworks.sort(byDateDesc);

    const collage = new Collage(collageContainer, artworks, (artwork) => {
        modal.open(artwork);
    });

    collage.render();

    // Check URL for deep linking
    const obraSlug = getUrlSlug();
    if (obraSlug) {
        const targetArt = artworks.find(a => a.slug === obraSlug);
        if (targetArt) {
            // Open without pushing state again since it's already in the URL
            modal.open(targetArt, false);
        }
    }


    // --- Resume Modal Logic ---
    const resumeBtn = document.getElementById('nav-resume');
    const resumeModal = document.getElementById('resume-modal');
    const resumeClose = document.getElementById('resume-close');
    const resumeOverlay = document.getElementById('resume-overlay');

    const resumeContent = document.getElementById('resume-content');

    const openResume = (pushHistory = true) => {
        resumeContent.scrollTop = 0;
        resumeModal.classList.remove('hidden');
        document.documentElement.style.overflow = 'hidden'; // Prevent scrolling (#2)
        if (pushHistory) {
            window.history.pushState({ resume: true }, '', window.location.pathname + '#resume');
        }
    };

    const closeResume = (pushHistory = true) => {
        resumeModal.classList.add('hidden');
        document.documentElement.style.overflow = ''; // (#2)
        if (pushHistory) {
            window.history.pushState(null, '', window.location.pathname);
        }
    };

    resumeBtn.addEventListener('click', () => openResume(true));
    resumeClose.addEventListener('click', () => closeResume(true));
    resumeOverlay.addEventListener('click', () => closeResume(true));

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !resumeModal.classList.contains('hidden')) {
            closeResume(true);
        }
    });

    if (window.location.hash === '#resume') {
        openResume(false);
    }

    // Handle browser Back/Forward buttons (popstate)
    window.addEventListener('popstate', () => {
        const slug = getUrlSlug(); // (#4)

        if (window.location.hash === '#resume') {
            openResume(false);
        } else {
            if (!resumeModal.classList.contains('hidden')) {
                closeResume(false);
            }
            if (slug) {
                const targetArt = artworks.find(a => a.slug === slug);
                if (targetArt) {
                    modal.open(targetArt, false);
                }
            } else {
                modal.close(false);
            }
        }
    });

    // --- Back to top button logic ---
    const backToTopBtn = document.getElementById('back-to-top');

    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) {
            backToTopBtn.classList.add('visible');
        } else {
            backToTopBtn.classList.remove('visible');
        }
    }, { passive: true });

    // CSS now natively handles pinning the button above the footer using position: sticky.

    backToTopBtn.addEventListener('click', (e) => {
        e.preventDefault();
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });

    // Force trigger during momentum scroll on mobile
    backToTopBtn.addEventListener('touchstart', (e) => {
        e.preventDefault(); // Prevents the OS from swallowing the tap to stop scroll
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }, { passive: false });

    // --- Admin Delete Logic (Mock) ---
    const confirmModal = document.getElementById('confirm-modal');
    const confirmOverlay = document.getElementById('confirm-overlay');
    const confirmCancel = document.getElementById('confirm-cancel');
    const confirmDelete = document.getElementById('confirm-delete');
    const confirmArtTitle = document.getElementById('confirm-art-title');
    let artworkToDelete = null;

    document.addEventListener('requestDeleteArtwork', (e) => {
        artworkToDelete = e.detail;
        confirmArtTitle.textContent = artworkToDelete.title;
        confirmModal.classList.remove('hidden');
    });

    const closeConfirmModal = () => {
        confirmModal.classList.add('hidden');
        artworkToDelete = null;
    };

    if (confirmOverlay) confirmOverlay.addEventListener('click', closeConfirmModal);
    if (confirmCancel) confirmCancel.addEventListener('click', closeConfirmModal);

    if (confirmDelete) confirmDelete.addEventListener('click', () => {
        if (artworkToDelete) {
            // Mock deletion: remove from artworks array and re-render
            const index = artworks.findIndex(a => a.id === artworkToDelete.id);
            if (index > -1) {
                artworks.splice(index, 1);
                collage.render(); // Re-render the grid without the deleted item
            }
            closeConfirmModal();
        }
    });

    // --- Add Artwork button ---
    const addArtworkBtn = document.getElementById('add-artwork-btn');
    if (addArtworkBtn) {
        addArtworkBtn.addEventListener('click', () => {
            addArtworkModal.open();
        });
    }
});
