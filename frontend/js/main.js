import { artworks } from './services/mockData.js';
import { Collage } from './components/Collage.js';
import { Modal } from './components/Modal.js';

document.addEventListener('DOMContentLoaded', () => {
    const collageContainer = document.getElementById('collage-container');
    const modal = new Modal(artworks);
    
    const collage = new Collage(collageContainer, artworks, (artwork) => {
        modal.open(artwork);
    });

    collage.render();

    // Check URL for deep linking
    const urlParams = new URLSearchParams(window.location.search);
    const obraSlug = urlParams.get('obra');
    if (obraSlug) {
        const targetArt = artworks.find(a => a.slug === obraSlug);
        if (targetArt) {
            // Open without pushing state again since it's already in the URL
            modal.open(targetArt, false);
        }
    }

    // Handle browser Back/Forward buttons (popstate)
    window.addEventListener('popstate', () => {
        const params = new URLSearchParams(window.location.search);
        const slug = params.get('obra');

        if (slug) {
            const targetArt = artworks.find(a => a.slug === slug);
            if (targetArt) {
                modal.open(targetArt, false);
            }
        } else {
            modal.close(false);
        }
    });

    // --- Resume Modal Logic ---
    const resumeBtn = document.getElementById('nav-resume');
    const resumeModal = document.getElementById('resume-modal');
    const resumeClose = document.getElementById('resume-close');
    const resumeOverlay = document.getElementById('resume-overlay');

    const openResume = () => {
        resumeModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden'; // Prevent scrolling
    };

    const closeResume = () => {
        resumeModal.classList.add('hidden');
        document.body.style.overflow = '';
    };

    resumeBtn.addEventListener('click', openResume);
    resumeClose.addEventListener('click', closeResume);
    resumeOverlay.addEventListener('click', closeResume);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !resumeModal.classList.contains('hidden')) {
            closeResume();
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

        // Prevent button from overlapping the footer
        const footer = document.querySelector('.footer');
        if (footer && backToTopBtn.classList.contains('visible')) {
            const footerRect = footer.getBoundingClientRect();
            if (footerRect.top < window.innerHeight) {
                const overlap = window.innerHeight - footerRect.top;
                backToTopBtn.style.transform = `translateY(-${overlap}px)`;
            } else {
                backToTopBtn.style.transform = '';
            }
        }
    });

    backToTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
});
