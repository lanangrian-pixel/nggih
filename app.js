const milestones = window.projectMilestones;

const statusLabels = {
  completed: "Completed",
  in_progress: "In Progress",
  not_started: "Not Started",
};

const storageKey = "activity-log-usaha-xyz-statuses";
let editorMode = false;

const elements = {
  completedCount: document.querySelector("#completed-count"),
  dataError: document.querySelector("#data-error"),
  editorMessage: document.querySelector("#editor-message"),
  editorToggle: document.querySelector("#editor-toggle"),
  inProgressCount: document.querySelector("#in-progress-count"),
  milestonePoints: document.querySelector("#milestone-points"),
  milestoneRows: document.querySelector("#milestone-rows"),
  milestoneTotal: document.querySelector("#milestone-total"),
  notStartedCount: document.querySelector("#not-started-count"),
  progressCount: document.querySelector("#progress-count"),
  progressMeter: document.querySelector("#progress-meter"),
  progressMeterFill: document.querySelector("#progress-meter-fill"),
  progressPercent: document.querySelector("#progress-percent"),
  tableContainer: document.querySelector("#table-container"),
  tableEmpty: document.querySelector("#table-empty"),
  timeline: document.querySelector("#timeline"),
  timelineEmpty: document.querySelector("#timeline-empty"),
  timelineProgress: document.querySelector("#timeline-progress"),
  weekLabels: document.querySelector("#week-labels"),
};

function loadSavedStatuses() {
  try {
    const savedStatuses = localStorage.getItem(storageKey);
    if (savedStatuses === null) return;

    const parsedStatuses = JSON.parse(savedStatuses);
    if (!parsedStatuses || typeof parsedStatuses !== "object" || Array.isArray(parsedStatuses)) {
      throw new Error("Saved milestone statuses must be an object.");
    }

    const validStatuses = new Set(Object.keys(statusLabels));
    for (const [id, savedMilestone] of Object.entries(parsedStatuses)) {
      const status = typeof savedMilestone === "string" ? savedMilestone : savedMilestone?.status;
      if (!validStatuses.has(status)) {
        throw new Error(`Invalid saved status for milestone ${id}.`);
      }
      if (
        typeof savedMilestone === "object" &&
        savedMilestone !== null &&
        ((savedMilestone.name !== undefined && typeof savedMilestone.name !== "string") ||
          (savedMilestone.description !== undefined && typeof savedMilestone.description !== "string"))
      ) {
        throw new Error(`Invalid saved text for milestone ${id}.`);
      }
    }

    milestones.forEach((milestone) => {
      if (Object.hasOwn(parsedStatuses, milestone.id)) {
        const savedMilestone = parsedStatuses[milestone.id];
        milestone.status = typeof savedMilestone === "string" ? savedMilestone : savedMilestone.status;
        if (typeof savedMilestone === "object" && savedMilestone !== null) {
          if (typeof savedMilestone.name === "string") milestone.name = savedMilestone.name;
          if (typeof savedMilestone.description === "string") {
            milestone.description = savedMilestone.description;
          }
        }
      }
    });
  } catch {
    elements.editorMessage.textContent =
      "Status tersimpan tidak dapat dibaca. Perubahan baru mungkin tidak tersimpan.";
    elements.editorMessage.classList.add("is-error");
  }
}

function saveStatuses() {
  const statuses = Object.fromEntries(
    milestones.map(({ id, status, name, description }) => [id, { status, name, description }]),
  );
  try {
    localStorage.setItem(storageKey, JSON.stringify(statuses));
    elements.editorMessage.textContent = "Perubahan tersimpan di browser ini.";
    elements.editorMessage.classList.remove("is-error");
  } catch {
    elements.editorMessage.textContent =
      "Perubahan diterapkan sementara, tetapi browser tidak dapat menyimpannya.";
    elements.editorMessage.classList.add("is-error");
  }
}

function setEditorMode(isEnabled) {
  editorMode = isEnabled;
  elements.editorToggle.setAttribute("aria-pressed", String(editorMode));
  elements.editorToggle.textContent = editorMode ? "Selesai Mengedit" : "Mode Editor";
  elements.editorMessage.textContent = editorMode
    ? "Edit nama, deskripsi, atau status milestone langsung pada tabel."
    : "Aktifkan Mode Editor untuk mengubah status milestone.";
  elements.editorMessage.classList.remove("is-error");
  render();
}

