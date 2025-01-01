let boxes = JSON.parse(localStorage.getItem('boxes')) || [
    {name: 'ноут', code: '4', length: 53.5, width: 38, height: 7.5},
    {name: '0.5', code: '05', length: 17, width: 12, height: 9},
    {name: '0.5 пл', code: '55', length: 24, width: 17, height: 4},
    {name: '1', code: '1', length: 24, width: 17, height: 9},
    {name: '1 пл', code: '11', length: 34, width: 24, height: 4},
    {name: '2', code: '2', length: 34, width: 24, height: 9},
    {name: '2 кв', code: '-', length: 24, width: 20, height: 16},
    {name: '3', code: '3', length: 24, width: 24, height: 20},
    {name: '3 пл', code: '-', length: 34, width: 24, height: 14},
    {name: '5', code: '5', length: 40, width: 24, height: 20},
    {name: '10', code: '10', length: 40, width: 34, height: 28.5},
    {name: '10 пл', code: '-', length: 80, width: 24, height: 20},
    {name: '15', code: '15', length: 60, width: 35, height: 28.5},
    {name: '20', code: '20', length: 47, width: 40, height: 42},
    {name: '30', code: '30', length: 70, width: 40, height: 42},
    {name: '30 дов', code: '-', length: 100, width: 40, height: 30},
    {name: '60 туб', code: '-', length: 60, width: 16, height: 12},
    {name: '120 туб', code: '-', length: 120, width: 14, height: 11}
];

let selectedBoxIndex = null;
let editingBoxIndex = null;
let parcelCounter = 0;
let objectCounter = 0;

function saveBoxesToLocalStorage() {
    localStorage.setItem('boxes', JSON.stringify(boxes));
}

window.onload = function () {
    switchTab('calculator');
    updateInventoryList();
    setupSwipe();
};

function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(content => {
        content.style.display = 'none';
    });
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.getElementById(tabName).style.display = 'block';
    document.querySelector(`.tab[onclick="switchTab('${tabName}')"]`).classList.add('active');
}

function setupSwipe() {
    let touchStartX = 0;
    let touchEndX = 0;
    let isSwiping = false;

    const tabsContainer = document.querySelector('.tabs');

    tabsContainer.addEventListener('touchstart', (event) => {
        touchStartX = event.touches[0].clientX;
        isSwiping = true;
    }, { passive: true });

    tabsContainer.addEventListener('touchmove', (event) => {
        if (!isSwiping) return;
        touchEndX = event.touches[0].clientX;

        if (Math.abs(touchEndX - touchStartX) > 10) {
            event.preventDefault();
        }
    }, { passive: false });

    tabsContainer.addEventListener('touchend', () => {
        if (!isSwiping) return;
        isSwiping = false;

        const swipeThreshold = 50;
        const swipeDistance = touchEndX - touchStartX;

        if (Math.abs(swipeDistance) > swipeThreshold) {
            if (swipeDistance > 0) {
                switchToPreviousTab();
            } else {
                switchToNextTab();
            }
        }
    }, { passive: true });
}

function switchToPreviousTab() {
    const tabs = document.querySelectorAll('.tab');
    let currentIndex = Array.from(tabs).findIndex(tab => tab.classList.contains('active'));

    if (currentIndex > 0) {
        tabs[currentIndex - 1].click();
    }
}

function switchToNextTab() {
    const tabs = document.querySelectorAll('.tab');
    let currentIndex = Array.from(tabs).findIndex(tab => tab.classList.contains('active'));

    if (currentIndex < tabs.length - 1) {
        tabs[currentIndex + 1].click();
    }
}

function updateInventoryList() {
    const list = document.querySelector('.inventory-list');
    list.innerHTML = boxes.map((box, index) => `
        <div class="box-item ${index === selectedBoxIndex ? 'selected' : ''}"
             onclick="selectBox(${index})"
             ondblclick="editBox(${index})">
            <input type="checkbox" ${index === selectedBoxIndex ? 'checked' : ''}>
            <span>${box.name} (${box.code}) - ${box.length}×${box.width}×${box.height} cm</span>
        </div>
    `).join('');
}

function selectBox(index) {
    selectedBoxIndex = selectedBoxIndex === index ? null : index;
    updateInventoryList();
}

