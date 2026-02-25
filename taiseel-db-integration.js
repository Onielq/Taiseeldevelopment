/**
 * Taiseel Database Integration Script
 * Connects the HTML website to the database via API
 */

const API_BASE = 'http://localhost:3000/api';

// ============================================
// FETCH DATA FROM API
// ============================================

async function fetchUnits() {
    try {
        const response = await fetch(`${API_BASE}/units`);
        if (!response.ok) throw new Error('Failed to fetch units');
        return await response.json();
    } catch (error) {
        console.error('Error fetching units:', error);
        return [];
    }
}

async function fetchStats() {
    try {
        const response = await fetch(`${API_BASE}/stats`);
        if (!response.ok) throw new Error('Failed to fetch stats');
        return await response.json();
    } catch (error) {
        console.error('Error fetching stats:', error);
        return null;
    }
}

async function fetchValuationHistory() {
    try {
        const response = await fetch(`${API_BASE}/valuation-history`);
        if (!response.ok) throw new Error('Failed to fetch valuation history');
        return await response.json();
    } catch (error) {
        console.error('Error fetching valuation history:', error);
        return [];
    }
}

async function fetchUnitsByStatus(status) {
    try {
        const response = await fetch(`${API_BASE}/units/status/${status}`);
        if (!response.ok) throw new Error(`Failed to fetch ${status} units`);
        return await response.json();
    } catch (error) {
        console.error(`Error fetching ${status} units:`, error);
        return [];
    }
}

// ============================================
// UPDATE UI WITH DATABASE DATA
// ============================================

async function updateBuildingSnapshot() {
    const stats = await fetchStats();
    if (!stats) return;

    // Update snapshot header
    const snapPrice = document.querySelector('.snap-price');
    if (snapPrice) {
        snapPrice.textContent = `$${Number(stats.totalValue).toLocaleString()}`;
    }

    // Update unit stats
    const snapStats = document.querySelector('.snap-stats');
    if (snapStats) {
        snapStats.innerHTML = `
            <div class="snap-stat"><strong>${stats.totalUnits}</strong><span>Total Units</span></div>
            <div class="snap-stat"><strong>${stats.occupiedUnits}</strong><span>Occupied</span></div>
            <div class="snap-stat"><strong>6</strong><span>Floors</span></div>
            <div class="snap-stat"><strong>$${(stats.avgValue / 1000000).toFixed(2)}M</strong><span>Avg / Unit</span></div>
            <div class="snap-stat"><strong>${stats.occupancyRate}%</strong><span>Occupancy</span></div>
        `;
    }

    // Update meta items
    const metaItems = document.querySelectorAll('.snap-meta-item');
    if (metaItems[3]) {
        metaItems[3].innerHTML = `
            <div class="snap-meta-lbl">Rent Roll</div>
            <strong>$${Number(stats.rentRoll).toLocaleString()}/mo</strong>
        `;
    }
}

async function updateValueCards() {
    const stats = await fetchStats();
    if (!stats) return;

    const valueCards = document.querySelectorAll('.value-card');
    
    // Building Zestimate
    if (valueCards[0]) {
        valueCards[0].querySelector('.vc-amt').textContent = `$${Number(stats.totalValue).toLocaleString()}`;
    }

    // Per Unit Estimate
    if (valueCards[1]) {
        valueCards[1].querySelector('.vc-amt').textContent = `$${Number(stats.avgValue).toLocaleString()}`;
    }

    // Monthly Rent Roll
    if (valueCards[3]) {
        valueCards[3].querySelector('.vc-amt').innerHTML = `$${Number(stats.rentRoll).toLocaleString()}<span style="font-size:.85rem;font-weight:600;">/mo</span>`;
        valueCards[3].querySelector('.vc-sub').textContent = `${stats.occupiedUnits} occupied · $${Math.round(stats.avgRent).toLocaleString()} avg/unit`;
    }
}

async function updateOccupancyStrip() {
    const stats = await fetchStats();
    if (!stats) return;

    document.getElementById('occ-occupied-count').textContent = stats.occupiedUnits;
    document.getElementById('occ-vacant-count').textContent = stats.vacantUnits;
    document.getElementById('occ-listed-count').textContent = stats.listedUnits;

    // Update progress bar
    const progressBar = document.querySelector('.unit-occ-bar-fill');
    if (progressBar) {
        progressBar.style.width = `${stats.occupancyRate}%`;
    }

    // Update percentage text
    const pctText = document.querySelector('.unit-occ-pct');
    if (pctText) {
        pctText.textContent = `${stats.occupancyRate}% occupied`;
    }
}