function isValidMilestoneList(items) {
  const ids = new Set();
  const validStatuses = new Set(Object.keys(statusLabels));
  return items.every((milestone) => {
    const valid =
      milestone &&
      typeof milestone.id === "string" &&
      milestone.id.length > 0 &&
      !ids.has(milestone.id) &&
      Number.isInteger(milestone.week) &&
      milestone.week > 0 &&
      Number.isInteger(milestone.order) &&
      milestone.order > 0 &&
      typeof milestone.name === "string" &&
      milestone.name.trim().length > 0 &&
      typeof milestone.description === "string" &&
      validStatuses.has(milestone.status);
    if (valid) ids.add(milestone.id);
    return valid;
  });
}

function getWeekStatus(weekMilestones) {
  if (weekMilestones.every((milestone) => milestone.status === "completed")) return "completed";
  if (weekMilestones.some((milestone) => milestone.status !== "not_started")) return "in_progress";
  return "not_started";
}

function scrollToRow(id) {
  const row = document.querySelector(`#milestone-${CSS.escape(id)}`);
  if (row) row.scrollIntoView({ behavior: "smooth", block: "center" });
}

function selectMilestone(id) {
  document.querySelectorAll(".week-button").forEach((button) => {
    button.setAttribute("aria-pressed", "false");
  });
  document.querySelectorAll(".milestone-point").forEach((point) => {
    point.setAttribute("aria-pressed", String(point.dataset.id === id));
  });
  document.querySelectorAll("tbody tr").forEach((row) => {
    row.classList.toggle("is-highlighted", row.id === `milestone-${id}`);
  });
  scrollToRow(id);
}

function selectWeek(week) {
  document.querySelectorAll(".week-button").forEach((button) => {
    button.setAttribute("aria-pressed", String(Number(button.dataset.week) === week));
  });
  document.querySelectorAll(".milestone-point").forEach((point) => {
    point.setAttribute("aria-pressed", "false");
  });
  document.querySelectorAll("tbody tr").forEach((row) => {
    row.classList.toggle("is-highlighted", Number(row.dataset.week) === week);
  });
  const firstMilestone = milestones.find((milestone) => milestone.week === week);
  if (firstMilestone) scrollToRow(firstMilestone.id);
}

