import getPhotographers from "./index.js";

// Variables globales pour la modale
let modalIndex = 0;
let modalMediaList = [];
let modalPhotographerName = "";

// Quand le DOM est prêt, on lance le script principal
document.addEventListener('DOMContentLoaded', updatePageTitle);

// Fonction principale appelée au chargement de la page
async function updatePageTitle() {
    const { photographers, media } = await getPhotographers(); // On récupère les données

    const photographerId = new URLSearchParams(window.location.search).get('id');
    const photographerData = photographers.find(p => p.id == photographerId);
    if (!photographerData) return;

    // Mise à jour du titre de l’onglet et du nom pour la modale
    document.title = `Photographe/${photographerData.name}`;
    modalPhotographerName = photographerData.name;

    // On affiche les infos du photographe dans le header
    document.getElementById('photographer-name').textContent = photographerData.name;
    document.getElementById('photographer-city').textContent = `${photographerData.city}, ${photographerData.country}`;
    document.getElementById('photographer-tagline').textContent = photographerData.tagline;

    const pictureEl = document.getElementById('photographer-picture');
    if (pictureEl) {
        pictureEl.setAttribute('src', `assets/photographers/${photographerData.portrait}`);
        pictureEl.setAttribute('alt', `Portrait de ${photographerData.name}`);
        pictureEl.setAttribute('aria-label', `Portrait de ${photographerData.name}`);
        pictureEl.setAttribute('tabindex', '0');
    }

    // Mise à jour du nom dans la modale
    const modalName = document.getElementById('modal-photographer-name');
    if (modalName) modalName.textContent = photographerData.name;

    // On récupère les médias du photographe
    const photographerMedia = media.filter(m => m.photographerId == photographerId);
    modalMediaList = photographerMedia;

    // On crée le menu déroulant de tri
    displaySortDropdown(photographerMedia, photographerData.name);

    // On trie les médias par popularité par défaut
    const sortedMedia = sortMedia(photographerMedia, "popularity");
    displayMedia(sortedMedia, photographerData.name);
    displayLikesAndPriceBadge(sortedMedia, photographerData.price);
}