async function loadUnitsTable() {
    const units = await fetchUnits();
    if (units.length === 0) return;

    const tbody = document.getElementById('unit-tbody');
    if (!tbody) return;

    // Store units globally for filtering/sorting
    window.UNITS = units;

    renderUnitsTable(units);
}

function renderUnitsTable(units) {
    const tbody = document.getElementById('unit-tbody');
    if (!tbody) return;

    tbody.innerHTML = '';

    units.forEach(unit => {
        const tr = document.createElement('tr');
        
        const rentDisplay = unit.status === 'vacant' 
            ? `<span style="color:#94a3b8;font-style:italic;font-size:.72rem;">~$${unit.rent.toLocaleString()} est.</span>`
            : `$${unit.rent.toLocaleString()}`;

        const statusPill = {
            occupied: '<span class="ut-pill occupied">● Occupied</span>',
            vacant: '<span class="ut-pill vacant">○ Vacant</span>',
            listed: '<span class="ut-pill listed">◈ Listed</span>'
        }[unit.status] || unit.status;

        tr.innerHTML = `
            <td><strong>${unit.unit_code}</strong></td>
            <td>${unit.floor}</td>
            <td>${unit.type}</td>
            <td>${unit.sqft.toLocaleString()}</td>
            <td class="ut-value-highlight">$${unit.value.toLocaleString()}</td>
            <td>${rentDisplay}</td>
            <td>${unit.yield}%</td>
            <td>${statusPill}</td>
            <td><button class="msg-btn" data-unit-id="${unit.id}">Message</button></td>
        `;

        tbody.appendChild(tr);
    });

    // Update filter counts
    updateFilterCounts(units);
}

function updateFilterCounts(units) {
    const allBtn = document.querySelector('[data-filter="all"]');
    const occBtn = document.querySelector('[data-filter="occupied"]');
    const vacBtn = document.querySelector('[data-filter="vacant"]');
    const listBtn = document.querySelector('[data-filter="listed"]');

    if (allBtn) allBtn.textContent = `All (${units.length})`;
    if (occBtn) occBtn.textContent = `Occupied (${units.filter(u => u.status === 'occupied').length})`;
    if (vacBtn) vacBtn.textContent = `Vacant (${units.filter(u => u.status === 'vacant').length})`;
    if (listBtn) listBtn.textContent = `Listed (${units.filter(u => u.status === 'listed').length})`;
}

async function updateValuationChart() {
    const history = await fetchValuationHistory();
    if (history.length === 0) return;

    // Update chart data
    const chartLabels = history.map(h => h.label);
    const totalValues = history.map(h => h.total_value);
    const rentRolls = history.map(h => h.rent_roll);
    const perUnitAvgs = history.map(h => h.per_unit_avg);

    // If chart exists, update it
    if (window.chartInst) {
        window.chartData = {
            value: { data: totalValues, color: '#052f4a', trend: '+103% portfolio growth in 6 years' },
            rent: { data: rentRolls, color: '#0f766e', trend: '+64% rent roll growth in 6 years' },
            tax: { data: perUnitAvgs, color: '#c2410c', trend: '+102% per-unit avg in 6 years' }
        };

        chartInst.data.labels = chartLabels;
        chartInst.data.datasets[0].data = totalValues;
        chartInst.update();
    }
}

// ============================================
// INITIALIZE ON PAGE LOAD
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
    console.log('🔄 Loading data from database...');

    // Update all sections with real data
    await updateBuildingSnapshot();
    await updateValueCards();
    await updateOccupancyStrip();
    await loadUnitsTable();
    await updateValuationChart();

    console.log('✅ Database data loaded successfully!');
});

// ============================================
// EXPORT FOR GLOBAL ACCESS
// ============================================

window.TaiseelDB = {
    fetchUnits,
    fetchStats,
    fetchValuationHistory,
    fetchUnitsByStatus,
    updateBuildingSnapshot,
    updateValueCards,
    updateOccupancyStrip,
    loadUnitsTable,
    updateValuationChart
};
