import getPhotographers from "./index.js";

let modalIndex = 0;
let modalMediaList = [];
let modalPhotographerName = "";

document.addEventListener('DOMContentLoaded', updatePageTitle);

async function updatePageTitle() {
    const { photographers, media } = await getPhotographers();

    const photographerId = new URLSearchParams(window.location.search).get('id');
    const photographerData = photographers.find(p => p.id == photographerId);
    if (!photographerData) return;

    document.title = `Photographe/${photographerData.name}`;
    modalPhotographerName = photographerData.name;

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

    const modalName = document.getElementById('modal-photographer-name');
    if (modalName) modalName.textContent = photographerData.name;

    const photographerMedia = media.filter(m => m.photographerId == photographerId);
    modalMediaList = photographerMedia;

    displaySortDropdown(photographerMedia, photographerData.name);

    const sortedMedia = sortMedia(photographerMedia, "popularity");
    displayMedia(sortedMedia, photographerData.name);
    displayLikesAndPriceBadge(sortedMedia, photographerData.price);
}

function displaySortDropdown(mediaList, photographerName) {
    const container = document.createElement('div');
    container.classList.add('filter');

    const label = document.createElement('label');
    label.setAttribute('for', 'sort-select');
    label.textContent = 'Trier par';

    const select = document.createElement('select');
    select.setAttribute('id', 'sort-select');
    select.setAttribute('aria-label', 'Trier les médias');

    const options = [
        { value: 'popularity', text: 'Popularité' },
        { value: 'date', text: 'Date' },
        { value: 'title', text: 'Titre' }
    ];

    options.forEach(opt => {
        const option = document.createElement('option');
        option.value = opt.value;
        option.textContent = opt.text;
        if (opt.value === 'popularity') option.selected = true;
        select.appendChild(option);
    });

    select.addEventListener('change', (e) => {
        const criterion = e.target.value;
        const sorted = sortMedia(mediaList, criterion);
        displayMedia(sorted, photographerName);
        displayLikesAndPriceBadge(sorted, getPhotographerPrice());
    });

    container.appendChild(label);
    container.appendChild(select);

    const albumContainer = document.querySelector('#photographe-album');
    if (albumContainer && albumContainer.parentNode) {
        albumContainer.parentNode.insertBefore(container, albumContainer);
    }

    // Accessibilité : mise en évidence du focus clavier
    select.addEventListener('focus', () => {
        select.classList.add('select-focused');
    });
    select.addEventListener('blur', () => {
        select.classList.remove('select-focused');
    });
}

function sortMedia(mediaList, criterion) {
    const sorted = [...mediaList];
    if (criterion === 'popularity') sorted.sort((a, b) => b.likes - a.likes);
    else if (criterion === 'date') sorted.sort((a, b) => new Date(b.date) - new Date(a.date));
    else if (criterion === 'title') sorted.sort((a, b) => a.title.localeCompare(b.title));
    return sorted;
}

function displayMedia(mediaList, photographerName) {
    modalMediaList = mediaList;
    const albumContainer = document.querySelector('#photographe-album');
    if (!albumContainer) return;
    albumContainer.innerHTML = '';

    mediaList.forEach((media, index) => {
        const folder = photographerName.split(' ')[0];
        const src = media.image ? `assets/albums/${folder}/${media.image}` : `assets/albums/${folder}/${media.video}`;

        const mediaTag = media.image
            ? `<img src="${src}" alt="${media.title}" data-index="${index}" tabindex="0" />`
            : `<video controls data-index="${index}" tabindex="0"><source src="${src}" type="video/mp4"></video>`;

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

        article.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') openMediaModal(index);
        });

        albumContainer.appendChild(article);
    });

    addLikeListeners(mediaList);
    enableMediaModalOpening();
}

function addLikeListeners(mediaList) {
    document.querySelectorAll('.like-icon').forEach(icon => {
        icon.addEventListener('click', () => {
            const mediaId = icon.dataset.mediaId;
            toggleLike(mediaId, mediaList);
        });
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
    const media = mediaList.find(m => m.id == mediaId);
    if (!media) return;
    media.liked = !media.liked;
    media.likes += media.liked ? 1 : -1;

    const icon = document.querySelector(`.like-icon[data-media-id="${mediaId}"]`);
    const count = icon?.previousElementSibling;
    if (count) count.textContent = media.likes;
    if (icon) icon.setAttribute('aria-pressed', media.liked);

    updateTotalLikes(mediaList);
}

function updateTotalLikes(mediaList) {
    const total = mediaList.reduce((acc, m) => acc + m.likes, 0);
    const el = document.getElementById('likes-total');
    if (el) el.textContent = total;
}

function displayLikesAndPriceBadge(mediaList, price) {
    const tab = document.querySelector('.photographe-tab');
    if (!tab) return;
    const totalLikes = mediaList.reduce((sum, m) => sum + m.likes, 0);
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
    const el = document.querySelector('.photographe-tab .price');
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