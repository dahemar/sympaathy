document.addEventListener('DOMContentLoaded', function() {
    // Seleccionar todas las imágenes
    const images = document.querySelectorAll('img');
    
    // Función para cargar una imagen con un pequeño retraso aleatorio
    function loadImage(img, index) {
        // Retraso aleatorio entre 0 y 300ms para cada imagen
        const delay = Math.random() * 300;
        
        setTimeout(() => {
            if (img.complete) {
                img.classList.add('loaded');
            } else {
                img.addEventListener('load', function() {
                    img.classList.add('loaded');
                });
            }
        }, delay);
    }
    
    // Cargar cada imagen con un retraso
    images.forEach((img, index) => {
        loadImage(img, index);
    });
}); 