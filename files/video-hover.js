document.addEventListener('DOMContentLoaded', function() {
    const projectLinks = document.querySelectorAll('.project-link');
    
    projectLinks.forEach(link => {
        const video = link.querySelector('.hover-video');
        if (video) {
            link.addEventListener('mouseenter', () => {
                video.play();
            });
            
            link.addEventListener('mouseleave', () => {
                video.pause();
                video.currentTime = 0;
            });
        }
    });
}); 