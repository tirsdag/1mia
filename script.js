// Constants
const TARGET_TREES = 1000000000;
const TARGET_DATE = new Date('2030-12-31');
const START_DATE = new Date('2024-11-18');

// Initialize map variables
let map;
let areaPolygon;

// Denmark center coordinates (approximate)
const DENMARK_CENTER = [56.2639, 9.5018];

// Initialize the chart
let progressChart;

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    // Set the default date to today
    const today = new Date();
    document.getElementById('currentDate').valueAsDate = today;
    
    // Initialize map
    initializeMap();
    
    // Create initial chart
    createChart(today);
    
    // Calculate and display initial projection
    updateProjection();
});

function initializeMap() {
    // Initialize the map centered on Denmark
    map = L.map('map').setView(DENMARK_CENTER, 7);
    
    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: ' OpenStreetMap contributors'
    }).addTo(map);
}

function calculateProjectedTrees(selectedDate) {
    // If selected date is before start date, return 0
    if (selectedDate < START_DATE) {
        return 0;
    }
    
    // If selected date is after target date, return target
    if (selectedDate > TARGET_DATE) {
        return TARGET_TREES;
    }
    
    // Calculate days since start
    const daysSinceStart = (selectedDate - START_DATE) / (1000 * 60 * 60 * 24);
    const totalDays = (TARGET_DATE - START_DATE) / (1000 * 60 * 60 * 24);
    
    // Calculate projected trees (linear projection)
    return Math.round((daysSinceStart / totalDays) * TARGET_TREES);
}

function updateAreaVisualization(trees) {
    // Remove existing polygon if it exists
    if (areaPolygon) {
        map.removeLayer(areaPolygon);
    }
    
    // Get current trees per hectare setting
    const treesPerHectare = parseInt(document.getElementById('treesPerHectare').value);
    
    // Calculate area in hectares
    const hectares = trees / treesPerHectare;
    
    // Update the forest area display
    const forestAreaElement = document.getElementById('forestArea');
    forestAreaElement.textContent = `${formatNumber(Math.round(hectares))} hektar`;
    
    // Calculate circle radius in meters (sqrt(area/pi) * 100 to convert hectares to m²)
    const radius = Math.sqrt((hectares * 10000) / Math.PI);
    
    // Create a circle centered in Denmark
    areaPolygon = L.circle(DENMARK_CENTER, {
        radius: radius,
        color: '#4CAF50',
        fillColor: '#4CAF50',
        fillOpacity: 0.3
    }).addTo(map);
    
    // Add a popup with area information
    areaPolygon.bindPopup(`
        <strong>På denne dato:</strong><br>
        Projekterede træer: ${formatNumber(trees)}<br>
        Nødvendigt skovareal: ${formatNumber(Math.round(hectares))} hektar<br>
        Træer pr. hektar: ${formatNumber(treesPerHectare)}
    `);
    
    // Fit the map to show the circle
    map.fitBounds(areaPolygon.getBounds(), { padding: [50, 50] });
}

function createChart(selectedDate) {
    const ctx = document.getElementById('progressChart').getContext('2d');
    
    // If chart exists, destroy it before creating a new one
    if (progressChart) {
        progressChart.destroy();
    }
    
    // Generate data points
    const data = generateProjectionData(selectedDate);
    
    progressChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.labels,
            datasets: [{
                label: 'Nødvendigt Fremskridt',
                data: data.projectedTrees,
                borderColor: '#4CAF50',
                backgroundColor: 'rgba(76, 175, 80, 0.1)',
                fill: true
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Plantede Træer'
                    },
                    ticks: {
                        callback: function(value) {
                            return formatNumber(value);
                        }
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Dato'
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return 'Træer: ' + formatNumber(context.parsed.y);
                        }
                    }
                }
            }
        }
    });
}

function generateProjectionData(selectedDate) {
    const labels = [];
    const projectedTrees = [];
    
    // Calculate total days and trees per day
    const totalDays = (TARGET_DATE - START_DATE) / (1000 * 60 * 60 * 24);
    const treesPerDay = TARGET_TREES / totalDays;
    
    // Generate monthly data points
    let currentDate = new Date(START_DATE);
    while (currentDate <= TARGET_DATE) {
        // Format date in Danish style
        labels.push(currentDate.toLocaleDateString('da-DK', { month: 'short', year: 'numeric' }));
        const daysSinceStart = (currentDate - START_DATE) / (1000 * 60 * 60 * 24);
        projectedTrees.push(Math.round(daysSinceStart * treesPerDay));
        
        // Move to next month
        currentDate.setMonth(currentDate.getMonth() + 1);
    }
    
    return { labels, projectedTrees };
}

function updateProjection() {
    const selectedDate = new Date(document.getElementById('currentDate').value);
    
    // Calculate required planting rate
    const daysRemaining = (TARGET_DATE - selectedDate) / (1000 * 60 * 60 * 24);
    const treesPerDay = TARGET_TREES / daysRemaining;
    const treesPerYear = treesPerDay * 365;
    
    // Calculate projected trees for selected date
    const projectedTrees = calculateProjectedTrees(selectedDate);
    
    // Update the displays
    document.getElementById('requiredRate').textContent = 
        `${formatNumber(Math.round(treesPerYear))} træer/år`;
    document.getElementById('projectedTrees').textContent =
        formatNumber(projectedTrees);
    
    // Update the chart
    createChart(selectedDate);
    
    // Update the area visualization with projected trees
    updateAreaVisualization(projectedTrees);
}

function formatNumber(num) {
    return new Intl.NumberFormat('da-DK').format(Math.round(num));
}
