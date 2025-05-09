// Fonction pour mettre à jour le titre de la page et les informations du photographe
async function updatePageTitle() {
    const { photographers, media } = await getData();
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
    } else {
        console.log('Page 404: Photographe non trouvé');
        document.querySelector('#error-message').textContent = "Photographe non trouvé.";
    }
}

// Fonction pour obtenir les données
async function getData() {
    try {
        const response = await fetch('data/photographers.json');
        const data = await response.json();
        return {
            photographers: data.photographers,
            media: data.media
        };
    } catch (error) {
        console.error('Erreur lors du chargement des données :', error);
        document.querySelector('#error-message').textContent = "Désolé, une erreur est survenue lors du chargement des données.";
        return {
            photographers: [],
            media: []
        };
    }
}

// Fonction pour afficher le tri
function displaySortDropdown(mediaList, photographerName) {
    const container = document.createElement('div');
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
        sortedMedia.sort((a, b) => {
            const likesA = Number(a.likes) || 0;
            const likesB = Number(b.likes) || 0;
            return likesB - likesA;
        });
    } else if (criterion === 'date') {
        sortedMedia.sort((a, b) => {
            const dateA = a.date ? new Date(a.date) : 0;
            const dateB = b.date ? new Date(b.date) : 0;
            return dateB - dateA;
        });
    } else if (criterion === 'title') {
        sortedMedia.sort((a, b) => a.title.localeCompare(b.title));
    }

    return sortedMedia;
}

// Fonction pour afficher les médias triés
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

        const mediaElement = document.createElement('article');
        mediaElement.classList.add('media-card');
        mediaElement.innerHTML = `
            ${mediaTag}
            <div class="media-info">
                <h3>${media.title}</h3>
                <p>${media.likes} ❤️</p>
            </div>
        `;
        albumContainer.appendChild(mediaElement);
    });
}

updatePageTitle();

// TODO: 
// Réduire de taille les images et convertir en webp
// Changer le coeur par une icon fontawesome
// Faire le css du filtre
// Faire le css de la gallery
// Faire la modal de visualisation des images et vidéos
// Faire la modal contact et régler son ouverture
// Faire le petit encadrer en bas à droite
// Faire l'accessibilité