const statusLabels = {
  completed: "Completed",
  in_progress: "In Progress",
  not_started: "Not Started",
};
const storageKey = "activity-log-usaha-xyz-statuses";
const milestones = window.projectMilestones;

const elements = {
  completedCount: document.querySelector("#completed-count"),
  dataError: document.querySelector("#data-error"),
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

function getWeekStatus(weekMilestones) {
  if (weekMilestones.every((milestone) => milestone.status === "completed")) return "completed";
  if (weekMilestones.some((milestone) => milestone.status !== "not_started")) return "in_progress";
  return "not_started";
}

function loadSavedStatuses() {
  const savedStatuses = localStorage.getItem(storageKey);
  if (savedStatuses === null) return;

  const parsedStatuses = JSON.parse(savedStatuses);
  if (!parsedStatuses || typeof parsedStatuses !== "object" || Array.isArray(parsedStatuses)) {
    throw new Error("Saved milestone statuses have an invalid format.");
  }

  const validStatuses = new Set(Object.keys(statusLabels));
  for (const [id, savedMilestone] of Object.entries(parsedStatuses)) {
    const status = typeof savedMilestone === "string" ? savedMilestone : savedMilestone?.status;
    if (!validStatuses.has(status)) throw new Error(`Invalid saved status for milestone ${id}.`);
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
}

function render() {
  try {
    loadSavedStatuses();
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
    elements.milestonePoints.replaceChildren();
    elements.weekLabels.replaceChildren();
    elements.milestoneRows.replaceChildren();

    orderedMilestones.forEach((milestone) => {
      const point = document.createElement("span");
      point.className = "milestone-point";
      point.dataset.status = milestone.status;
      point.setAttribute(
        "aria-label",
        `${milestone.name}, Week ${milestone.week}, ${statusLabels[milestone.status]}`,
      );
      elements.milestonePoints.append(point);

      const row = document.createElement("tr");
      const weekCell = document.createElement("td");
      weekCell.textContent = String(milestone.week);
      const nameCell = document.createElement("td");
      nameCell.textContent = milestone.name;
      const descriptionCell = document.createElement("td");
      descriptionCell.textContent = milestone.description;
      const statusCell = document.createElement("td");
      const statusLabel = document.createElement("span");
      statusLabel.className = "status-label";
      statusLabel.dataset.status = milestone.status;
      statusLabel.textContent = statusLabels[milestone.status];
      statusCell.append(statusLabel);
      row.append(weekCell, nameCell, descriptionCell, statusCell);
      elements.milestoneRows.append(row);
    });

    weeks.forEach((week) => {
      const weekMilestones = orderedMilestones.filter((milestone) => milestone.week === week);
      const label = document.createElement("span");
      label.className = "week-button";
      label.dataset.status = getWeekStatus(weekMilestones);
      label.setAttribute(
        "aria-label",
        `Week ${week}, ${statusLabels[getWeekStatus(weekMilestones)]}`,
      );
      const state = document.createElement("span");
      state.className = "week-state";
      state.setAttribute("aria-hidden", "true");
      label.append(state, document.createTextNode(`Week ${week}`));
      elements.weekLabels.append(label);
    });

    elements.timelineProgress.style.width = `${percent}%`;
    elements.timelineEmpty.hidden = total !== 0;
    elements.tableEmpty.hidden = total !== 0;
    elements.tableContainer.hidden = total === 0;
    elements.timeline.hidden = total === 0;
    elements.dataError.hidden = true;
  } catch (error) {
    elements.timeline.hidden = true;
    elements.dataError.hidden = false;
    elements.progressCount.textContent = "Progres belum dapat ditampilkan.";
    console.error("Unable to load project roadmap data.", error);
  }
}

window.addEventListener("storage", (event) => {
  if (event.key === storageKey || event.key === null) render();
});

render();