function openBoxModal(editing = false, index = null) {
    const modal = document.getElementById('boxModal');
    const modalTitle = document.getElementById('modalTitle');
    const form = document.getElementById('boxForm');

    editingBoxIndex = index;
    modalTitle.textContent = editing ? 'Edit Box' : 'Add New Box';

    if (editing && index !== null) {
        const box = boxes[index];
        document.getElementById('boxName').value = box.name;
        document.getElementById('boxCode').value = box.code;
        document.getElementById('boxLength').value = box.length;
        document.getElementById('boxWidth').value = box.width;
        document.getElementById('boxHeight').value = box.height;
    } else {
        form.reset();
    }

    modal.style.display = 'flex';
}

function closeBoxModal() {
    const modal = document.getElementById('boxModal');
    modal.style.display = 'none';
    editingBoxIndex = null;
}

function handleBoxFormSubmit(event) {
    event.preventDefault();

    const boxData = {
        name: document.getElementById('boxName').value,
        code: document.getElementById('boxCode').value,
        length: parseFloat(document.getElementById('boxLength').value),
        width: parseFloat(document.getElementById('boxWidth').value),
        height: parseFloat(document.getElementById('boxHeight').value)
    };

    if (editingBoxIndex !== null) {
        boxes[editingBoxIndex] = boxData;
    } else {
        boxes.push(boxData);
    }

    saveBoxesToLocalStorage();
    closeBoxModal();
    updateInventoryList();
}

function addBox() {
    openBoxModal(false);
}

function editBox(index) {
    openBoxModal(true, index);
}

function editSelectedBox() {
    if (selectedBoxIndex !== null) {
        openBoxModal(true, selectedBoxIndex);
    }
}

function deleteSelectedBox() {
    if (selectedBoxIndex !== null) {
        if (confirm('Are you sure you want to delete this box?')) {
            boxes.splice(selectedBoxIndex, 1);
            selectedBoxIndex = null;
            saveBoxesToLocalStorage();
            updateInventoryList();
        }
    }
}

function createParcel() {
    parcelCounter++;
    const parcelList = document.getElementById('parcelList');
    const div = document.createElement('div');
    div.className = 'parcel-item';
    div.innerHTML = `
        <h3>Parcel ${parcelCounter}</h3>
        <div class="object-list" id="objectList${parcelCounter}">
            <!-- Objects will be added here -->
        </div>
        <button class="button" onclick="addObject(${parcelCounter})">
            <i class="fas fa-plus"></i> Add Object
        </button>
        <div class="dimensions-total">
            <h4>Parcel Total Dimensions:</h4>
            <p>Length: <span id="parcelTotalLength${parcelCounter}">0</span> cm</p>
            <p>Width: <span id="parcelTotalWidth${parcelCounter}">0</span> cm</p>
            <p>Height: <span id="parcelTotalHeight${parcelCounter}">0</span> cm</p>
        </div>
        <div class="result">
            <h4>Recommended Boxes:</h4>
            <div class="optimal-box" id="optimal-box${parcelCounter}"></div>
            <div class="alternative-box" id="alternative-box${parcelCounter}"></div>
            <div class="checkbox-group" style="margin-top: 0.75rem;">
                <input type="checkbox" id="filler${parcelCounter}" onchange="updateParcelCalculations(${parcelCounter})">
                <label for="filler${parcelCounter}">Add Filler? (+1 cm to total)</label>
            </div>
        </div>
    `;
    parcelList.appendChild(div);
}

function addObject(parcelId) {
    objectCounter++;
    const objectList = document.getElementById(`objectList${parcelId}`);
    const div = document.createElement('div');
    div.className = 'object-item';
    div.innerHTML = `
        <span>Object ${objectCounter}</span>
        <input type="number" class="input-field" placeholder="Length (cm)" onchange="updateParcelCalculations(${parcelId})">
        <input type="number" class="input-field" placeholder="Width (cm)" onchange="updateParcelCalculations(${parcelId})">
        <input type="number" class="input-field" placeholder="Height (cm)" onchange="updateParcelCalculations(${parcelId})">
        <div class="checkbox-group">
            <input type="checkbox" id="fragile${objectCounter}" onchange="updateParcelCalculations(${parcelId})">
            <label for="fragile${objectCounter}">Fragile (+1 cm)</label>
        </div>
        <button class="button delete" onclick="this.parentElement.remove(); updateParcelCalculations(${parcelId})">
            <i class="fas fa-times"></i>
        </button>
    `;
    objectList.appendChild(div);
    updateParcelCalculations(parcelId);
}

