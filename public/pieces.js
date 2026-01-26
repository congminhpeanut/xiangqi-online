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
    'bge': { char: '將', color: '#000' },
    'bad': { char: '士', color: '#000' },
    'bel': { char: '象', color: '#000' },
    'bma': { char: '馬', color: '#000' },
    'bro': { char: '車', color: '#000' },
    'bca': { char: '砲', color: '#000' },
    'bso': { char: '卒', color: '#000' }
};

function getPieceSVG(type) {
    const data = PIECES[type];
    if (!data) return '';

    return `
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="45" fill="#eecfa1" stroke="${data.color}" stroke-width="3" />
        <circle cx="50" cy="50" r="38" fill="none" stroke="${data.color}" stroke-width="1" />
        <text x="50" y="65" font-family="KaiTi, SimKai, serif" font-size="50" fill="${data.color}" text-anchor="middle" font-weight="bold">${data.char}</text>
    </svg>
    `;
}
