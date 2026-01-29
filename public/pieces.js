const PIECES = {
    // Red Pieces
    'rge': { char: '帥', color: '#d00' },
    'rad': { char: '仕', color: '#d00' },
    'rel': { char: '相', color: '#d00' },
    'rma': { char: '傌', color: '#d00' },
    'rro': { char: '俥', color: '#d00' },
    'rca': { char: '炮', color: '#d00' },
    'rso': { char: '兵', color: '#d00' },

    // Black Pieces
    'bge': { char: '將', color: '#111' },
    'bad': { char: '士', color: '#111' },
    'bel': { char: '象', color: '#111' },
    'bma': { char: '馬', color: '#111' },
    'bro': { char: '車', color: '#111' },
    'bca': { char: '砲', color: '#111' },
    'bso': { char: '卒', color: '#111' }
};

function getPieceSVG(type) {
    const data = PIECES[type];
    if (!data) return '';

    // Premium Wood Gradient Colors
    const woodLight = '#f0d09c';
    const woodDark = '#d4a66a';

    return `
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <!-- References global defs in index.html -->
        
        <!-- Drop Shadow Group -->
        <g filter="url(#piece-shadow)">
            <!-- Main Body -->
            <circle cx="50" cy="50" r="44" fill="url(#grad-wood)"/>
            
            <!-- Outer Ring (Bevel) -->
            <circle cx="50" cy="50" r="44" fill="none" stroke="url(#grad-bevel)" stroke-width="2"/>
            
            <!-- Inner Ring (Groove) -->
            <circle cx="50" cy="50" r="36" fill="none" stroke="#8b5a2b" stroke-width="1.5" opacity="0.8"/>
            <circle cx="50" cy="50" r="32" fill="none" stroke="#8b5a2b" stroke-width="0.5" opacity="0.6"/>
        </g>
        
        <!-- Engraved Character -->
        <text x="50" y="66" 
            font-family="'KaiTi', 'SimKai', 'Kaiti SC', 'STKaiti', serif" 
            font-size="44" 
            fill="${data.color}" 
            text-anchor="middle" 
            font-weight="bold" 
            style="text-shadow: 0px 1px 0px rgba(255,255,255,0.3), 0px -1px 0px rgba(0,0,0,0.2); filter: url(#engrave);">
            ${data.char}
        </text>
    </svg>
    `;
}