function updateParcelCalculations(parcelId) {
    const objects = document.querySelectorAll(`#objectList${parcelId} .object-item`);
    let totalLength = 0;
    let totalWidth = 0;
    let totalHeight = 0;

    objects.forEach(object => {
        const [length, width, height] = [...object.querySelectorAll('.input-field')]
            .map(input => parseFloat(input.value) || 0);
        const isFragile = object.querySelector('input[type="checkbox"]').checked;

        const fragileAdd = isFragile ? 1 : 0;
        totalLength = Math.max(totalLength, length + fragileAdd);
        totalWidth = Math.max(totalWidth, width + fragileAdd);
        totalHeight += height + fragileAdd;
    });

    const hasFiller = document.getElementById(`filler${parcelId}`).checked;
    if (hasFiller) {
        totalLength += 1;
        totalWidth += 1;
        totalHeight += 1;
    }

    document.getElementById(`parcelTotalLength${parcelId}`).textContent = totalLength.toFixed(1);
    document.getElementById(`parcelTotalWidth${parcelId}`).textContent = totalWidth.toFixed(1);
    document.getElementById(`parcelTotalHeight${parcelId}`).textContent = totalHeight.toFixed(1);

    const dimensions = { length: totalLength, width: totalWidth, height: totalHeight };
    const optimal = findOptimalBox(dimensions);
    const alternative = findAlternativeBox(optimal);

    updateParcelBoxDisplay(parcelId, optimal, alternative);
}

function findOptimalBox(dimensions) {
    const fittingBoxes = boxes.filter(box =>
        box.length >= dimensions.length &&
        box.width >= dimensions.width &&
        box.height >= dimensions.height
    );

    if (fittingBoxes.length > 0) {
        return fittingBoxes.reduce((smallest, box) => {
            const smallestVolume = smallest.length * smallest.width * smallest.height;
            const boxVolume = box.length * box.width * box.height;
            return boxVolume < smallestVolume ? box : smallest;
        });
    }

    return null;
}

function findAlternativeBox(optimalBox) {
    if (!optimalBox) {
        return boxes.reduce((smallest, box) => {
            const smallestVolume = smallest.length * smallest.width * smallest.height;
            const boxVolume = box.length * box.width * box.height;
            return boxVolume < smallestVolume ? box : smallest;
        });
    }

    const largerBoxes = boxes.filter(box => {
        const boxVolume = box.length * box.width * box.height;
        const optimalVolume = optimalBox.length * optimalBox.width * optimalBox.height;
        return boxVolume > optimalVolume;
    });

    if (largerBoxes.length > 0) {
        return largerBoxes.reduce((smallest, box) => {
            const smallestVolume = smallest.length * smallest.width * smallest.height;
            const boxVolume = box.length * box.width * box.height;
            return boxVolume < smallestVolume ? box : smallest;
        });
    }

    return null;
}

function updateParcelBoxDisplay(parcelId, optimal, alternative) {
    const optimalBox = document.getElementById(`optimal-box${parcelId}`);
    const alternativeBox = document.getElementById(`alternative-box${parcelId}`);

    optimalBox.innerHTML = optimal
        ? `
            <div class="box-name">${optimal.name}</div>
            <div class="box-dimensions">
                <div>Length: ${optimal.length} cm</div>
                <div>Width: ${optimal.width} cm</div>
                <div>Height: ${optimal.height} cm</div>
            </div>
        `
        : '<p>No optimal box found</p>';

    alternativeBox.innerHTML = alternative
        ? `
            <div class="box-name">${alternative.name}</div>
            <div class="box-dimensions">
                <div>Length: ${alternative.length} cm</div>
                <div>Width: ${alternative.width} cm</div>
                <div>Height: ${alternative.height} cm</div>
            </div>
        `
        : '<p>No alternative box available</p>';
}

updateInventoryList();
