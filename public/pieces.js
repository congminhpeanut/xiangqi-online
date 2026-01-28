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
    'bge': { char: '將', color: '#111' }, // Darker black for better contrast
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

    const isRed = data.color === '#d00';
    // Subtle gradient colors
    const woodLight = '#f6e4c4';
    const woodDark = '#deb887';

    // We can use a unique ID for gradients per piece type or just generic ones if defined in HTML. 
    // Since we are returning strings, let's embed the standard defs once or use inline styles.
    // Simpler: inline radial gradient in style attribute or defs inside each SVG (a bit redundant but safe).

    return `
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <radialGradient id="grad-${type}" cx="30%" cy="30%" r="70%">
                <stop offset="0%" style="stop-color:${woodLight};stop-opacity:1" />
                <stop offset="100%" style="stop-color:${woodDark};stop-opacity:1" />
            </radialGradient>
            <filter id="shadow-${type}">
                <feDropShadow dx="2" dy="2" stdDeviation="2" flood-color="#000" flood-opacity="0.3"/>
            </filter>
        </defs>
        
        <!-- Main Body with Gradient -->
        <circle cx="50" cy="50" r="45" fill="url(#grad-${type})" stroke="${data.color}" stroke-width="4" filter="url(#shadow-${type})" />
        
        <!-- Inner Groove -->
        <circle cx="50" cy="50" r="36" fill="none" stroke="${data.color}" stroke-width="2" opacity="0.6" />
        
        <!-- Character -->
        <text x="50" y="68" font-family="'KaiTi', 'SimKai', 'Kaiti SC', 'STKaiti', serif" font-size="48" fill="${data.color}" text-anchor="middle" font-weight="bold" style="text-shadow: 1px 1px 0px rgba(255,255,255,0.4);">${data.char}</text>
    </svg>
    `;
}
