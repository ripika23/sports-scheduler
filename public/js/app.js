document.addEventListener('DOMContentLoaded', () => {
  // Mobile Navigation Toggle
  const navToggle = document.getElementById('navToggle');
  const navMenu = document.getElementById('navMenu');

  if (navToggle && navMenu) {
    navToggle.addEventListener('click', () => {
      navMenu.classList.toggle('show');
    });
  }

  // User Profile Menu Dropdown
  const userMenuBtn = document.getElementById('userMenuBtn');
  const userMenu = document.getElementById('userMenu');

  if (userMenuBtn && userMenu) {
    userMenuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      userMenu.classList.toggle('show');
    });

    document.addEventListener('click', (e) => {
      if (!userMenu.contains(e.target) && e.target !== userMenuBtn) {
        userMenu.classList.remove('show');
      }
    });
  }

  // Auto-dismiss alerts after 6 seconds
  const alerts = document.querySelectorAll('.alert');
  alerts.forEach((alert) => {
    setTimeout(() => {
      alert.style.opacity = '0';
      alert.style.transition = 'opacity 0.4s ease';
      setTimeout(() => alert.remove(), 400);
    }, 6000);
  });
});
