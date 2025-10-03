export function openModal(modalId: string = "modal") {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove("hidden");
    modal.classList.add("flex");
  }
}

export function closeModal(modalId: string = "modal") {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove("flex");
    modal.classList.add("hidden");
  }
}
