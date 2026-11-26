let milestones = [];

const statusLabels = {
  completed: "Completed",
  in_progress: "In Progress",
  not_started: "Not Started",
};

let editorMode = false;
let canEdit = false;

const elements = {
  completedCount: document.querySelector("#completed-count"),
  dataError: document.querySelector("#data-error"),
  editorEmail: document.querySelector("#editor-email"),
  editorLoginButton: document.querySelector("#editor-login-button"),
  editorLoginForm: document.querySelector("#editor-login-form"),
  editorLogout: document.querySelector("#editor-logout"),
  editorMessage: document.querySelector("#editor-message"),
  editorToggle: document.querySelector("#editor-toggle"),
  editorAuthMessage: document.querySelector("#editor-auth-message"),
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

async function loadMilestones() {
  try {
    const records = await window.milestoneStore.fetchMilestones();
    milestones = records.map((milestone) => ({ ...milestone, order: milestone.sort_order }));
    elements.dataError.hidden = true;
    render();
  } catch (error) {
    elements.dataError.hidden = false;
    elements.dataError.textContent = "Data milestone tidak dapat dimuat dari Supabase. Coba muat ulang halaman.";
    console.error("Unable to load milestones from Supabase.", error);
  }
}

async function saveMilestone(id, changes) {
  try {
    await window.milestoneStore.updateMilestone(id, changes);
    await loadMilestones();
    elements.editorMessage.textContent = "Perubahan tersimpan dan tersedia untuk semua pengunjung.";
    elements.editorMessage.classList.remove("is-error");
  } catch (error) {
    elements.editorMessage.textContent = "Perubahan gagal disimpan. Periksa izin editor dan koneksi, lalu coba lagi.";
    elements.editorMessage.classList.add("is-error");
    console.error("Unable to save milestone to Supabase.", error);
  }
}

function setEditorMode(isEnabled) {
  editorMode = canEdit && isEnabled;
  elements.editorToggle.setAttribute("aria-pressed", String(editorMode));
  elements.editorToggle.textContent = editorMode ? "Selesai Mengedit" : "Mode Editor";
  elements.editorMessage.textContent = editorMode
    ? "Edit nama, deskripsi, atau status milestone langsung pada tabel."
    : canEdit
      ? "Aktifkan Mode Editor untuk mengubah status milestone."
      : "Masuk dengan akun yang diizinkan untuk mengedit.";
  elements.editorMessage.classList.remove("is-error");
  render();
}

async function updateEditorAccess(session) {
  const isSignedIn = Boolean(session);
  elements.editorLoginForm.hidden = isSignedIn;
  elements.editorLogout.hidden = !isSignedIn;
  canEdit = false;
  editorMode = false;
  elements.editorToggle.disabled = true;
  elements.editorMessage.classList.remove("is-error");

  if (!isSignedIn) {
    elements.editorAuthMessage.textContent = "Masuk dengan email yang telah diizinkan untuk menyunting milestone.";
    elements.editorMessage.textContent = "Masuk dengan akun yang diizinkan untuk mengedit.";
    render();
    return;
  }

  elements.editorAuthMessage.textContent = `Masuk sebagai ${session.user.email}.`;
  try {
    canEdit = await window.milestoneStore.canEdit();
    elements.editorToggle.disabled = !canEdit;
    elements.editorAuthMessage.textContent = canEdit
      ? `Akses editor aktif untuk ${session.user.email}.`
      : `Akun ${session.user.email} belum diberi izin editor.`;
    elements.editorMessage.textContent = canEdit
      ? "Aktifkan Mode Editor untuk mengubah milestone."
      : "Akun ini hanya dapat melihat data.";
    if (!canEdit) elements.editorMessage.classList.add("is-error");
  } catch (error) {
    elements.editorAuthMessage.textContent = "Izin editor tidak dapat diverifikasi. Coba muat ulang halaman.";
    elements.editorAuthMessage.classList.add("is-error");
    console.error("Unable to verify editor access.", error);
  }
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
        saveMilestone(milestone.id, { name });
      });
      nameCell.append(nameInput);

      const descriptionInput = document.createElement("textarea");
      descriptionInput.className = "milestone-text-input milestone-description-input";
      descriptionInput.value = milestone.description;
      descriptionInput.maxLength = 500;
      descriptionInput.rows = 2;
      descriptionInput.setAttribute("aria-label", `Ubah deskripsi ${milestone.name}`);
      descriptionInput.addEventListener("change", () => {
        saveMilestone(milestone.id, { description: descriptionInput.value.trim() });
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
        saveMilestone(milestone.id, { status: statusSelect.value });
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
elements.editorLoginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  elements.editorAuthMessage.classList.remove("is-error");
  elements.editorLoginButton.disabled = true;
  try {
    await window.milestoneStore.sendSignInLink(elements.editorEmail.value.trim());
    elements.editorAuthMessage.textContent = "Tautan masuk telah dikirim. Periksa kotak masuk email Anda.";
  } catch (error) {
    const retryMatch =
      typeof error?.message === "string" && error.message.match(/after (\d+) seconds/i);
    elements.editorAuthMessage.textContent = retryMatch
      ? `Tautan baru saja diminta. Coba lagi dalam ${retryMatch[1]} detik.`
      : error?.status === 429
        ? "Permintaan terlalu sering. Tunggu sebentar sebelum meminta tautan masuk lagi."
        : "Tautan masuk gagal dikirim. Periksa email dan konfigurasi autentikasi.";
    elements.editorAuthMessage.classList.add("is-error");
    console.error("Unable to send editor sign-in link.", error);
  } finally {
    elements.editorLoginButton.disabled = false;
  }
});
elements.editorLogout.addEventListener("click", async () => {
  try {
    await window.milestoneStore.signOut();
    await updateEditorAccess(null);
  } catch (error) {
    elements.editorAuthMessage.textContent = "Gagal keluar. Coba muat ulang halaman.";
    elements.editorAuthMessage.classList.add("is-error");
    console.error("Unable to sign out editor.", error);
  }
});

try {
  window.milestoneStore.onAuthStateChange((session) => updateEditorAccess(session));
} catch (error) {
  elements.editorAuthMessage.textContent = "Konfigurasi Supabase belum tersedia.";
  elements.editorAuthMessage.classList.add("is-error");
  console.error("Unable to listen for editor auth state.", error);
}
window.milestoneStore.getSession().then(updateEditorAccess).catch((error) => {
  elements.editorAuthMessage.textContent = "Status masuk tidak dapat diperiksa. Coba muat ulang halaman.";
  elements.editorAuthMessage.classList.add("is-error");
  console.error("Unable to load editor session.", error);
});
window.milestoneStore.subscribe(loadMilestones, (error) => {
  elements.dataError.hidden = false;
  elements.dataError.textContent = "Koneksi pembaruan langsung terputus. Muat ulang halaman untuk data terbaru.";
  console.error("Supabase realtime subscription failed.", error);
});
loadMilestones();
