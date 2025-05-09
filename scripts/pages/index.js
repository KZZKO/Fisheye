import photographerTemplate from "../templates/photographer.js";

export default async function getPhotographers() {
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

function displayData(photographers) {
    const photographersSection = document.querySelector(".photographer_section");
    photographers.forEach((photographer) => {
        const photographerModel = photographerTemplate(photographer);
        const userCardDOM = photographerModel.getUserCardDOM();
        photographersSection.appendChild(userCardDOM);
    });
}

async function init() {
    // Récupère les datas des photographes
    const { photographers } = await getPhotographers();
    displayData(photographers);
}

if (document.querySelector(".photographer_section")) {
    init();
}