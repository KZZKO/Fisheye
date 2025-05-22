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

    // Inputs
    const prenomInput = document.getElementById('prenom');
    const nomInput = document.getElementById('nom');
    const emailInput = document.getElementById('email');
    const messageInput = document.getElementById('message');

    const prenom = prenomInput.value.trim();
    const nom = nomInput.value.trim();
    const email = emailInput.value.trim();
    const message = messageInput.value.trim();

    // Fonctions utilitaires
    function validateEmail(email) {
        const regex = /^[\w.-]+@[\w.-]+\.\w{2,}$/;
        return regex.test(email);
    }

    function showError(inputElement, message) {
        const error = document.createElement('div');
        error.className = 'form-error';
        error.textContent = message;
        inputElement.parentNode.insertBefore(error, inputElement.nextSibling);
    }

    function clearErrors() {
        document.querySelectorAll('.form-error').forEach(error => error.remove());
    }

    // Nettoyer les erreurs précédentes
    clearErrors();

    // Validation
    let isValid = true;

    if (prenom.length < 2) {
        showError(prenomInput, 'Le prénom doit contenir au moins 2 caractères.');
        isValid = false;
    }

    if (nom.length < 2) {
        showError(nomInput, 'Le nom doit contenir au moins 2 caractères.');
        isValid = false;
    }

    if (!validateEmail(email)) {
        showError(emailInput, 'Veuillez entrer un email valide.');
        isValid = false;
    }

    if (message.length < 10) {
        showError(messageInput, 'Le message doit contenir au moins 10 caractères.');
        isValid = false;
    }

    if (!isValid) return;

    // Envoi
    console.log('Prénom :', prenom);
    console.log('Nom :', nom);
    console.log('Email :', email);
    console.log('Message :', message);
    console.log('Formulaire envoyé avec succès');

    document.querySelector('form').reset();
    closeModal();
}