let disk = [];
let files = [];
let diskSize = 20;
let allocationType = "contigua";

document.getElementById("initialize").addEventListener("click", () => {
  diskSize = parseInt(document.getElementById("disk-size").value);

  if (!diskSize || diskSize <= 0 || diskSize > 256) {
    alert("Informe um tamanho válido!");
    return;
  }

  allocationType = document.getElementById("allocation-type").value;

  if (!allocationType) {
    alert("Informe o tipo de alocação!");
  }

  initializeDisk(diskSize);
  renderDisk();
  renderAllocationTable();
  updateAllocationType(allocationType);
});

document.getElementById("create-file").addEventListener("click", () => {
  const fileName = document.getElementById("file-name").value.trim();
  const fileBlocks = parseInt(document.getElementById("file-blocks").value);

  if (!fileName) {
    alert("Insira um nome para o arquivo.");
    return;
  }

  if (fileBlocks <= 0 || isNaN(fileBlocks)) {
    alert("Insira uma quantidade válida de blocos.");
    return;
  }

  if (files.some((f) => f.name === fileName)) {
    alert("Um arquivo com este nome já existe.");
    return;
  }

  createFile(fileName, fileBlocks);

  document.getElementById("file-name").value = "";
  document.getElementById("file-blocks").value = "";
});

document.getElementById("delete-file").addEventListener("click", () => {
  const fileName = document.getElementById("file-name").value.trim();

  if (!fileName) {
    alert("Insira o nome do arquivo a ser excluído.");
    return;
  }

  deleteFile(fileName);

  document.getElementById("file-name").value = "";
});

function initializeDisk(size) {
  disk = new Array(size).fill({ free: true });
  files = [];
}

const colors = [
  "#FF5733",
  "#33FF57",
  "#3357FF",
  "#FF33A1",
  "#A133FF",
  "#FFC300",
  "#FF5733",
  "#DAF7A6",
  "#C70039",
  "#581845",
  "#16A085",
  "#F4D03F",
  "#E67E22",
  "#1ABC9C",
  "#8E44AD",
  "#3498DB",
  "#E74C3C",
  "#2ECC71",
  "#9B59B6",
  "#34495E",
  "#F39C12",
  "#D35400",
  "#2C3E50",
  "#7F8C8D",
];

function getFileColor(fileName) {
  const hash = Array.from(fileName).reduce(
    (sum, char) => sum + char.charCodeAt(0),
    0
  );
  return colors[hash % colors.length];
}

function renderDisk() {
  const diskContainer = document.getElementById("disk");
  diskContainer.innerHTML = "";
  disk.forEach((block, index) => {
    const blockElement = document.createElement("div");
    blockElement.classList.add("block");
    blockElement.classList.add(block.free ? "free" : "allocated");
    if (!block.free) {
      const fileColor = getFileColor(block.file);
      blockElement.style.backgroundColor = fileColor;
      blockElement.dataset.file = block.file;
    }
    blockElement.textContent = block.free ? "" : index;
    diskContainer.appendChild(blockElement);
  });
}

function createFile(fileName, fileBlocks) {
  let startBlock = -1;

  if (allocationType === "contigua") {
    startBlock = findContiguousBlocks(fileBlocks);
    if (startBlock !== -1) {
      allocateContiguousBlocks(startBlock, fileBlocks, fileName);
    }
  } else if (allocationType === "encadeada") {
    startBlock = findFreeBlock();
    if (startBlock !== -1) {
      allocateChainedBlocks(fileBlocks, fileName);
    }
  } else if (allocationType === "indexada") {
    startBlock = findFreeBlock();
    if (startBlock !== -1) {
      allocateIndexedBlocks(fileBlocks, fileName);
    }
  }

  if (startBlock === -1) {
    alert("Não tem espaço suficiente para alocar o arquivo.");
  } else {
    renderDisk();
    renderAllocationTable();
  }
}

function findContiguousBlocks(fileBlocks) {
  for (let i = 0; i < disk.length - fileBlocks + 1; i++) {
    let found = true;
    for (let j = 0; j < fileBlocks; j++) {
      if (!disk[i + j].free) {
        found = false;
        break;
      }
    }
    if (found) return i;
  }
  return -1;
}

