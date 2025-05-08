// js/ui/modals.js

export function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add("open");
      document.body.style.overflow = "hidden";
    }
  }
  
  export function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove("open");
      document.body.style.overflow = "";
    }
  }
  
  // Optional: close when clicking background
  document.addEventListener("click", (e) => {
    if (e.target.classList.contains("modal")) {
      e.target.classList.remove("open");
      document.body.style.overflow = "";
    }
  });
  