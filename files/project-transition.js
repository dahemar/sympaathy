document.addEventListener('DOMContentLoaded', () => {
    const projectLinks = document.querySelectorAll('.project-link');
    
    projectLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Obtener la URL del proyecto y añadir el parámetro para el efecto
            const projectUrl = link.getAttribute('href');
            const urlWithEffect = projectUrl + (projectUrl.includes('?') ? '&' : '?') + 'showEffect=true';
            
            // Navegar inmediatamente
            window.location.href = urlWithEffect;
        });
    });

    // Verificar si debemos mostrar el efecto en la página de destino
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('showEffect') === 'true') {
        // Añadir las clases de efecto después de la navegación
        document.body.classList.add('electric-transition');
        document.body.classList.add('electric-flicker');
    }
}); 