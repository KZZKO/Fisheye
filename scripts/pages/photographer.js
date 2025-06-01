import getPhotographers from "./index.js";

// Modal media globale (pour visualisation images/vidéos)
let modalIndex = 0;
let modalMediaList = [];
let modalPhotographerName = "";

// Mise à jour du titre, infos photographe + affichage média
async function updatePageTitle() {
    const { photographers, media } = await getPhotographers();

    const photographerId = new URLSearchParams(window.location.search).get('id');
    const photographerData = photographers.find(p => p.id == photographerId);

    if (photographerData) {
        document.title = `Photographe/${photographerData.name}`;
        document.querySelector('#photographer-name').textContent = photographerData.name;
        document.querySelector('#photographer-city').textContent = `${photographerData.city}, ${photographerData.country}`;
        document.querySelector('#photographer-tagline').textContent = photographerData.tagline;
        document.querySelector('#photographer-picture').setAttribute('src', `assets/photographers/${photographerData.portrait}`);

        modalPhotographerName = photographerData.name;

        const photographerMedia = media.filter(m => m.photographerId == photographerId);
        modalMediaList = photographerMedia;

        displaySortDropdown(photographerMedia, photographerData.name);

        // Tri initial par popularité
        const sortedMedia = sortMedia(photographerMedia, "popularity");
        displayMedia(sortedMedia, photographerData.name);

        displayLikesAndPriceBadge(photographerMedia, photographerData.price);

        // Mettre à jour le nom dans la modal de contact
        document.getElementById('modal-photographer-name').textContent = photographerData.name;

    } else {
        console.log('Page 404: Photographe non trouvé');
        document.querySelector('#error-message').textContent = "Photographe non trouvé.";
    }
}

// Affiche le select de tri
function displaySortDropdown(mediaList, photographerName) {
    const container = document.createElement('div');
    container.classList.add('filter');
    container.innerHTML = `
        <label for="sort-select">Trier par</label>
        <select id="sort-select" aria-label="Trier les médias">
            <option value="popularity" selected>Popularité</option>
            <option value="date">Date</option>
            <option value="title">Titre</option>
        </select>
    `;

    const albumContainer = document.querySelector('#photographe-album');
    if (albumContainer) {
        albumContainer.before(container);

        const sortSelect = document.getElementById('sort-select');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                const criterion = e.target.value;
                const sortedMedia = sortMedia(mediaList, criterion);
                displayMedia(sortedMedia, photographerName);
                displayLikesAndPriceBadge(sortedMedia, getPhotographerPrice());
            });
        }
    }
}

// Trie selon critère
function sortMedia(mediaList, criterion) {
    if (!mediaList || mediaList.length === 0) {
        console.error('Aucun média trouvé.');
        return [];
    }

    let sortedMedia = [...mediaList];

    if (criterion === 'popularity') {
        sortedMedia.sort((a, b) => (Number(b.likes) || 0) - (Number(a.likes) || 0));
    } else if (criterion === 'date') {
        sortedMedia.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
    } else if (criterion === 'title') {
        sortedMedia.sort((a, b) => a.title.localeCompare(b.title));
    }

    return sortedMedia;
}