function allocateContiguousBlocks(start, fileBlocks, fileName) {
  for (let i = 0; i < fileBlocks; i++) {
    disk[start + i] = { free: false, file: fileName };
  }
  files.push({
    name: fileName,
    blocks: Array.from({ length: fileBlocks }, (_, i) => start + i),
  });
}

function findFreeBlock() {
  for (let i = 0; i < disk.length; i++) {
    if (disk[i].free) return i;
  }
  return -1;
}

function allocateChainedBlocks(fileBlocks, fileName) {
  let blocks = [];

  for (let i = 0; i < fileBlocks; i++) {
    const randomBlock = findRandomFreeBlock();
    if (randomBlock === -1) {
      alert("Espaço insuficiente no disco. Desfazer operação.");
      blocks.forEach((block) => (disk[block] = { free: true }));
      return;
    }

    disk[randomBlock] = {
      free: false,
      file: fileName,
      next: null,
    };
    blocks.push(randomBlock);

    if (i < fileBlocks - 1) {
      disk[randomBlock].next = findRandomFreeBlock();
    }
  }

  files.push({ name: fileName, blocks });
}

function allocateIndexedBlocks(fileBlocks, fileName) {
  let blocks = [];
  let indexBlock = findFreeBlock();

  if (indexBlock === -1) {
    alert("Espaço insuficiente para alocação indexada.");
    return;
  }

  disk[indexBlock] = { free: false, file: fileName, isIndex: true };
  blocks.push(indexBlock);

  for (let i = 0; i < fileBlocks; i++) {
    const block = findRandomFreeBlock();
    if (block !== -1) {
      disk[block] = { free: false, file: fileName };
      blocks.push(block);
    } else {
      alert("Espaço insuficiente para alocação indexada.");
      blocks.forEach((b) => (disk[b] = { free: true }));
      return;
    }
  }

  files.push({
    name: fileName,
    blocks: blocks.slice(1),
    indexBlock: indexBlock,
  });
}

function findRandomFreeBlock() {
  const freeBlocks = [];

  for (let i = 0; i < disk.length; i++) {
    if (disk[i].free) {
      freeBlocks.push(i);
    }
  }

  if (freeBlocks.length === 0) {
    return -1;
  }

  const randomIndex = Math.floor(Math.random() * freeBlocks.length);
  return freeBlocks[randomIndex];
}

function renderAllocationTable() {
  const tableBody = document
    .getElementById("allocation-table")
    .querySelector("tbody");
  tableBody.innerHTML = "";

  files.forEach((file) => {
    const row = document.createElement("tr");
    const fileColor = getFileColor(file.name);

    row.innerHTML = `
      <td>${file.name}</td>
      <td>
        ${
          file.indexBlock !== undefined
            ? "Índice: " + file.indexBlock + " | "
            : ""
        }
        ${file.blocks.join(" → ")}
      </td>
      <td style="background-color: ${fileColor}; width: 20px;"></td>
    `;

    row.addEventListener("click", () => highlightFile(file.name));
    tableBody.appendChild(row);
  });
}

function deleteFile(fileName) {
  const file = files.find((f) => f.name === fileName);

  if (!file) {
    alert("Arquivo não encontrado.");
    return;
  }

  if (file.indexBlock !== undefined) {
    disk[file.indexBlock] = { free: true };
  }

  file.blocks.forEach((block) => {
    disk[block] = { free: true };
  });

  files = files.filter((f) => f.name !== fileName);
  renderDisk();
  renderAllocationTable();
}

function highlightFile(fileName) {
  const file = files.find((f) => f.name === fileName);
  if (!file) return;

  const blocksToHighlight = [...file.blocks];

  if (file.indexBlock !== undefined) {
    blocksToHighlight.unshift(file.indexBlock);
  }

  const blocks = document.querySelectorAll(".block");
  blocks.forEach((block) => block.classList.remove("highlight"));

  blocksToHighlight.forEach((blockIndex) => {
    blocks[blockIndex].classList.add("highlight");
  });
}

function updateAllocationType(type) {
  document.getElementById(
    "allocation-type-text"
  ).innerText = `Tipo de Alocação: ${type}`;
}
