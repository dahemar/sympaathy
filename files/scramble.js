class TextScramble {
    constructor(el) {
        this.el = el;
        this.chars = '░▒▓│┌┐└┘╭╮╯╰';
        this.update = this.update.bind(this);
    }
    
    setText(newText) {
        const oldText = this.el.innerText;
        const length = Math.max(oldText.length, newText.length);
        const promise = new Promise((resolve) => this.resolve = resolve);
        this.queue = [];
        for (let i = 0; i < length; i++) {
            const from = oldText[i] || '';
            const to = newText[i] || '';
            const start = Math.floor(Math.random() * 30);
            const end = start + Math.floor(Math.random() * 20);
            this.queue.push({ from, to, start, end });
        }
        cancelAnimationFrame(this.frameRequest);
        this.frame = 0;
        this.update();
        return promise;
    }
    
    update() {
        let output = '';
        let complete = 0;
        for (let i = 0, n = this.queue.length; i < n; i++) {
            let { from, to, start, end, char } = this.queue[i];
            if (this.frame >= end) {
                complete++;
                output += to;
            } else if (this.frame >= start) {
                if (!char || Math.random() < 0.15) {
                    char = this.randomChar();
                    this.queue[i].char = char;
                }
                output += `<span class="glitching">${char}</span>`;
            } else {
                output += from;
            }
        }
        this.el.innerHTML = output;
        if (complete === this.queue.length) {
            this.resolve();
        } else {
            this.frameRequest = requestAnimationFrame(this.update);
            this.frame++;
        }
    }
    
    randomChar() {
        return this.chars[Math.floor(Math.random() * this.chars.length)];
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    // Determinar en qué página estamos
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    
    // Seleccionar elementos según la página
    let elements;
    if (currentPage === 'index.html') {
        // En index.html (About), seleccionar todo incluyendo el menú
        elements = document.querySelectorAll('.menu a, h1, h2, h3, .writing-item h3, .project-item h3, .gallery-caption h3');
    } else {
        // En otras páginas, seleccionar todo EXCEPTO el menú
        elements = document.querySelectorAll('h1, h2, h3, .writing-item h3, .project-item h3, .gallery-caption h3');
    }
    
    // Añadir clase scramble a los elementos seleccionados
    elements.forEach(el => {
        if (!el.classList.contains('scramble')) {
            el.classList.add('scramble');
        }
    });

    // Observer para las animaciones
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    const scrambler = new TextScramble(entry.target);
                    entry.target.classList.add('visible');
                    scrambler.setText(entry.target.textContent);
                }, 100 + (index * 50));
                observer.unobserve(entry.target);
            }
        });
    }, { 
        threshold: 0.1,
        rootMargin: '50px'
    });

    // Observar los elementos seleccionados
    document.querySelectorAll('.scramble').forEach(el => observer.observe(el));
}); 