// Affiche les médias et active gestion likes + ouverture modal media
function displayMedia(mediaList, photographerName) {
    const albumContainer = document.querySelector('#photographe-album');
    if (!albumContainer) {
        console.error("Conteneur des albums introuvable.");
        return;
    }
    albumContainer.innerHTML = '';

    if (!mediaList || mediaList.length === 0) {
        albumContainer.textContent = "Aucun média à afficher.";
        return;
    }

    mediaList.forEach((media, index) => {
        const photographerFolder = photographerName.split(' ')[0];

        let mediaSrc;
        if (media.image) {
            mediaSrc = `assets/albums/${photographerFolder}/${media.image}`;
        } else if (media.video) {
            mediaSrc = `assets/albums/${photographerFolder}/${media.video}`;
        }

        let mediaTag;
        if (media.image) {
            mediaTag = `<img src="${mediaSrc}" alt="${media.title}" tabindex="0" role="button" aria-label="Voir ${media.title} en grand" data-index="${index}"/>`;
        } else if (media.video) {
            mediaTag = `<video controls tabindex="0" role="button" aria-label="Voir la vidéo ${media.title} en grand" data-index="${index}"><source src="${mediaSrc}" type="video/mp4"></video>`;
        }

        if (media.liked === undefined) {
            media.liked = false;
        }

        const mediaElement = document.createElement('article');
        mediaElement.classList.add('media-card');
        mediaElement.innerHTML = `
            ${mediaTag}
            <div class="media-info">
                <h3>${media.title}</h3>
                <p>
                    <span class="like-count">${media.likes}</span>
                    <i class="fa-solid fa-heart like-icon" tabindex="0" role="button" aria-label="Ajouter un like" data-media-id="${media.id}"></i>
                </p>
            </div>
        `;
        albumContainer.appendChild(mediaElement);
    });

    addLikeListeners(mediaList);
    addMediaModalListeners(mediaList);
}

// Gestion des clics sur les cœurs
function addLikeListeners(mediaList) {
    const likeIcons = document.querySelectorAll('.like-icon');

    likeIcons.forEach(icon => {
        icon.addEventListener('click', () => {
            const mediaId = icon.getAttribute('data-media-id');
            toggleLike(mediaId, mediaList);
        });

        icon.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                const mediaId = icon.getAttribute('data-media-id');
                toggleLike(mediaId, mediaList);
            }
        });
    });
}

// Toggle like / unlike
function toggleLike(mediaId, mediaList) {
    const media = mediaList.find(m => m.id == mediaId);
    if (!media) return;

    media.liked = !media.liked;
    media.likes += media.liked ? 1 : -1;

    const mediaElement = document.querySelector(`.like-icon[data-media-id="${mediaId}"]`);
    if (mediaElement) {
        const likeCountElement = mediaElement.previousElementSibling;
        if (likeCountElement) likeCountElement.textContent = media.likes;
    }

    updateTotalLikes(mediaList);
}

// Affiche le badge likes total + prix
function displayLikesAndPriceBadge(mediaList, pricePerDay) {
    const tabContainer = document.querySelector('.photographe-tab');
    if (!tabContainer) {
        console.error("Conteneur '.photographe-tab' introuvable.");
        return;
    }

    const totalLikes = mediaList.reduce((sum, media) => sum + (media.likes || 0), 0);

    tabContainer.innerHTML = `
        <div class="photograph-likes-price" aria-live="polite">
            <span class="total-likes">
                <span id="likes-total">${totalLikes}</span>
                <i class="fa-solid fa-heart" aria-label="likes"></i>
            </span>
            <span class="price">${pricePerDay}€ / jour</span>
        </div>
    `;
}

// Met à jour total likes dans le badge
function updateTotalLikes(mediaList) {
    const totalLikes = mediaList.reduce((sum, media) => sum + (media.likes || 0), 0);
    const totalLikesElement = document.getElementById('likes-total');
    if (totalLikesElement) {
        totalLikesElement.textContent = totalLikes;
    }
}

// Récupère le prix du photographe affiché
function getPhotographerPrice() {
    const priceEl = document.querySelector('.photographe-tab .price');
    if (!priceEl) return 0;
    const priceText = priceEl.textContent;
    return parseInt(priceText) || 0;
}

// ------------------
// MODAL VISUALISATION MÉDIA
// ------------------