function render() {
  if (!isValidMilestoneList(milestones)) {
    elements.dataError.hidden = false;
    elements.tableContainer.hidden = true;
    elements.timeline.hidden = true;
    elements.progressCount.textContent = "Progres belum dapat dihitung.";
    return;
  }

  const orderedMilestones = [...milestones].sort((a, b) => a.week - b.week || a.order - b.order);
  const total = orderedMilestones.length;
  const completed = orderedMilestones.filter((item) => item.status === "completed").length;
  const inProgress = orderedMilestones.filter((item) => item.status === "in_progress").length;
  const notStarted = total - completed - inProgress;
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
  const weeks = [...new Set(orderedMilestones.map((item) => item.week))];

  elements.progressCount.textContent = total === 0
    ? "Belum ada milestone dalam proyek ini."
    : `${completed} dari ${total} milestone selesai`;
  elements.progressPercent.textContent = `${percent}%`;
  elements.progressMeter.setAttribute("aria-valuenow", String(percent));
  elements.progressMeter.setAttribute("aria-valuetext", `${percent}% selesai`);
  elements.progressMeterFill.style.width = `${percent}%`;
  elements.completedCount.textContent = String(completed);
  elements.inProgressCount.textContent = String(inProgress);
  elements.notStartedCount.textContent = String(notStarted);
  elements.milestoneTotal.textContent = `${total} ${total === 1 ? "milestone" : "milestones"}`;
  elements.milestoneRows.replaceChildren();
  elements.milestonePoints.replaceChildren();
  elements.weekLabels.replaceChildren();

  orderedMilestones.forEach((milestone) => {
    const point = document.createElement("button");
    point.type = "button";
    point.className = "milestone-point";
    point.dataset.id = milestone.id;
    point.dataset.week = String(milestone.week);
    point.dataset.status = milestone.status;
    point.setAttribute("aria-pressed", "false");
    point.setAttribute("aria-label", `${milestone.name}, Week ${milestone.week}, ${statusLabels[milestone.status]}`);
    point.addEventListener("click", () => selectMilestone(milestone.id));
    elements.milestonePoints.append(point);

    const row = document.createElement("tr");
    row.id = `milestone-${milestone.id}`;
    row.dataset.week = String(milestone.week);
    const weekCell = document.createElement("td");
    weekCell.textContent = String(milestone.week);
    const nameCell = document.createElement("td");
    const descriptionCell = document.createElement("td");
    if (editorMode) {
      const nameInput = document.createElement("input");
      nameInput.className = "milestone-text-input";
      nameInput.type = "text";
      nameInput.value = milestone.name;
      nameInput.maxLength = 100;
      nameInput.setAttribute("aria-label", `Ubah nama milestone ${milestone.name}`);
      nameInput.addEventListener("change", () => {
        const name = nameInput.value.trim();
        if (!name) {
          elements.editorMessage.textContent = "Nama milestone tidak boleh kosong.";
          elements.editorMessage.classList.add("is-error");
          render();
          return;
        }
        milestone.name = name;
        saveStatuses();
        render();
      });
      nameCell.append(nameInput);

      const descriptionInput = document.createElement("textarea");
      descriptionInput.className = "milestone-text-input milestone-description-input";
      descriptionInput.value = milestone.description;
      descriptionInput.maxLength = 500;
      descriptionInput.rows = 2;
      descriptionInput.setAttribute("aria-label", `Ubah deskripsi ${milestone.name}`);
      descriptionInput.addEventListener("change", () => {
        milestone.description = descriptionInput.value.trim();
        saveStatuses();
        render();
      });
      descriptionCell.append(descriptionInput);
    } else {
      nameCell.textContent = milestone.name;
      descriptionCell.textContent = milestone.description;
    }
    const statusCell = document.createElement("td");
    if (editorMode) {
      const statusSelect = document.createElement("select");
      statusSelect.className = "status-select";
      statusSelect.setAttribute("aria-label", `Ubah status ${milestone.name}`);
      Object.entries(statusLabels).forEach(([status, label]) => {
        const option = document.createElement("option");
        option.value = status;
        option.textContent = label;
        option.selected = milestone.status === status;
        statusSelect.append(option);
      });
      statusSelect.addEventListener("change", () => {
        milestone.status = statusSelect.value;
        saveStatuses();
        render();
      });
      statusCell.append(statusSelect);
    } else {
      const statusLabel = document.createElement("span");
      statusLabel.className = "status-label";
      statusLabel.dataset.status = milestone.status;
      statusLabel.textContent = statusLabels[milestone.status];
      statusCell.append(statusLabel);
    }
    row.append(weekCell, nameCell, descriptionCell, statusCell);
    elements.milestoneRows.append(row);
  });

  weeks.forEach((week) => {
    const weekMilestones = orderedMilestones.filter((milestone) => milestone.week === week);
    const weekStatus = getWeekStatus(weekMilestones);
    const button = document.createElement("button");
    button.type = "button";
    button.className = "week-button";
    button.dataset.week = String(week);
    button.dataset.status = weekStatus;
    button.setAttribute("aria-pressed", "false");
    button.setAttribute("aria-label", `Week ${week}, ${statusLabels[weekStatus]}, ${weekMilestones.length} milestones`);
    const state = document.createElement("span");
    state.className = "week-state";
    state.setAttribute("aria-hidden", "true");
    button.append(state, document.createTextNode(`Week ${week}`));
    button.addEventListener("click", () => selectWeek(week));
    elements.weekLabels.append(button);
  });

  elements.timelineProgress.style.width = `${percent}%`;
  elements.tableEmpty.hidden = total !== 0;
  elements.timelineEmpty.hidden = total !== 0;
  elements.tableContainer.hidden = total === 0;
  elements.timeline.hidden = total === 0;
}

elements.editorToggle.addEventListener("click", () => setEditorMode(!editorMode));
loadSavedStatuses();
render();

window.addEventListener("storage", (event) => {
  if (event.key === storageKey || event.key === null) {
    loadSavedStatuses();
    render();
  }
});
