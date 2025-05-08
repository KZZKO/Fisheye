// Récupérer l'ID du photographe depuis l'URL
const urlParams = new URLSearchParams(window.location.search);
const photographerId = urlParams.get('id');

// Fonction pour récupérer les photographes
async function getPhotographers() {
    try {
        const response = await fetch('data/photographers.json');
        const data = await response.json();
        return data.photographers;
    } catch (error) {
        console.error('Erreur lors du chargement des photographes :', error);
        return [];
    }
}

// Fonction pour récupérer les médias
async function getMedia() {
    try {
        const response = await fetch('data/photographers.json');
        const data = await response.json();
        return data.media;
    } catch (error) {
        console.error('Erreur lors du chargement des médias :', error);
        return [];
    }
}

// Fonction principale
async function updatePageTitle() {
    const photographers = await getPhotographers();
    const media = await getMedia();

    const photographerData = photographers.find(p => p.id == photographerId);

    if (photographerData) {
        // MAJ infos photographe
        document.title = `Photographe/${photographerData.name}`;
        document.querySelector('#photographer-name').textContent = photographerData.name;
        document.querySelector('#photographer-city').textContent = `${photographerData.city}, ${photographerData.country}`;
        document.querySelector('#photographer-tagline').textContent = photographerData.tagline;
        document.querySelector('#photographer-picture').setAttribute('src', `assets/photographers/${photographerData.portrait}`);

        // Récupérer ses médias
        const photographerMedia = media.filter(m => m.photographerId == photographerId);

        // Afficher le menu de tri
        displaySortDropdown(photographerMedia);
        displayMedia(photographerMedia); // affichage initial par popularité

    } else {
        console.log('Page 404: Photographe non trouvé');
    }
}

// Injecte le menu déroulant de tri
function displaySortDropdown(mediaList) {
    const container = document.createElement('div');
    container.innerHTML = `
        <label for="sort-select">Trier par</label>
        <select id="sort-select">
            <option value="popularity">Popularité</option>
            <option value="date">Date</option>
            <option value="title">Titre</option>
        </select>
    `;

    const albumContainer = document.querySelector('#photographe-album');
    albumContainer.before(container);

    document.getElementById('sort-select').addEventListener('change', (e) => {
        const criterion = e.target.value;
        sortAndDisplayMedia(mediaList, criterion);
    });
}

// Trie et affiche les médias
function sortAndDisplayMedia(mediaList, criterion) {
    let sortedMedia = [...mediaList];

    if (criterion === 'popularity') {
        sortedMedia.sort((a, b) => b.likes - a.likes);
    } else if (criterion === 'date') {
        sortedMedia.sort((a, b) => new Date(b.date) - new Date(a.date));
    } else if (criterion === 'title') {
        sortedMedia.sort((a, b) => a.title.localeCompare(b.title));
    }

    displayMedia(sortedMedia);
}

// Affiche les médias dans le DOM
function displayMedia(mediaList) {
    const albumContainer = document.querySelector('#photographe-album');
    albumContainer.innerHTML = '';

    mediaList.forEach(media => {
        const mediaElement = document.createElement('article');
        mediaElement.classList.add('media-card');

        const mediaSrc = media.image
            ? `assets/media/${media.image}`
            : `assets/media/${media.video}`;

        const mediaTag = media.image
            ? `<img src="${mediaSrc}" alt="${media.title}" />`
            : `<video controls><source src="${mediaSrc}" type="video/mp4"></video>`;

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

// TODO: Finir le filtre et la gallery