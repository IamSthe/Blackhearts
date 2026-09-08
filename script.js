const links = [...document.querySelectorAll('.nav-link')];
const sections = [...document.querySelectorAll('[data-content]')];
const breadcrumbCurrent = document.querySelector('#breadcrumbCurrent');
const sidebar = document.querySelector('#sidebar');
const menuToggle = document.querySelector('#menuToggle');
const searchInput = document.querySelector('#searchInput');
const searchResults = document.querySelector('#searchResults');
const themeToggle = document.querySelector('#themeToggle');

const labels = {
  inicio: 'Wiki',
  historia: 'Nossa história',
  conduta: 'Código de conduta',
  hierarquia: 'Hierarquia',
  procedimentos: 'Procedimentos',
  comunicacao: 'Comunicação',
  faq: 'Perguntas frequentes'
};

links.forEach((link) => {
  link.addEventListener('click', () => {
    links.forEach((item) => item.classList.remove('active'));
    link.classList.add('active');
    sidebar.classList.remove('open');
    menuToggle.setAttribute('aria-expanded', 'false');
  });
});

const updateSection = () => {
  const position = window.scrollY + 130;
  let current = 'inicio';
  sections.forEach((section) => {
    if (section.offsetTop <= position) current = section.dataset.content;
  });
  links.forEach((link) => link.classList.toggle('active', link.dataset.section === current));
  breadcrumbCurrent.textContent = labels[current] || 'Wiki';
};

window.addEventListener('scroll', updateSection, { passive: true });
updateSection();

menuToggle.addEventListener('click', () => {
  const isOpen = sidebar.classList.toggle('open');
  menuToggle.setAttribute('aria-expanded', String(isOpen));
});

document.addEventListener('keydown', (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault();
    searchInput.focus();
  }
  if (event.key === 'Escape') {
    searchResults.classList.remove('visible');
    searchInput.blur();
  }
});

const searchable = [
  ['Nossa história', 'A casa antes do nome', '#historia'],
  ['Código de conduta', 'Lealdade, discrição e presença', '#conduta'],
  ['Hierarquia', 'Funções e responsabilidades', '#hierarquia'],
  ['Procedimentos', 'Orientações para a operação', '#procedimentos'],
  ['Comunicação', 'Canais e suporte', '#comunicacao'],
  ['Perguntas frequentes', 'Dúvidas comuns', '#faq']
];

searchInput.addEventListener('input', () => {
  const query = searchInput.value.trim().toLowerCase();
  if (!query) {
    searchResults.classList.remove('visible');
    searchResults.innerHTML = '';
    return;
  }
  const matches = searchable.filter(([title, description]) => `${title} ${description}`.toLowerCase().includes(query));
  searchResults.innerHTML = matches.length
    ? matches.map(([title, description, href]) => `<a class="search-result" href="${href}"><strong>${title}</strong><small>${description}</small></a>`).join('')
    : '<div class="search-result"><strong>Nenhum resultado</strong><small>Tente outro termo de busca.</small></div>';
  searchResults.classList.add('visible');
});

document.addEventListener('click', (event) => {
  if (!event.target.closest('.search-panel')) searchResults.classList.remove('visible');
});

themeToggle.addEventListener('click', () => {
  document.body.classList.toggle('high-contrast');
  themeToggle.textContent = document.body.classList.contains('high-contrast') ? '◑' : '◐';
});
