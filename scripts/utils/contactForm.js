function displayModal() {
    const modal = document.getElementById('contact_modal');
    modal.style.display = 'block';

    const photographerName = document.getElementById('photographer-name').textContent;
    document.getElementById('modal-photographer-name').textContent = photographerName;
}

function closeModal() {
    const modal = document.getElementById('contact_modal');
    modal.style.display = 'none';
}

function submitcontact(event) {
    event.preventDefault();

    const prenom = document.getElementById('prenom').value;
    const nom = document.getElementById('nom').value;
    const email = document.getElementById('email').value;
    const message = document.getElementById('message').value;
    const form = document.querySelector('form');

    console.log('Prénom :', prenom);
    console.log('Nom :', nom);
    console.log('Email :', email);
    console.log('Message :', message);
    console.log('Formulaire envoyée avec succés');

    if (prenom && nom && email && message > '') {
        form.reset();
    }

    closeModal();
}