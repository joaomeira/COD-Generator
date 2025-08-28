// ======================
// Textos PT/EN
// ======================
const texts = {
    pt: {
        title: "CODIGOS WARZONE",
        instruction: "Insira um código com números e curingas (ex: 1xx3yy) para gerar combinações:",
        generateBtn: "Gerar Códigos",
        bunkerTitle: "Códigos do Bunker",
        mapTitle: "Mapa interativo dos Bunkers",
        instruction2: "Use Ctrl + rolagem do mouse para ampliar. Pinça no celular.",
        codeError: "O código deve ter exatamente {length} posições.",
        combinacoes: "Total de combinações",
        langToggle: "PT"
    },
    en: {
        title: "WARZONE CODE'S",
        instruction: "Enter a code with numbers and wildcards (e.g. 1xx3yy) to generate combinations:",
        generateBtn: "Generate Codes",
        bunkerTitle: "Bunker Codes",
        mapTitle: "Interative Bunkers Map",
        instruction2: "Use Ctrl + mouse scroll to zoom. Pinch on mobile.",
        codeError: "The code must have exactly {length} characters.",
        combinacoes: "Total combinations",
        langToggle: "EN"
    }
};

let currentLang = document.documentElement.lang || 'pt';

function updateTexts() {
    document.getElementById('title').textContent = texts[currentLang].title;
    document.getElementById('instruction').textContent = texts[currentLang].instruction;
    document.getElementById('instruction2').textContent = texts[currentLang].instruction2;
    document.getElementById('generateBtn').textContent = texts[currentLang].generateBtn;
    document.getElementById('bunkerTitle').textContent = texts[currentLang].bunkerTitle;
    document.getElementById('mapTitle').textContent = texts[currentLang].mapTitle;
    document.getElementById('langToggle').textContent = texts[currentLang].langToggle;
}

// ======================
// Funções principais
// ======================
function getSelectedLength() {
    const radios = document.getElementsByName("codeLength");
    for (const r of radios) {
        if (r.checked) return parseInt(r.value);
    }
    return 6;
}

function generateCodes() {
    const inputCode = document.getElementById('codeInput').value.trim();
    const resultsDiv = document.getElementById('results');
    const codeLength = getSelectedLength();
    resultsDiv.innerHTML = '';

    const positions = Array.from(inputCode);
    if (positions.length !== codeLength) {
        resultsDiv.innerHTML = `<span class="error">${texts[currentLang].codeError.replace("{length}", codeLength)}</span>`;
        return;
    }

    const usedDigits = new Set();
    const groups = {};
    const hyphens = [];

    positions.forEach((char, i) => {
        if (char >= '0' && char <= '9') usedDigits.add(char);
        else if (char === '-') hyphens.push(i);
        else {
            if (!groups[char]) groups[char] = [];
            groups[char].push(i);
        }
    });

    const allDigits = Array.from('0123456789');
    const availableDigits = allDigits.filter(d => !usedDigits.has(d));
    const codes = [];

    // Preencher "-" (traços independentes, sem repetição)
    function fillHyphens(prefix, idx, remainingDigits) {
        if (idx === hyphens.length) {
            fillGroups(prefix);
            return;
        }
        const pos = hyphens[idx];
        for (let i = 0; i < remainingDigits.length; i++) {
            const digit = remainingDigits[i];
            const nextPrefix = [...prefix];
            nextPrefix[pos] = digit;
            const nextAvailable = remainingDigits.slice(0, i).concat(remainingDigits.slice(i + 1));
            fillHyphens(nextPrefix, idx + 1, nextAvailable);
        }
    }

    // Preencher grupos
    function fillGroups(codeArray) {
        const groupKeys = Object.keys(groups);
        if (groupKeys.length === 0) {
            codes.push(codeArray.join(''));
            return;
        }

        function backtrack(idx, current) {
            if (idx === groupKeys.length) {
                const finalCode = [...codeArray];
                for (const g in current) {
                    for (const pos of groups[g]) finalCode[pos] = current[g];
                }
                codes.push(finalCode.join(''));
                return;
            }
            const group = groupKeys[idx];
            for (const digit of availableDigits) {
                if (Object.values(current).includes(digit)) continue;
                current[group] = digit;
                backtrack(idx + 1, current);
                delete current[group];
            }
        }

        backtrack(0, {});
    }

    fillHyphens([...positions], 0, availableDigits);

    resultsDiv.innerHTML = `<p>${texts[currentLang].combinacoes}: <b>${codes.length}</b></p>`;
    if (codes.length > 0) resultsDiv.innerHTML += '<ol>' + codes.map(c => `<li>${c}</li>`).join('') + '</ol>';
}

// ======================
// CSV
// ======================

let csvPath = '../bunkers_code.csv'; // padrão PT

if (currentLang == 'pt') {
    csvPath = 'bunkers_code.csv';
}

