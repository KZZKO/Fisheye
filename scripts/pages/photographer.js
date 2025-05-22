import getPhotographers from "./index.js";

// Fonction pour mettre à jour le titre de la page et les informations du photographe
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

        const photographerMedia = media.filter(m => m.photographerId == photographerId);

        displaySortDropdown(photographerMedia, photographerData.name);

        // Trier les médias par popularité dès le début et les afficher
        const sortedMedia = sortMedia(photographerMedia, "popularity");
        displayMedia(sortedMedia, photographerData.name);

        // Afficher le badge des likes et du prix
        displayLikesAndPriceBadge(photographerMedia, photographerData.price);
    } else {
        console.log('Page 404: Photographe non trouvé');
        document.querySelector('#error-message').textContent = "Photographe non trouvé.";
    }
}

// Fonction pour afficher le tri
function displaySortDropdown(mediaList, photographerName) {
    const container = document.createElement('div');
    container.classList.add('filter');
    container.innerHTML = `
        <label for="sort-select">Trier par</label>
        <select id="sort-select">
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

// Fonction pour trier les médias en fonction du critère sélectionné
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

// Fonction pour afficher les médias triés avec gestion des likes cliquables
function displayMedia(mediaList, photographerName) {
    const albumContainer = document.querySelector('#photographe-album');
    if (!albumContainer) {
        console.error("Conteneur des albums introuvable.");
        return;
    }
    albumContainer.innerHTML = '';

    if (!mediaList || mediaList.length === 0) {
        console.log("Aucun média à afficher.");
        return;
    }

    mediaList.forEach(media => {
        const photographerFolder = photographerName.split(' ')[0];

        let mediaSrc;
        if (media.image) {
            mediaSrc = `assets/albums/${photographerFolder}/${media.image}`;
        } else if (media.video) {
            mediaSrc = `assets/albums/${photographerFolder}/${media.video}`;
        }

        let mediaTag;
        if (media.image) {
            mediaTag = `<img src="${mediaSrc}" alt="${media.title}" />`;
        } else if (media.video) {
            mediaTag = `<video controls><source src="${mediaSrc}" type="video/mp4"></video>`;
        }

        // Si la propriété liked n'existe pas encore, on l'initialise à false
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

    // Ajouter gestion des likes après affichage
    addLikeListeners(mediaList);
}

// Fonction pour ajouter les cœurs des médias
function addLikeListeners(mediaList) {
    const likeIcons = document.querySelectorAll('.like-icon');

    likeIcons.forEach(icon => {
        icon.addEventListener('click', () => {
            const mediaId = icon.getAttribute('data-media-id');
            toggleLike(mediaId, mediaList);
        });

        // Pour accessibilité clavier (Entrée / Espace)
        icon.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                const mediaId = icon.getAttribute('data-media-id');
                toggleLike(mediaId, mediaList);
            }
        });
    });
}

// Fonction pour basculer like/unlike et mettre à jour l’interface
function toggleLike(mediaId, mediaList) {
    const media = mediaList.find(m => m.id == mediaId);
    if (!media) return;

    media.liked = !media.liked;

    if (media.liked) {
        media.likes++;
    } else {
        media.likes--;
    }

    // Mise à jour compteur like sur la carte média
    const mediaElement = document.querySelector(`.like-icon[data-media-id="${mediaId}"]`);
    if (mediaElement) {
        const likeCountElement = mediaElement.previousElementSibling;
        if (likeCountElement) {
            likeCountElement.textContent = media.likes;
        }
    }

    // Mise à jour du badge total
    updateTotalLikes(mediaList);
}

// Fonction pour afficher le badge de likes total + tarif journalier
function displayLikesAndPriceBadge(mediaList, pricePerDay) {
    const tabContainer = document.querySelector('.photographe-tab');
    if (!tabContainer) {
        console.error("Conteneur '.photographe-tab' introuvable.");
        return;
    }

    const totalLikes = mediaList.reduce((sum, media) => sum + (media.likes || 0), 0);

    const badgeHTML = `
        <div class="photograph-likes-price">
            <span class="total-likes">
                <span id="likes-total">${totalLikes}</span>
                <i class="fa-solid fa-heart" aria-label="likes"></i>
            </span>
            <span class="price">${pricePerDay}€ / jour</span>
        </div>
    `;

    tabContainer.innerHTML = badgeHTML;
}

// Fonction pour mettre à jour le total des likes dans le badge
function updateTotalLikes(mediaList) {
    const totalLikes = mediaList.reduce((sum, media) => sum + (media.likes || 0), 0);
    const totalLikesElement = document.getElementById('likes-total');
    if (totalLikesElement) {
        totalLikesElement.textContent = totalLikes;
    }
}

// Utilitaire (pour le tri dynamique)
function getPhotographerPrice() {
    const photographerPriceElement = document.querySelector('.photographe-tab .price');
    if (!photographerPriceElement) return 0;
    const priceText = photographerPriceElement.textContent;
    return parseInt(priceText) || 0;
}

updatePageTitle();

// TODO: 
// Faire la modal de visualisation des images et vidéos
// Faire l'accessibilité