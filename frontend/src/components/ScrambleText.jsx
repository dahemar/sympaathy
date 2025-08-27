import { useScramble } from '../hooks/useScramble.js'

export function ScrambleText({ children, className = '', delay = 0, tag: Tag = 'span' }) {
    const ref = useScramble(children, delay);
    
    return (
        <Tag ref={ref} className={`scramble ${className}`}>
            {children}
        </Tag>
    );
}