function displayCodesTable() {
    fetch(csvPath)
        .then(resp => resp.ok ? resp.text() : Promise.reject())
        .then(csvData => {
            const lines = csvData.trim().split('\n');
            const headers = lines[0].split(',');
            let html = '<table class="bunker-table"><thead><tr>';
            headers.forEach(h => html += `<th>${h.trim()}</th>`);
            html += '</tr></thead><tbody>';
            for (let i = 1; i < lines.length; i++) {
                const cells = lines[i].split(',');
                html += '<tr>';
                cells.forEach(c => html += `<td>${c.trim()}</td>`);
                html += '</tr>';
            }
            html += '</tbody></table>';
            document.getElementById('codesTable').innerHTML = html;
        })
        .catch(() => {
            document.getElementById('codesTable').innerHTML = '<span class="error">Não foi possível carregar a tabela.</span>';
        });
}

// ======================
// Teclado virtual
// ======================
function createKeyboard() {
    const keyboard = document.getElementById("keyboard");
    const keys = [
        ["7","8","9","<<"],
        ["4","5","6","CLEAR"],
        ["1","2","3","-"],
        ["*","0","#","."],
        ["C","N","T","ENTER"]
    ];
    keys.forEach(row => {
        const div = document.createElement("div");
        row.forEach(key => {
            const btn = document.createElement("button");
            btn.textContent = key;
            btn.onclick = () => handleKeyPress(key);
            div.appendChild(btn);
        });
        keyboard.appendChild(div);
    });
}

function handleKeyPress(key) {
    const input = document.getElementById("codeInput");
    if (key === "<<") input.value = input.value.slice(0, -1);
    else if (key === "CLEAR") input.value = "";
    else if (key === "ENTER") generateCodes();
    else input.value += key;
}

const img = document.getElementById('verdanskMap');
const container = img.parentElement;

let scale = 1;
let originX = 0, originY = 0;
let dragStartX = 0, dragStartY = 0;
let startX = 0, startY = 0;
let isDragging = false;

img.ondragstart = () => false;

function clampTranslate() {
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    const imgWidth = img.naturalWidth * scale;
    const imgHeight = img.naturalHeight * scale;

    // horizontal
    if (imgWidth <= containerWidth) {
        originX = 0; // centraliza
    } else {
        const maxX = (imgWidth - containerWidth) / 2;
        const minX = -maxX;
        originX = Math.min(maxX, Math.max(minX, originX));
    }

    // vertical
    if (imgHeight <= containerHeight) {
        originY = 0; // centraliza
    } else {
        const maxY = (imgHeight - containerHeight) / 2;
        const minY = -maxY;
        originY = Math.min(maxY, Math.max(minY, originY));
    }
}

function updateTransform() {
    clampTranslate();
    img.style.transform = `translate(${originX}px, ${originY}px) scale(${scale})`;
}

// Drag PC
img.addEventListener('mousedown', e => {
    e.preventDefault();
    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
    dragStartX = originX;
    dragStartY = originY;
    img.style.cursor = 'grabbing';
});
window.addEventListener('mouseup', () => {
    isDragging = false;
    img.style.cursor = 'grab';
});
window.addEventListener('mousemove', e => {
    if (!isDragging) return;
    originX = dragStartX + (e.clientX - startX);
    originY = dragStartY + (e.clientY - startY);
    updateTransform();
});

// Zoom PC
img.addEventListener('wheel', e => {
    if (!e.ctrlKey) return;
    e.preventDefault();
    const prevScale = scale;
    scale = Math.min(Math.max(0.5, scale - e.deltaY*0.005), 5);

    // centralizar zoom no mouse
    const rect = img.getBoundingClientRect();
    const offsetX = e.clientX - rect.left - rect.width/2;
    const offsetY = e.clientY - rect.top - rect.height/2;
    originX -= offsetX * (scale - prevScale)/scale;
    originY -= offsetY * (scale - prevScale)/scale;

    updateTransform();
});

// Touch
let lastDist = 0;
let touchStartX = 0, touchStartY = 0;
img.addEventListener('touchstart', e => {
    if (e.touches.length === 1) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        dragStartX = originX;
        dragStartY = originY;
    }
});
img.addEventListener('touchmove', e => {
    if (e.touches.length === 2) {
        e.preventDefault();
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (lastDist) {
            const prevScale = scale;
            scale = Math.min(Math.max(0.5, scale + (dist - lastDist)/150), 5);

            const centerX = (e.touches[0].clientX + e.touches[1].clientX)/2;
            const centerY = (e.touches[0].clientY + e.touches[1].clientY)/2;
            const rect = img.getBoundingClientRect();
            const offsetX = centerX - rect.left - rect.width/2;
            const offsetY = centerY - rect.top - rect.height/2;
            originX -= offsetX*(scale - prevScale)/scale;
            originY -= offsetY*(scale - prevScale)/scale;

            updateTransform();
        }
        lastDist = dist;
    } else if (e.touches.length === 1) {
        e.preventDefault();
        const moveX = e.touches[0].clientX - touchStartX;
        const moveY = e.touches[0].clientY - touchStartY;
        originX = dragStartX + moveX;
        originY = dragStartY + moveY;
        updateTransform();
    }
});
img.addEventListener('touchend', e => { if (e.touches.length < 2) lastDist=0; });


// ======================
// Inicialização
// ======================
displayCodesTable();
createKeyboard();
updateTexts();
