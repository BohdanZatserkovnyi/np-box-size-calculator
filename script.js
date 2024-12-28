let boxes = JSON.parse(localStorage.getItem('boxes')) || [
    { name: 'Standard Box', code: 'STD001', length: 20, width: 15, height: 10 },
    { name: 'Large Box', code: 'LRG002', length: 40, width: 30, height: 20 },
    { name: 'Small Box', code: 'SML003', length: 15, width: 10, height: 5 }
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

document.addEventListener('keydown', (event) => {
    const tabs = document.querySelectorAll('.tab');
    let currentIndex = Array.from(tabs).findIndex(tab => tab.classList.contains('active'));

    if (event.key === 'ArrowLeft') {
        const previousIndex = (currentIndex - 1 + tabs.length) % tabs.length;
        tabs[previousIndex].click();
    } else if (event.key === 'ArrowRight') {
        const nextIndex = (currentIndex + 1) % tabs.length;
        tabs[nextIndex].click();
    }
});

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
                <label for="filler${parcelCounter}">Add Filler? (+0.5 cm to total)</label>
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
            <label for="fragile${objectCounter}">Fragile (+0.5 cm)</label>
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

        const fragileAdd = isFragile ? 0.5 : 0;
        totalLength = Math.max(totalLength, length + fragileAdd);
        totalWidth = Math.max(totalWidth, width + fragileAdd);
        totalHeight += height + fragileAdd;
    });

    const hasFiller = document.getElementById(`filler${parcelId}`).checked;
    if (hasFiller) {
        totalLength += 0.5;
        totalWidth += 0.5;
        totalHeight += 0.5;
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