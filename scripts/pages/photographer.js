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
    // Met à jour la liste globale utilisée par la modal
    modalMediaList = mediaList;

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
            mediaTag = `<img src="${mediaSrc}" alt="${media.title}" data-index="${index}"/>`;
        } else if (media.video) {
            mediaTag = `<video controls data-index="${index}"><source src="${mediaSrc}" type="video/mp4"></video>`;
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
              <i class="fa-solid fa-heart like-icon" data-media-id="${media.id}"></i>
            </p>
          </div>
        `;
        albumContainer.appendChild(mediaElement);
    });

    addLikeListeners(mediaList);
    enableMediaModalOpening();
}

// Gestion des clics sur les cœurs
function addLikeListeners(mediaList) {
    const likeIcons = document.querySelectorAll('.like-icon');

    likeIcons.forEach(icon => {
        icon.addEventListener('click', () => {
            const mediaId = icon.getAttribute('data-media-id');
            toggleLike(mediaId, mediaList);
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

// Active l'ouverture de la modale média via clic simple (pas de clavier)
function enableMediaModalOpening() {
    const mediaElements = document.querySelectorAll('.media-card img, .media-card video');
    mediaElements.forEach((element) => {
        element.addEventListener('click', () => {
            const index = parseInt(element.getAttribute('data-index'), 10);
            if (!isNaN(index)) {
                openMediaModal(index);
            }
        });
    });
}

// --- MODALE MEDIA ---

const modal = document.getElementById('media-modal');
const modalContent = modal.querySelector('.media-content');
const btnClose = modal.querySelector('.close-modal');
const btnPrev = modal.querySelector('.left-arrow');
const btnNext = modal.querySelector('.right-arrow');

function openMediaModal(index) {
    modalIndex = index;
    renderModalContent(modalMediaList[modalIndex]);
    modal.style.display = 'flex';
    modal.setAttribute('aria-hidden', 'false');
    modal.focus();
}

function closeMediaModal() {
    modal.style.display = 'none';
    modal.setAttribute('aria-hidden', 'true');
    modalContent.innerHTML = '';
}

btnClose.addEventListener('click', closeMediaModal);

btnPrev.addEventListener('click', () => {
    modalIndex = (modalIndex - 1 + modalMediaList.length) % modalMediaList.length;
    renderModalContent(modalMediaList[modalIndex]);
});

btnNext.addEventListener('click', () => {
    modalIndex = (modalIndex + 1) % modalMediaList.length;
    renderModalContent(modalMediaList[modalIndex]);
});

function renderModalContent(media) {
    const photographerFolder = modalPhotographerName.split(' ')[0];
    let html = '';
    if (media.image) {
        const src = `assets/albums/${photographerFolder}/${media.image}`;
        html = `<img src="${src}" alt="${media.title}">`;
    } else if (media.video) {
        const src = `assets/albums/${photographerFolder}/${media.video}`;
        html = `<video controls><source src="${src}" type="video/mp4"></video>`;
    }
    modalContent.innerHTML = html;

    // Ici on ajoute le titre du média dans la div .media-title
    const mediaTitleDiv = document.querySelector('.media-title');
    if (mediaTitleDiv) {
        mediaTitleDiv.textContent = media.title || '';
    }
}

// Appelle updatePageTitle() quand la page est prête
document.addEventListener('DOMContentLoaded', updatePageTitle);