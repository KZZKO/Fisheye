export default function photographerTemplate(data) {
    const { name, portrait, city, country, tagline, price, id } = data;
    const picture = `assets/photographers/${portrait}`;

    function getUserCardDOM() {
        const article = document.createElement('article');
        article.setAttribute('tabindex', '0');
        article.setAttribute('aria-label', `Carte du photographe ${name}`);

        // Bloc lien focusable (img + h2)
        const linkContainer = document.createElement('div');
        linkContainer.classList.add('photographertop');
        linkContainer.setAttribute('tabindex', '0');
        linkContainer.setAttribute('role', 'link');
        linkContainer.setAttribute('aria-label', `Voir la page du photographe ${name}`);

        linkContainer.addEventListener('click', () => {
            window.location.href = `photographer.html?id=${id}`;
        });

        linkContainer.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                window.location.href = `photographer.html?id=${id}`;
            }
        });

        const img = document.createElement('img');
        img.setAttribute("src", picture);
        img.setAttribute("alt", `Portrait de ${name}`);

        const h2 = document.createElement('h2');
        h2.classList.add('name');
        h2.textContent = name;

        linkContainer.appendChild(img);
        linkContainer.appendChild(h2);

        // Bloc texte (ville, slogan, prix)
        const textContainer = document.createElement('div');
        textContainer.classList.add('photographerbot');
        textContainer.setAttribute('tabindex', '0');
        textContainer.setAttribute('aria-label', `Informations de ${name}`);

        const countryCityContainer = document.createElement('p');
        countryCityContainer.classList.add('countrycity');
        countryCityContainer.textContent = `${city}, ${country}`;

        const taglineContainer = document.createElement('p');
        taglineContainer.classList.add('tagline');
        taglineContainer.textContent = tagline;

        const priceContainer = document.createElement('p');
        priceContainer.classList.add('price');
        priceContainer.textContent = `${price}€/jour`;

        textContainer.appendChild(countryCityContainer);
        textContainer.appendChild(taglineContainer);
        textContainer.appendChild(priceContainer);

        article.appendChild(linkContainer);
        article.appendChild(textContainer);

        return article;
    }

    return { name, picture, getUserCardDOM };
}