document.addEventListener('DOMContentLoaded', () => {
    const stateSelect = document.getElementById('stateSelect');
    const citySearch = document.getElementById('citySearch');
    const clearSearchBtn = document.getElementById('clearSearchBtn');
    const checkboxContainer = document.getElementById('checkboxContainer');
    const selectAllBtn = document.getElementById('selectAllBtn');
    const generateMapBtn = document.getElementById('generateMapBtn');
    const downloadMapBtn = document.getElementById('downloadMapBtn');
    const stateFlagContainer = document.getElementById('stateFlagContainer');
    const stateFlag = document.getElementById('stateFlag');
    const stateName = document.getElementById('stateName');

    const geojsonFiles = {
        para: 'geojs-15-mun.json',
        tocantins: 'geojs-17-mun.json'
    };

    const stateFlagClasses = {
        para: 'fi fi-br-pa',
        tocantins: 'fi fi-br-to'
    };

    let currentGeojsonData = null;
    let map = null;
    let geojsonLayer = null;

    const initializeMap = () => {
        map = L.map('map').setView([-10.9472, -48.3378], 5);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap'
        }).addTo(map);
    };

    const loadGeoJSON = async (state) => {
        const filePath = geojsonFiles[state];
        if (!filePath) return;
        try {
            const response = await fetch(filePath);
            if (!response.ok) throw new Error(`Erro ao carregar GeoJSON: ${response.status}`);
            currentGeojsonData = await response.json();
            createCityCheckboxes();
            generateMapBtn.disabled = false;
            downloadMapBtn.disabled = false;
            citySearch.disabled = false;
            clearSearchBtn.disabled = false;
            citySearch.value = '';
            filterCities('');
        } catch (error) {
            console.error(error);
        }
    };

    const createCityCheckboxes = () => {
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

    const selectAllCities = () => {
        const checkboxes = checkboxContainer.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(cb => cb.checked = true);
    };

    const generateMap = () => {
        const selectedCities = Array.from(checkboxContainer.querySelectorAll('input[type="checkbox"]:checked'))
            .map(cb => cb.value);
        if (!currentGeojsonData) return;
        if (geojsonLayer) map.removeLayer(geojsonLayer);
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
        map.fitBounds(geojsonLayer.getBounds());
    };

    const filterCities = (searchTerm) => {
        const checkboxes = checkboxContainer.querySelectorAll('input[type="checkbox"]');
        let anyVisible = false;
        checkboxes.forEach(cb => {
            const label = cb.nextElementSibling;
            if (label.textContent.toLowerCase().includes(searchTerm.toLowerCase())) {
                cb.parentElement.style.display = 'block';
                anyVisible = true;
            } else {
                cb.parentElement.style.display = 'none';
            }
        });
        const noResultsDiv = document.getElementById('noResults');
        if (searchTerm && !anyVisible) {
            if (!noResultsDiv) {
                const noResults = document.createElement('div');
                noResults.id = 'noResults';
                noResults.className = 'text-center text-muted mt-2';
                noResults.textContent = 'Nenhuma cidade encontrada.';
                checkboxContainer.appendChild(noResults);
            }
        } else if (noResultsDiv) {
            checkboxContainer.removeChild(noResultsDiv);
        }
    };

    const debounce = (func, delay) => {
        let debounceTimer;
        return function() {
            const context = this;
            const args = arguments;
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => func.apply(context, args), delay);
        };
    };

    const downloadMap = () => {
        const selectedCities = Array.from(checkboxContainer.querySelectorAll('input[type="checkbox"]:checked'))
            .map(cb => cb.value);
        if (!currentGeojsonData) return;
        const mapHtml = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mapa Selecionado</title>
    <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://unpkg.com/leaflet/dist/leaflet.css" />
    <style>
        body { font-family: 'Roboto', sans-serif; }
        #map { width: 100%; height: 100vh; }
    </style>
</head>
<body>
    <div id="map"></div>
    <script src="https://unpkg.com/leaflet/dist/leaflet.js"></script>
    <script>
        const geojsonData = ${JSON.stringify(currentGeojsonData)};
        const selectedCities = ${JSON.stringify(selectedCities)};
        const map = L.map('map').setView([-10.9472, -48.3378], 5);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap' }).addTo(map);
        const geojsonLayer = L.geoJSON(geojsonData, {
            style: feature => ({ color: 'black', weight: 1, dashArray: '5, 5', fillOpacity: 0.6, fillColor: selectedCities.includes(feature.properties.name) ? '#ffff00' : '#428bca' }),
            onEachFeature: (feature, layer) => { layer.bindTooltip(\`Cidade: \${feature.properties.name}\`); }
        }).addTo(map);
        map.fitBounds(geojsonLayer.getBounds());
    </script>
</body>
</html>`;
        const blob = new Blob([mapHtml], { type: 'text/html;charset=utf-8' });
        saveAs(blob, 'selected_cities_map.html');
    };

    stateSelect.addEventListener('change', (e) => {
        const state = e.target.value;
        if (state) {
            stateFlag.className = `${stateFlagClasses[state]} fi`;
            stateName.textContent = state.charAt(0).toUpperCase() + state.slice(1);
            stateFlagContainer.style.display = 'block';
            if (geojsonLayer) map.removeLayer(geojsonLayer);
            loadGeoJSON(state);
        }
    });

    selectAllBtn.addEventListener('click', selectAllCities);
    generateMapBtn.addEventListener('click', generateMap);
    downloadMapBtn.addEventListener('click', downloadMap);
    citySearch.addEventListener('input', debounce((e) => filterCities(e.target.value.trim()), 300));
    clearSearchBtn.addEventListener('click', () => { citySearch.value = ''; filterCities(''); });

    initializeMap();
});
