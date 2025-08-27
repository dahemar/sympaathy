import { useEffect, useRef, useState } from 'react'

class TextScramble {
    constructor(el) {
        this.el = el;
        this.chars = '░▒▓│┌┐└┘╭╮╯╰';
        this.update = this.update.bind(this);
        this.isAnimating = false;
    }
    
    setText(newText) {
        if (this.isAnimating) return Promise.resolve();
        
        this.isAnimating = true;
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
            this.isAnimating = false;
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

export function useScramble(text, delay = 0) {
    const elementRef = useRef(null);
    const [isVisible, setIsVisible] = useState(false);
    const scramblerRef = useRef(null);

    useEffect(() => {
        if (!elementRef.current) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting && !isVisible) {
                        setIsVisible(true);
                        
                        // Delay the scramble animation
                        const timer = setTimeout(() => {
                            try {
                                const el = elementRef.current;
                                if (!el) return;
                                
                                // Set initial text and make visible
                                el.textContent = text;
                                el.classList.add('visible');
                                
                                // Create and start scramble
                                if (!scramblerRef.current) {
                                    scramblerRef.current = new TextScramble(el);
                                }
                                scramblerRef.current.setText(text);
                            } catch (error) {
                                console.log('Scramble error:', error);
                            }
                        }, delay);
                        
                        // Cleanup timer if component unmounts
                        return () => clearTimeout(timer);
                    }
                });
            },
            {
                threshold: 0.1, // Trigger when 10% of element is visible
                rootMargin: '0px 0px -50px 0px' // Start animation slightly before element is fully visible
            }
        );

        observer.observe(elementRef.current);

        return () => {
            if (elementRef.current) {
                observer.unobserve(elementRef.current);
            }
        };
    }, [text, delay, isVisible]);

    return elementRef;
}
