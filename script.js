// script.js

document.addEventListener('DOMContentLoaded', () => {
    const geojsonFilePath = 'geojs-15-mun.json'; // Certifique-se de que o arquivo está na mesma pasta
    const checkboxContainer = document.getElementById('checkboxContainer');
    const selectAllBtn = document.getElementById('selectAllBtn');
    const generateMapBtn = document.getElementById('generateMapBtn');
    const downloadMapBtn = document.getElementById('downloadMapBtn');

    let geojsonData = null;
    let map = null;
    let geojsonLayer = null;

    // Inicializa o mapa
    const initializeMap = () => {
        map = L.map('map').setView([-14.235004, -51.92528], 4); // Centralizado no Brasil

        // Adiciona tiles do OpenStreetMap
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap'
        }).addTo(map);
    };

    // Carrega dados GeoJSON
    const loadGeoJSON = async () => {
        try {
            const response = await fetch(geojsonFilePath);
            if (!response.ok) {
                throw new Error(`Erro ao carregar GeoJSON: ${response.status}`);
            }
            geojsonData = await response.json();
            createCityCheckboxes();
        } catch (error) {
            console.error(error);
            alert('Falha ao carregar dados GeoJSON.');
        }
    };

    // Cria checkboxes para cada cidade
    const createCityCheckboxes = () => {
        if (!geojsonData || !geojsonData.features) return;

        const fragment = document.createDocumentFragment();

        geojsonData.features.forEach(feature => {
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

        if (!geojsonData) {
            alert('Dados GeoJSON não carregados.');
            return;
        }

        if (geojsonLayer) {
            map.removeLayer(geojsonLayer);
        }

        geojsonLayer = L.geoJSON(geojsonData, {
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

    // Baixa o mapa como arquivo HTML
    const downloadMap = () => {
        const selectedCities = Array.from(checkboxContainer.querySelectorAll('input[type="checkbox"]:checked'))
                                   .map(cb => cb.value);

        if (!geojsonData) {
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
        const geojsonData = ${JSON.stringify(geojsonData)};
        const selectedCities = ${JSON.stringify(selectedCities)};

        const map = L.map('map').setView([-14.235004, -51.92528], 4);

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

    // Eventos
    selectAllBtn.addEventListener('click', selectAllCities);
    generateMapBtn.addEventListener('click', generateMap);
    downloadMapBtn.addEventListener('click', downloadMap);

    // Inicializa o mapa e carrega o GeoJSON
    initializeMap();
    loadGeoJSON();
});