// Création dynamique de la modal média (une seule modal globale)
function createMediaModal() {
    if (document.getElementById('media_modal')) return;

    const modalDiv = document.createElement('div');
    modalDiv.id = 'media_modal';
    modalDiv.classList.add('media-modal');
    modalDiv.setAttribute('aria-hidden', 'true');
    modalDiv.setAttribute('role', 'dialog');
    modalDiv.setAttribute('aria-label', 'Visualisation média');
    modalDiv.innerHTML = `
        <button class="prev-media fa-solid fa-chevron-left" aria-label="Média précédent"></button>
        <div class="media-content" tabindex="0"></div>
        <button class="next-media fa-solid fa-chevron-right" aria-label="Média suivant"></button>
        <button class="close-modal fa-solid fa-xmark" aria-label="Fermer la modal"></button>
    `;

    document.body.appendChild(modalDiv);

    // Listeners boutons
    modalDiv.querySelector('.close-modal').addEventListener('click', closeMediaModal);
    modalDiv.querySelector('.prev-media').addEventListener('click', showPreviousMedia);
    modalDiv.querySelector('.next-media').addEventListener('click', showNextMedia);

    // Gestion clavier
    modalDiv.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeMediaModal();
        if (e.key === 'ArrowLeft') showPreviousMedia();
        if (e.key === 'ArrowRight') showNextMedia();
    });
}

// Ouvre la modal et affiche média index donné
function openMediaModal(index) {
    createMediaModal();
    modalIndex = index;

    const modalDiv = document.getElementById('media_modal');
    modalDiv.setAttribute('aria-hidden', 'false');
    modalDiv.style.display = 'flex';

    displayModalMedia(modalIndex);

    // Focus sur le contenu média
    modalDiv.querySelector('.media-content').focus();
}

// Ferme modal
function closeMediaModal() {
    const modalDiv = document.getElementById('media_modal');
    if (!modalDiv) return;

    modalDiv.setAttribute('aria-hidden', 'true');
    modalDiv.style.display = 'none';

    // Focus retour sur le premier média (ou autre élément)
    const albumContainer = document.querySelector('#photographe-album');
    if (albumContainer) albumContainer.querySelector('img, video')?.focus();
}

// Affiche média actuel dans modal
function displayModalMedia(index) {
    const media = modalMediaList[index];
    if (!media) return;

    const modalContent = document.querySelector('#media_modal .media-content');
    if (!modalContent) return;

    const photographerFolder = modalPhotographerName.split(' ')[0];
    let mediaSrc;
    let mediaHtml = '';

    if (media.image) {
        mediaSrc = `assets/albums/${photographerFolder}/${media.image}`;
        mediaHtml = `<img src="${mediaSrc}" alt="${media.title}" />`;
    } else if (media.video) {
        mediaSrc = `assets/albums/${photographerFolder}/${media.video}`;
        mediaHtml = `<video controls autoplay><source src="${mediaSrc}" type="video/mp4"></video>`;
    }

    modalContent.innerHTML = `
        <h3 class="modal-media-title">${media.title}</h3>
        ${mediaHtml}
    `;
}

// Affiche média précédent
function showPreviousMedia() {
    modalIndex = (modalIndex - 1 + modalMediaList.length) % modalMediaList.length;
    displayModalMedia(modalIndex);
}

// Affiche média suivant
function showNextMedia() {
    modalIndex = (modalIndex + 1) % modalMediaList.length;
    displayModalMedia(modalIndex);
}

// Ajoute gestion clic + clavier pour ouvrir modal media
function addMediaModalListeners(mediaList) {
    const albumContainer = document.querySelector('#photographe-album');
    if (!albumContainer) return;

    // Cibler les images et vidéos avec tabindex et data-index
    const mediaElements = albumContainer.querySelectorAll('img[role="button"], video[role="button"]');

    mediaElements.forEach(el => {
        el.addEventListener('click', () => {
            const index = parseInt(el.getAttribute('data-index'));
            openMediaModal(index);
        });

        el.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                const index = parseInt(el.getAttribute('data-index'));
                openMediaModal(index);
            }
        });
    });
}

updatePageTitle();