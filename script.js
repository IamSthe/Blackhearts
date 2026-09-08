const sidebar = document.querySelector('#sidebar');
const menuToggle = document.querySelector('#menuToggle');
const logoutButton = document.querySelector('#logoutButton');
const discordLogin = document.querySelector('#discordLogin');
const citySelect = document.querySelector('#citySelect');
const links = [...document.querySelectorAll('.side-link')];

menuToggle.addEventListener('click', () => sidebar.classList.toggle('open'));
links.forEach((link) => link.addEventListener('click', () => {
  links.forEach((item) => item.classList.remove('active'));
  link.classList.add('active');
  sidebar.classList.remove('open');
}));

logoutButton.addEventListener('click', () => {
  document.body.classList.add('login-mode');
  document.querySelector('#loginView').hidden = false;
});

discordLogin.addEventListener('click', () => {
  document.body.classList.remove('login-mode');
  document.querySelector('#loginView').hidden = true;
});

citySelect.addEventListener('click', () => {
  citySelect.classList.toggle('selected');
});
