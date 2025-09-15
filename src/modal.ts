export function openModal() {
  const modal = document.getElementById("modal");
  if (modal) {
    modal.classList.remove("hidden");
    modal.classList.add("flex");
  }
}

export function closeModal() {
  const modal = document.getElementById("modal");
  if (modal) {
    modal.classList.remove("flex");
    modal.classList.add("hidden");
  }
}
