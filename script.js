// script.js

document.addEventListener('DOMContentLoaded', () => {
    const stateSelect = document.getElementById('stateSelect');
    const citySearch = document.getElementById('citySearch');
    const clearSearchBtn = document.getElementById('clearSearchBtn');
    const checkboxContainer = document.getElementById('checkboxContainer');
    const selectAllBtn = document.getElementById('selectAllBtn');
    const generateMapBtn = document.getElementById('generateMapBtn');
    const downloadMapBtn = document.getElementById('downloadMapBtn');

    // Mapeamento dos estados para seus respectivos arquivos GeoJSON
    const geojsonFiles = {
        para: 'geojs-15-mun.json',       // Pará
        tocantins: 'geojs-17-mun.json'    // Tocantins
    };

    let currentGeojsonData = null;
    let map = null;
    let geojsonLayer = null;
    let selectedState = '';

    // Inicializa o mapa
    const initializeMap = () => {
        map = L.map('map').setView([-10.9472, -48.3378], 5); // Coordenadas centrais aproximadas do Pará e Tocantins

        // Adiciona tiles do OpenStreetMap
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap'
        }).addTo(map);
    };

    // Carrega dados GeoJSON com base no estado selecionado
    const loadGeoJSON = async (state) => {
        const filePath = geojsonFiles[state];
        if (!filePath) {
            alert('Arquivo GeoJSON para o estado selecionado não encontrado.');
            return;
        }

        try {
            const response = await fetch(filePath);
            if (!response.ok) {
                throw new Error(`Erro ao carregar GeoJSON: ${response.status}`);
            }
            currentGeojsonData = await response.json();
            createCityCheckboxes();
            // Habilita os botões após carregar os dados
            generateMapBtn.disabled = false;
            downloadMapBtn.disabled = false;
            // Habilita o campo de pesquisa e o botão de limpar pesquisa
            citySearch.disabled = false;
            clearSearchBtn.disabled = false;
            citySearch.value = ''; // Limpa o campo de pesquisa
            filterCities(''); // Exibe todas as cidades
        } catch (error) {
            console.error(error);
            alert('Falha ao carregar dados GeoJSON.');
        }
    };

    // Cria checkboxes para cada cidade
    const createCityCheckboxes = () => {
        // Limpa os checkboxes anteriores
        checkboxContainer.innerHTML = '';

        if (!currentGeojsonData || !currentGeojsonData.features) return;

        const fragment = document.createDocumentFragment();

        currentGeojsonData.features.forEach(feature => {
            const cityName = feature.properties.name;

            const div = document.createElement('div');
            div.className = 'form-check';

            const checkbox = document.createElement('input');
            checkbox.className = 'form-check-input';
            checkbox.type = 'checkbox';
            checkbox.value = cityName;
            checkbox.id = `checkbox-${cityName}`;

            const label = document.createElement('label');
            label.className = 'form-check-label';
            label.htmlFor = `checkbox-${cityName}`;
            label.textContent = cityName;

            div.appendChild(checkbox);
            div.appendChild(label);
            fragment.appendChild(div);
        });

        checkboxContainer.appendChild(fragment);
    };

    // Seleciona todas as cidades
    const selectAllCities = () => {
        const checkboxes = checkboxContainer.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(cb => cb.checked = true);
    };

    // Gera o mapa com as cidades selecionadas
    const generateMap = () => {
        const selectedCities = Array.from(checkboxContainer.querySelectorAll('input[type="checkbox"]:checked'))
                                   .map(cb => cb.value);

        if (!currentGeojsonData) {
            alert('Dados GeoJSON não carregados.');
            return;
        }

        if (geojsonLayer) {
            map.removeLayer(geojsonLayer);
        }

        geojsonLayer = L.geoJSON(currentGeojsonData, {
            style: feature => ({
                color: 'black',
                weight: 1,
                dashArray: '5, 5',
                fillOpacity: 0.6,
                fillColor: selectedCities.includes(feature.properties.name) ? '#ffff00' : '#428bca'
            }),
            onEachFeature: (feature, layer) => {
                layer.bindTooltip(`Cidade: ${feature.properties.name}`);
            }
        }).addTo(map);

        // Ajusta a visualização do mapa para caber todos os recursos
        map.fitBounds(geojsonLayer.getBounds());
    };

    // Filtra as cidades com base na pesquisa
    const filterCities = (searchTerm) => {
        const checkboxes = checkboxContainer.querySelectorAll('input[type="checkbox"]');
        let anyVisible = false; // Flag para verificar se alguma cidade está visível

        checkboxes.forEach(cb => {
            const label = cb.nextElementSibling;
            if (label.textContent.toLowerCase().includes(searchTerm.toLowerCase())) {
                cb.parentElement.style.display = 'block';
                anyVisible = true;
            } else {
                cb.parentElement.style.display = 'none';
                // REMOVIDO: Não desmarcar a checkbox quando está sendo filtrada
                // cb.checked = false; // Desmarca se não corresponder
            }
        });

        // Opcional: Exibir uma mensagem se nenhuma cidade corresponder
        if (searchTerm !== '') {
            if (!anyVisible) {
                if (!document.getElementById('noResults')) {
                    const noResultsDiv = document.createElement('div');
                    noResultsDiv.id = 'noResults';
                    noResultsDiv.className = 'text-center text-muted mt-2';
                    noResultsDiv.textContent = 'Nenhuma cidade encontrada.';
                    checkboxContainer.appendChild(noResultsDiv);
                }
            } else {
                const noResultsDiv = document.getElementById('noResults');
                if (noResultsDiv) {
                    checkboxContainer.removeChild(noResultsDiv);
                }
            }
        } else {
            // Remover a mensagem se o termo de busca estiver vazio
            const noResultsDiv = document.getElementById('noResults');
            if (noResultsDiv) {
                checkboxContainer.removeChild(noResultsDiv);
            }
        }
    };

    // Debounce para otimizar a busca
    const debounce = (func, delay) => {
        let debounceTimer;
        return function() {
            const context = this;
            const args = arguments;
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => func.apply(context, args), delay);
        };
    };

    // Baixa o mapa como arquivo HTML
    const downloadMap = () => {
        const selectedCities = Array.from(checkboxContainer.querySelectorAll('input[type="checkbox"]:checked'))
                                   .map(cb => cb.value);

        if (!currentGeojsonData) {
            alert('Dados GeoJSON não carregados.');
            return;
        }

        const mapHtml = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mapa Selecionado</title>

    <!-- Google Fonts: Roboto -->
    <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap" rel="stylesheet">

    <!-- Bootstrap CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">

    <!-- Leaflet CSS -->
    <link rel="stylesheet" href="https://unpkg.com/leaflet/dist/leaflet.css" />

    <style>
        body {
            font-family: 'Roboto', sans-serif;
        }
        #map { width: 100%; height: 100vh; }
    </style>
</head>
<body>
    <div id="map"></div>

    <!-- Leaflet JS -->
    <script src="https://unpkg.com/leaflet/dist/leaflet.js"></script>

    <script>
        const geojsonData = ${JSON.stringify(currentGeojsonData)};
        const selectedCities = ${JSON.stringify(selectedCities)};

        const map = L.map('map').setView([-10.9472, -48.3378], 5);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap'
        }).addTo(map);

        const geojsonLayer = L.geoJSON(geojsonData, {
            style: feature => ({
                color: 'black',
                weight: 1,
                dashArray: '5, 5',
                fillOpacity: 0.6,
                fillColor: selectedCities.includes(feature.properties.name) ? '#ffff00' : '#428bca'
            }),
            onEachFeature: (feature, layer) => {
                layer.bindTooltip(\`Cidade: \${feature.properties.name}\`);
            }
        }).addTo(map);

        map.fitBounds(geojsonLayer.getBounds());
    </script>
</body>
</html>
        `;

        const blob = new Blob([mapHtml], { type: 'text/html;charset=utf-8' });
        saveAs(blob, 'selected_cities_map.html');
    };

    // Evento para seleção do estado
    stateSelect.addEventListener('change', (e) => {
        const state = e.target.value;
        if (state) {
            selectedState = state;
            // Limpa o mapa existente
            if (geojsonLayer) {
                map.removeLayer(geojsonLayer);
                geojsonLayer = null;
            }
            // Carrega o GeoJSON do estado selecionado
            loadGeoJSON(state);
        }
    });

    // Evento para seleção de todas as cidades
    selectAllBtn.addEventListener('click', selectAllCities);

    // Evento para gerar o mapa
    generateMapBtn.addEventListener('click', generateMap);

    // Evento para baixar o mapa
    downloadMapBtn.addEventListener('click', downloadMap);

    // Evento para pesquisar cidades
    citySearch.addEventListener('input', debounce((e) => {
        const searchTerm = e.target.value.trim();
        filterCities(searchTerm);
    }, 300));

    // Evento para limpar a pesquisa
    clearSearchBtn.addEventListener('click', () => {
        citySearch.value = '';
        filterCities('');
    });

    // Inicializa o mapa
    initializeMap();
});