// Fonction pour afficher le menu de tri accessible
function displaySortDropdown(mediaList, photographerName) {
    const container = document.createElement('div');
    container.classList.add('filter');

    const label = document.createElement('label');
    label.setAttribute('for', 'custom-select');
    label.textContent = 'Trier par';

    const customSelect = document.createElement('div');
    customSelect.className = 'custom-select';
    customSelect.setAttribute('tabindex', '0');
    customSelect.setAttribute('role', 'listbox');
    customSelect.setAttribute('aria-label', 'Trier les médias');
    customSelect.setAttribute('aria-expanded', 'false');

    const selected = document.createElement('div');
    selected.className = 'selected';
    selected.setAttribute('role', 'button');
    selected.setAttribute('aria-haspopup', 'listbox');
    selected.innerHTML = `Popularité <i class="fa-solid fa-chevron-down chevron-icon" aria-hidden="true"></i>`;

    const optionsList = document.createElement('ul');
    optionsList.className = 'select-options';

    const options = [
        { value: 'popularity', text: 'Popularité' },
        { value: 'date', text: 'Date' },
        { value: 'title', text: 'Titre' }
    ];

    const optionElements = [];

    options.forEach((opt) => {
        const li = document.createElement('li');
        li.textContent = opt.text;
        li.setAttribute('data-value', opt.value);
        li.setAttribute('role', 'option');
        li.setAttribute('tabindex', '-1');
        li.addEventListener('click', () => {
            selectOption(opt.text, opt.value);
        });
        optionsList.appendChild(li);
        optionElements.push(li);
    });

    function selectOption(text, value) {
        selected.innerHTML = `${text} <i class="fa-solid fa-chevron-down chevron-icon" aria-hidden="true"></i>`;
        closeDropdown();
        const sorted = sortMedia(mediaList, value);
        displayMedia(sorted, photographerName);
        displayLikesAndPriceBadge(sorted, getPhotographerPrice());
    }

    let focusedOptionIndex = 0;

    function openDropdown() {
        optionsList.classList.add('show');
        customSelect.setAttribute('aria-expanded', 'true');
        focusedOptionIndex = 0;
        optionElements[focusedOptionIndex].focus();

        const chevron = selected.querySelector('.chevron-icon');
        if (chevron) chevron.classList.add('rotate');
    }

    function closeDropdown() {
        optionsList.classList.remove('show');
        customSelect.setAttribute('aria-expanded', 'false');
        focusedOptionIndex = -1;

        const chevron = selected.querySelector('.chevron-icon');
        if (chevron) chevron.classList.remove('rotate');
    }

    function toggleDropdown() {
        if (optionsList.classList.contains('show')) {
            closeDropdown();
        } else {
            openDropdown();
        }
    }

    selected.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleDropdown();
    });

    customSelect.addEventListener('keydown', (e) => {
        const isOpen = optionsList.classList.contains('show');

        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (!isOpen) {
                openDropdown();
            } else if (focusedOptionIndex >= 0) {
                optionElements[focusedOptionIndex].click();
            }
        } else if (e.key === 'ArrowDown' && isOpen) {
            e.preventDefault();
            focusedOptionIndex = (focusedOptionIndex + 1) % optionElements.length;
            optionElements[focusedOptionIndex].focus();
        } else if (e.key === 'ArrowUp' && isOpen) {
            e.preventDefault();
            focusedOptionIndex = (focusedOptionIndex - 1 + optionElements.length) % optionElements.length;
            optionElements[focusedOptionIndex].focus();
        } else if (e.key === 'Escape' && isOpen) {
            e.preventDefault();
            closeDropdown();
        }
    });

    document.addEventListener('click', (event) => {
        if (!customSelect.contains(event.target)) {
            closeDropdown();
        }
    });

    customSelect.appendChild(selected);
    customSelect.appendChild(optionsList);
    container.appendChild(label);
    container.appendChild(customSelect);

    const albumContainer = document.querySelector('#photographe-album');
    if (albumContainer && albumContainer.parentNode) {
        albumContainer.parentNode.insertBefore(container, albumContainer);
    }
}

function sortMedia(mediaList, criterion) {
    // On clone le tableau original pour ne pas le modifier directement
    const sorted = [...mediaList];

    // Tri par popularité (likes décroissants)
    if (criterion === 'popularity') sorted.sort((a, b) => b.likes - a.likes);

    // Tri par date (les plus récentes en premier)
    else if (criterion === 'date') sorted.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Tri par titre (ordre alphabétique)
    else if (criterion === 'title') sorted.sort((a, b) => a.title.localeCompare(b.title));

    return sorted;
}

function displayMedia(mediaList, photographerName) {
    modalMediaList = mediaList; // Stocke la liste pour l’utiliser dans la modale

    const albumContainer = document.querySelector('#photographe-album');
    if (!albumContainer) return;
    albumContainer.innerHTML = ''; // On vide l’album actuel

    mediaList.forEach((media, index) => {
        const folder = photographerName.split(' ')[0]; // Récupère le prénom du photographe pour le chemin

        // Crée la source d’image ou de vidéo
        const src = media.image
            ? `assets/albums/${folder}/${media.image}`
            : `assets/albums/${folder}/${media.video}`;

        // Balise image ou vidéo
        const mediaTag = media.image
            ? `<img src="${src}" alt="${media.title}" data-index="${index}" tabindex="0" />`
            : `<video controls data-index="${index}" tabindex="0"><source src="${src}" type="video/mp4"></video>`;

        // Création de la carte media
        const article = document.createElement('article');
        article.classList.add('media-card');
        article.setAttribute('tabindex', '0');
        article.innerHTML = `
            ${mediaTag}
            <div class="media-info">
                <h3>${media.title}</h3>
                <p>
                    <span class="like-count">${media.likes}</span>
                    <i class="fa-solid fa-heart like-icon" data-media-id="${media.id}" tabindex="0" role="button" aria-pressed="${media.liked}"></i>
                </p>
            </div>
        `;

        // Active la modale si on fait "Entrée" sur la carte
        article.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') openMediaModal(index);
        });

        albumContainer.appendChild(article);
    });

    addLikeListeners(mediaList); // Active les likes
    enableMediaModalOpening();  // Active l’ouverture de modale au clic
}

