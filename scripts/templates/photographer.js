function photographerTemplate(data) {
    const { name, portrait, city, country, tagline, price } = data;

    const picture = `assets/photographers/${portrait}`;

    function getUserCardDOM() {
        const article = document.createElement('article');
        const img = document.createElement('img');
        img.setAttribute("src", picture)
        const h2 = document.createElement('h2');
        h2.classList.add('name');
        h2.textContent = name;
        const countryCityContainer = document.createElement('p');
        countryCityContainer.classList.add('countrycity');
        countryCityContainer.textContent = `${city}, ${country}`;
        const taglineContainer = document.createElement('p');
        taglineContainer.classList.add('tagline');
        taglineContainer.textContent = tagline;
        const priceContainer = document.createElement('p');
        priceContainer.classList.add('price');
        priceContainer.textContent = `${price}€/jour`;
        article.appendChild(img);
        article.appendChild(h2);
        article.appendChild(countryCityContainer)
        article.appendChild(taglineContainer)
        article.appendChild(priceContainer)
        return (article);
    }
    return { name, picture, getUserCardDOM }
}