function addLikeListeners(mediaList) {
    document.querySelectorAll('.like-icon').forEach(icon => {
        icon.addEventListener('click', () => {
            const mediaId = icon.dataset.mediaId;
            toggleLike(mediaId, mediaList);
        });

        // Like via clavier
        icon.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                e.stopPropagation();
                const id = icon.getAttribute('data-media-id');
                toggleLike(id, mediaList);
            }
        });
    });
}

function toggleLike(mediaId, mediaList) {
    const media = mediaList.find(m => m.id == mediaId); // Trouve le media correspondant
    if (!media) return;

    // Bascule l’état aimé / non aimé
    media.liked = !media.liked;
    media.likes += media.liked ? 1 : -1;

    // Met à jour l'affichage des likes et l’état du bouton
    const icon = document.querySelector(`.like-icon[data-media-id="${mediaId}"]`);
    const count = icon?.previousElementSibling;
    if (count) count.textContent = media.likes;
    if (icon) icon.setAttribute('aria-pressed', media.liked);

    updateTotalLikes(mediaList); // Met à jour le total
}

function updateTotalLikes(mediaList) {
    const total = mediaList.reduce((acc, m) => acc + m.likes, 0);
    const el = document.getElementById('likes-total');
    if (el) el.textContent = total;
}

function displayLikesAndPriceBadge(mediaList, price) {
    // Sélectionne l’élément qui contient les infos likes/prix
    const tab = document.querySelector('.photographe-tab');
    if (!tab) return; // Si l’élément n’existe pas, on quitte la fonction

    // Calcule le total des likes de tous les médias affichés
    const totalLikes = mediaList.reduce((sum, m) => sum + m.likes, 0);
    // Injecte dynamiquement le HTML dans l’élément .photographe-tab
    tab.innerHTML = `
        <div class="photograph-likes-price" aria-live="polite">
            <span class="total-likes">
                <span id="likes-total">${totalLikes}</span>
                <i class="fa-solid fa-heart" aria-label="likes"></i>
            </span>
            <span class="price">${price}€ / jour</span>
        </div>
    `;
}

function getPhotographerPrice() {
    // Sélectionne l’élément contenant le prix
    const el = document.querySelector('.photographe-tab .price');
    // Extrait et convertit le texte en nombre entier, ou retourne 0 si inexistant
    return parseInt(el?.textContent) || 0;
}

// ---- MODALE MEDIA ----

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

btnClose?.addEventListener('click', closeMediaModal);
btnPrev?.addEventListener('click', () => {
    modalIndex = (modalIndex - 1 + modalMediaList.length) % modalMediaList.length;
    renderModalContent(modalMediaList[modalIndex]);
});
btnNext?.addEventListener('click', () => {
    modalIndex = (modalIndex + 1) % modalMediaList.length;
    renderModalContent(modalMediaList[modalIndex]);
});

function renderModalContent(media) {
    const folder = modalPhotographerName.split(' ')[0];
    const src = media.image
        ? `assets/albums/${folder}/${media.image}`
        : `assets/albums/${folder}/${media.video}`;

    modalContent.innerHTML = media.image
        ? `<img src="${src}" alt="${media.title}">`
        : `<video controls autoplay><source src="${src}" type="video/mp4"></video>`;

    const titleDiv = document.querySelector('.media-title');
    if (titleDiv) titleDiv.textContent = media.title || '';
}

function enableMediaModalOpening() {
    document.querySelectorAll('.media-card img, .media-card video').forEach(el => {
        el.addEventListener('click', () => {
            const index = parseInt(el.dataset.index, 10);
            if (!isNaN(index)) openMediaModal(index);
        });
    });
}