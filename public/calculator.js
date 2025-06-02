document.addEventListener('DOMContentLoaded', () => {
    // Referințe DOM
    const Gett = id => document.getElementById(id);

    const monthlyConsumptionInput = Gett('monthlyConsumptionInput');
    const monthlyConsumptionSlider = Gett('monthlyConsumptionSlider');
    const selfConsumptionSlider = Gett('selfConsumptionSlider');
    const selfValueDisplay = Gett('selfValueDisplay');
    const buyPriceSlider = Gett('buyPriceSlider');
    const buyPriceDisplay = Gett('buyPriceDisplay');
    const sellPriceSlider = Gett('sellPriceSlider');
    const sellPriceDisplay = Gett('sellPriceDisplay');
    const pvSystemInput = Gett('pvSystemInput');
    const pvSystemSlider = Gett('pvSystemSlider');
    const recommendedPvSystemContainer = Gett('recommendedPvSystemContainer');
    const recommendedPvSystemDisplay = Gett('recommendedPvSystemDisplay');
    const storageCapacityInput = Gett('storageCapacityInput');
    const storageCapacitySlider = Gett('storageCapacitySlider');
    const recommendedStorageContainer = Gett('recommendedStorageContainer');
    const recommendedStorageDisplay = Gett('recommendedStorageDisplay');
    const stateAidPerMWInput = Gett('stateAidPerMWInput');
    const stateAidPerMWSlider = Gett('stateAidPerMWSlider');
    const stateAidPerMWDisplay = Gett('stateAidPerMWDisplay');

    // Display Results Elements
    const pvCostEurDisplay = Gett('pvCostEurDisplay');
    const pvCostRonDisplay = Gett('pvCostRonDisplay');
    const storageCostEurDisplay = Gett('storageCostEurDisplay'); // Total PV+Storage EUR
    const storageCostRonDisplay = Gett('storageCostRonDisplay'); // Total PV+Storage RON
    const annualProductionDisplay = Gett('annualProductionDisplay');
    const selfConsumedDisplay = Gett('selfConsumedDisplay');
    const surplusEnergyDisplay = Gett('surplusEnergyDisplay');
    const selfSavingDisplay = Gett('selfSavingDisplay');
    const injectedIncomeDisplay = Gett('injectedIncomeDisplay');
    const annualPVIncomeDisplay = Gett('annualPVIncomeDisplay');
    const annualStorageIncomeDisplay = Gett('annualStorageIncomeDisplay');
    const paybackPvDisplay = Gett('paybackPvDisplay');
    const paybackBessDisplay = Gett('paybackBessDisplay');
    const paybackWithGrantDisplay = Gett('paybackWithGrantDisplay');

    // Indicatori Table
    const indicatorI1Display = Gett('indicatorI1Display');
    const indicatorI2Display = Gett('indicatorI2Display');
    const indicatorI3Display = Gett('indicatorI3Display');
    const indicatorI4Display = Gett('indicatorI4Display');
    const indicatorI5Display = Gett('indicatorI5Display');
    const indicatorI6Display = Gett('indicatorI6Display');

    // Buget Table
    const budgetTotalCostRonDisplay = Gett('budgetTotalCostRonDisplay');
    const budgetNonEligibleCostDisplay = Gett('budgetNonEligibleCostDisplay');
    const budgetEligibleCostDisplay = Gett('budgetEligibleCostDisplay');
    const budgetStateAidRonDisplay = Gett('budgetStateAidRonDisplay');
    const budgetOwnContributionDisplay = Gett('budgetOwnContributionDisplay');

    const roiChartCanvas = Gett('roiChart')?.getContext('2d');
    let productionChart = null;

    // --- Valori Inițiale și Constante ---

    // Chart display mode: 'kWh' or 'RON'
    let chartDisplayMode = 'kWh'; // or 'RON'
    const EUR_TO_RON = 4.9763; // Conform datelor tale, poate fi și 5 cum e în React. Am pus 4.9763 ca în text.
                               // În codul React era 5. Voi folosi 5 pentru consistență cu sumele din React.
                               // Actualizare: Voi folosi 5 conform formulelor din React, de ex. stateAidTotalRON.
    const EUR_TO_RON_CALC = 5; // Folosit în calculele interne pentru a matcha React.

    let state = {
        monthlyConsumption: 10000,
        selfConsumptionPercent: 75,
        buyPrice: 1,
        sellPrice: 0.5,
        pvSystem: 100,
        storageCapacity: customStorageRoundup(100 / 60 * 12), // Inițial bazat pe pvSystem=100
        stateAidPerMW: 200000,
        // Următoarele sunt pentru inputurile text, pentru a gestiona formatarea
        monthlyConsumptionInputVal: '10.000',
        pvSystemInputVal: '100',
        storageCapacityInputVal: customStorageRoundup(100 / 60 * 12).toLocaleString('ro-RO'),
        stateAidPerMWInputVal: (200000).toLocaleString('ro-RO'),
    };
    
    // --- Helper Functions (preluate din React) ---
    function customStorageRoundup(value) {
        if (value <= 30) return 30;
        if (value <= 60) return 60;
        if (value <= 90) return 90;
        if (value <= 120) return 120;
        if (value <= 150) return 150;
        if (value <= 180) return 180;
        if (value <= 210) return 210;
        if (value <= 240) return 240;
        if (value <= 270) return 270;
        if (value <= 300) return 300;
        return Math.ceil(value / 100) * 100;
    }

    function formatNumberInput(valStr) { // Formatează un număr string (curat) în format localizat
        if (valStr === undefined || valStr === null || valStr.trim() === '') return '';
        const numericVal = Number(valStr.replace(/\D/g, ''));
        if (isNaN(numericVal)) return '';
        return numericVal.toLocaleString('ro-RO');
    }

    function parseNumberInput(valStr) { // Extrage numărul dintr-un string localizat/formatat
        if (typeof valStr !== 'string') valStr = String(valStr);
        return valStr.replace(/\D/g, '');
    }
    
    function snapPvValue(val) {
        if (val < 1000) return Math.round(val / 10) * 10;
        if (val >= 1000 && val <= 2000) return Math.round(val / 50) * 50;
        return Math.round(val / 100) * 100;
    }

    // --- Funcția Principală de Calcul și Actualizare DOM ---
    function recalculateAndRender() {
        const currentMonthlyConsumption = state.monthlyConsumption;
        const currentSelfConsumptionPercent = state.selfConsumptionPercent;
        const currentBuyPrice = state.buyPrice;
        const currentSellPrice = state.sellPrice;
        let currentPvSystem = state.pvSystem; // Poate fi undefined inițial dacă input e gol
        let currentStorageCapacity = state.storageCapacity; // La fel
        const currentStateAidPerMW = state.stateAidPerMW;

        // Recomandări
        const pvValueRaw = Math.min(Math.round(currentMonthlyConsumption * 12 / ((currentSelfConsumptionPercent / 100) * 1100)), 15000);
        const recommendedPv = snapPvValue(pvValueRaw);
        
        if (recommendedPvSystemDisplay) {
            recommendedPvSystemDisplay.textContent = recommendedPv.toLocaleString('ro-RO');
            recommendedPvSystemContainer.style.display = currentPvSystem !== recommendedPv ? 'block' : 'none';
        }
        
        const recStorageCap = customStorageRoundup((currentPvSystem ?? 0) / 60 * 12);
        if (recommendedStorageDisplay) {
            recommendedStorageDisplay.textContent = recStorageCap.toLocaleString('ro-RO');
            recommendedStorageContainer.style.display = currentStorageCapacity !== recStorageCap ? 'block' : 'none';
        }

        // Asigură valori default dacă sunt undefined pentru calcul
        if (currentPvSystem === undefined) currentPvSystem = 0;
        if (currentStorageCapacity === undefined) currentStorageCapacity = 0;


        const annualProduction = currentPvSystem * 1100;
        const monthPcts = [4.16, 5.67, 8.85, 9.87, 10.77, 10.55, 10.98, 10.10, 8.18, 6.42, 4.29, 3.12];
        const monthlyData = monthPcts.map(pct => {
            const value = annualProduction * (pct / 100);
            return chartDisplayMode === 'kWh'
                ? Math.round(value)
                : Math.round(value * state.buyPrice);
        });
        if (productionChart) {
            productionChart.data.datasets[0].data = monthlyData;
            productionChart.update();
        }

        const selfConsumption = Math.round(annualProduction * (currentSelfConsumptionPercent / 100));
        const surplus = annualProduction - selfConsumption;
        const saving = Math.round(selfConsumption * currentBuyPrice);
        const income = Math.round(surplus * currentSellPrice);
        const totalPvIncome = saving + income;
        const storageIncome = Math.round(annualProduction * currentBuyPrice); // Simplificat ca în React

        let pvCostEur = 0;
        if (currentPvSystem <= 1000) {
            pvCostEur = currentPvSystem * 550;
        } else {
            pvCostEur = 1000 * 550 + (currentPvSystem - 1000) * 500;
        }

        const storageCostPerKwh = 250;
        const individualStorageCostEur = currentStorageCapacity * storageCostPerKwh;
        const totalPlusStorageCostEur = pvCostEur + individualStorageCostEur; // Cost PV + Cost Stocare
        const pvCostRon = pvCostEur * EUR_TO_RON_CALC;
        const totalPlusStorageCostRon = totalPlusStorageCostEur * EUR_TO_RON_CALC;
        
        const paybackPvRon = totalPvIncome > 0 ? pvCostRon / totalPvIncome : 0;
        const paybackBessRon = storageIncome > 0 ? totalPlusStorageCostRon / storageIncome : 0;

        // Buget
        const stateAidTotalRON = currentStateAidPerMW * EUR_TO_RON_CALC * (currentPvSystem / 1000);
        const nonEligibleCostRonVal = individualStorageCostEur * EUR_TO_RON_CALC; // Costul stocării
        const eligibleCostRonVal = pvCostRon; // Costul PV
        const ownContributionRonVal = Math.max(0, totalPlusStorageCostRon - stateAidTotalRON);
        const amortizareCuGrant = ownContributionRonVal > 0 && storageIncome > 0 ? ownContributionRonVal / storageIncome : 0;

        // Amortizare generală (toți indicatorii, fără grant) - Afișare înainte de update chart
        const totalAnnualIncome = totalPvIncome + storageIncome;
        // Formula corectată: Contribuţia proprie a solicitantului / Venituri anuale estimate cu sistem de stocare
        const amortizationYears = storageIncome > 0 ? (ownContributionRonVal / storageIncome) : 0;
        const amortizationDisplay = document.getElementById('amortizationDisplay');
        if (amortizationDisplay) {
            amortizationDisplay.textContent = amortizationYears > 0 ? amortizationYears.toFixed(1) + " ani" : '—';
        }

  
        // Update DOM Results
        pvCostEurDisplay.textContent = pvCostEur.toLocaleString('ro-RO');
        pvCostRonDisplay.textContent = pvCostRon.toLocaleString('ro-RO');
        storageCostEurDisplay.textContent = totalPlusStorageCostEur.toLocaleString('ro-RO');
        storageCostRonDisplay.textContent = totalPlusStorageCostRon.toLocaleString('ro-RO');
        annualProductionDisplay.textContent = annualProduction.toLocaleString('ro-RO') + ' kWh';
        selfConsumedDisplay.textContent = selfConsumption.toLocaleString('ro-RO') + ' kWh';
        surplusEnergyDisplay.textContent = surplus.toLocaleString('ro-RO') + ' kWh';
        selfSavingDisplay.textContent = saving.toLocaleString('ro-RO') + ' RON';
        injectedIncomeDisplay.textContent = income.toLocaleString('ro-RO') + ' RON';
        annualPVIncomeDisplay.textContent = totalPvIncome.toLocaleString('ro-RO') + ' RON';
        annualStorageIncomeDisplay.textContent = storageIncome.toLocaleString('ro-RO') + ' RON';
        
        paybackPvDisplay.textContent = totalPvIncome > 0 ? parseFloat(paybackPvRon.toFixed(1)).toLocaleString('ro-RO', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' ani' : '—';
        paybackBessDisplay.textContent = storageIncome > 0 ? parseFloat(paybackBessRon.toFixed(1)).toLocaleString('ro-RO', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' ani' : '—';
        
        // Indicatori
        indicatorI1Display.textContent = (currentPvSystem / 1000).toLocaleString('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        indicatorI2Display.textContent = (annualProduction * 0.6119).toLocaleString('ro-RO', { minimumFractionDigits: 1, maximumFractionDigits: 1 }); // Factor CO2 din React
        indicatorI3Display.textContent = annualProduction.toLocaleString('ro-RO'); // MWh/an în React era "annualProductionState", ce e kWh. Ghidul cere MWh. Presupun că e anualProductionState (kWh) / 1000
        indicatorI3Display.textContent = (annualProduction / 1000).toLocaleString('ro-RO', {maximumFractionDigits:0});


        const yearsRef = 20; const degradation = 0.005; let totalProductionYears = 0;
        for (let i = 0; i < yearsRef; i++) { totalProductionYears += annualProduction * Math.pow(1 - degradation, i); }
        indicatorI4Display.textContent = (totalProductionYears / 1000).toLocaleString('ro-RO', {maximumFractionDigits: 0});
        
        indicatorI5Display.textContent = annualProduction > 0 ? ((selfConsumption / annualProduction) * 100).toLocaleString('ro-RO', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) : '0,0';
        indicatorI6Display.textContent = annualProduction > 0 && currentPvSystem > 0 ? ((annualProduction / (currentPvSystem * 8760)) * 100).toLocaleString('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0,00';

        // Buget Table
        budgetTotalCostRonDisplay.textContent = totalPlusStorageCostRon.toLocaleString('ro-RO');
        budgetNonEligibleCostDisplay.textContent = nonEligibleCostRonVal.toLocaleString('ro-RO');
        budgetEligibleCostDisplay.textContent = eligibleCostRonVal.toLocaleString('ro-RO');
        budgetStateAidRonDisplay.textContent = stateAidTotalRON.toLocaleString('ro-RO', {maximumFractionDigits: 0});
        budgetOwnContributionDisplay.textContent = ownContributionRonVal.toLocaleString('ro-RO', {maximumFractionDigits: 0});
        paybackWithGrantDisplay.textContent = (venituriAnuale > 0 && ownContributionRonVal > 0) ? Math.round(amortizareCuGrant).toLocaleString('ro-RO') : '—';


        // Update Chart
        if (productionChart) {
            // These lines ensure number formatting uses the Romanian locale with thousands separator
            productionChart.data.datasets[0].data = monthlyData;
            productionChart.data.datasets[0].label = chartDisplayMode === 'kWh'
                ? 'Producție lunară estimată (kWh)'
                : 'Economie lunară estimată (RON)';
            productionChart.options.plugins.datalabels.formatter = (value) => value > 0 ? value.toLocaleString('ro-RO') : '';
            productionChart.options.scales.y.ticks.callback = (value) => value.toLocaleString('ro-RO');
            productionChart.update();
        }
    }

    // --- Inițializare Chart ---
    if (roiChartCanvas) {
        Chart.register(ChartDataLabels);
        productionChart = new Chart(roiChartCanvas, {
            type: 'bar',
            data: {
                labels: ['Ian', 'Feb', 'Mar', 'Apr', 'Mai', 'Iun', 'Iul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                datasets: [{
                    label: 'Producție lunară estimată (kWh)',
                    data: [], // will be populated by recalculateAndRender
                    backgroundColor: 'rgba(24,130,128,0.8)',
                    borderRadius: 4,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const value = context.raw;
                                const label = chartDisplayMode === 'kWh'
                                  ? value.toLocaleString('ro-RO') + ' kWh (' + (value * state.buyPrice).toLocaleString('ro-RO') + ' RON)'
                                  : value.toLocaleString('ro-RO') + ' RON (' + Math.round(value / state.buyPrice).toLocaleString('ro-RO') + ' kWh)';
                                return label;
                            }
                        }
                    },
                    datalabels: {
                        color: 'white',
                        anchor: 'center',
                        align: 'center',
                        rotation: 90,
                        font: { weight: 'bold', size: 14 },
                        // The formatter is set in recalculateAndRender, but can be set here as well for initial empty data
                        formatter: (value) => value > 0 ? value.toLocaleString('ro-RO') : ''
                    }
                },
                scales: {
                    x: {
                        barPercentage: 0.5,
                        categoryPercentage: 0.6,
                        ticks: {
                            maxRotation: 45,
                            minRotation: 45,
                            autoSkip: false
                        }
                    },
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: (value) => value.toLocaleString('ro-RO')
                        }
                    }
                }
            }
        });
    }

    // --- Event Listeners ---

    // Consum Lunar
    monthlyConsumptionSlider.addEventListener('input', (e) => {
        const val = Number(e.target.value);
        state.monthlyConsumption = val;
        state.monthlyConsumptionInputVal = val.toLocaleString('ro-RO');
        monthlyConsumptionInput.value = state.monthlyConsumptionInputVal;
        // Trigger update to related inputs and sliders
        pvSystemSlider.value = snapPvValue(Math.min(Math.round(val * 12 / ((state.selfConsumptionPercent / 100) * 1100)), 15000));
        pvSystemSlider.dispatchEvent(new Event('input'));
        storageCapacitySlider.value = customStorageRoundup((state.pvSystem ?? 0) / 60 * 12);
        storageCapacitySlider.dispatchEvent(new Event('input'));
        recalculateAndRender();
    });
    monthlyConsumptionInput.addEventListener('input', (e) => { // Permite tastarea formatată
        state.monthlyConsumptionInputVal = e.target.value; // Păstrează ce tastează utilizatorul
    });
    monthlyConsumptionInput.addEventListener('change', (e) => { // Procesează la blur/enter
        const numericVal = parseNumberInput(state.monthlyConsumptionInputVal);
        let num = Number(numericVal);
        if (numericVal === '' || isNaN(num)) num = 10000;
        if (num > 1000000) num = 1000000;
        if (num < 10000) num = 10000;
        state.monthlyConsumption = num;
        state.monthlyConsumptionInputVal = num.toLocaleString('ro-RO');
        monthlyConsumptionInput.value = state.monthlyConsumptionInputVal;
        monthlyConsumptionSlider.value = num;
        pvSystemSlider.value = snapPvValue(Math.min(Math.round(num * 12 / ((state.selfConsumptionPercent / 100) * 1100)), 15000));
        pvSystemSlider.dispatchEvent(new Event('input'));
        storageCapacitySlider.value = customStorageRoundup((state.pvSystem ?? 0) / 60 * 12);
        storageCapacitySlider.dispatchEvent(new Event('input'));
        recalculateAndRender();
    });

    // Autoconsum
    selfConsumptionSlider.addEventListener('input', (e) => {
        const val = Number(e.target.value);
        state.selfConsumptionPercent = val;
        selfValueDisplay.textContent = val + '%';
        recalculateAndRender();
    });

    // Preț Cumpărare
    buyPriceSlider.addEventListener('input', (e) => {
        const val = Number(e.target.value);
        state.buyPrice = val;
        buyPriceDisplay.textContent = val.toFixed(2).replace('.', ',') + ' RON/kWh';
        recalculateAndRender();
    });

    // Preț Vânzare
    sellPriceSlider.addEventListener('input', (e) => {
        const val = Number(e.target.value);
        state.sellPrice = val;
        sellPriceDisplay.textContent = val.toFixed(2).replace('.', ',') + ' RON/kWh';
        recalculateAndRender();
    });
    
    // Sistem PV
    pvSystemSlider.addEventListener('input', (e) => {
        let val = Number(e.target.value);
        val = snapPvValue(val);
        state.pvSystem = val;
        state.pvSystemInputVal = val.toLocaleString('ro-RO');
        pvSystemInput.value = state.pvSystemInputVal;
        pvSystemSlider.value = val; // Asigură că sliderul reflectă valoarea "snapped"
        recalculateAndRender();
    });
    pvSystemInput.addEventListener('input', (e) => {
        state.pvSystemInputVal = e.target.value;
    });
    pvSystemInput.addEventListener('change', (e) => {
        const numericVal = parseNumberInput(state.pvSystemInputVal);
        let num = Number(numericVal);
        if (numericVal === '' || isNaN(num)) num = 100;
        if (num > 15000) num = 15000;
        if (num < 100) num = 100;
        num = snapPvValue(num);
        state.pvSystem = num;
        state.pvSystemInputVal = num.toLocaleString('ro-RO');
        pvSystemInput.value = state.pvSystemInputVal;
        pvSystemSlider.value = num;
        recalculateAndRender();
    });

    // Capacitate Stocare
    storageCapacitySlider.addEventListener('input', (e) => {
        let val = Number(e.target.value);
        val = customStorageRoundup(val);
        state.storageCapacity = val;
        state.storageCapacityInputVal = val.toLocaleString('ro-RO');
        storageCapacityInput.value = state.storageCapacityInputVal;
        storageCapacitySlider.value = val; // Asigură că sliderul reflectă valoarea "snapped"
        recalculateAndRender();
    });
    storageCapacityInput.addEventListener('input', (e) => {
        state.storageCapacityInputVal = e.target.value;
    });
    storageCapacityInput.addEventListener('change', (e) => {
        const numericVal = parseNumberInput(state.storageCapacityInputVal);
        let num = Number(numericVal);
        if (numericVal === '' || isNaN(num)) num = 30;
        if (num < 30) num = 30;
        if (num > 5000) num = 5000;
        num = customStorageRoundup(num);
        state.storageCapacity = num;
        state.storageCapacityInputVal = num.toLocaleString('ro-RO');
        storageCapacityInput.value = state.storageCapacityInputVal;
        storageCapacitySlider.value = num;
        recalculateAndRender();
    });

    // Ajutor Stat / MW
    stateAidPerMWSlider.addEventListener('input', (e) => {
        let val = Number(e.target.value);
        // Rotunjire la multiplu de 1000 din React
        val = Math.round(val / 1000) * 1000;
        state.stateAidPerMW = val;
        state.stateAidPerMWInputVal = val.toLocaleString('ro-RO');
        stateAidPerMWInput.value = state.stateAidPerMWInputVal;
        stateAidPerMWDisplay.textContent = val.toLocaleString('ro-RO') + ' EUR';
        stateAidPerMWSlider.value = val; // Asigură snap
        recalculateAndRender();
    });
    stateAidPerMWInput.addEventListener('input', (e) => {
        state.stateAidPerMWInputVal = e.target.value;
    });
    stateAidPerMWInput.addEventListener('change', (e) => {
        const numericVal = parseNumberInput(state.stateAidPerMWInputVal);
        let num = Number(numericVal);
        if (numericVal === '' || isNaN(num)) num = 1000;
        if (num < 1000) num = 1000;
        if (num > 450000) num = 450000;
        num = Math.round(num / 1000) * 1000;
        state.stateAidPerMW = num;
        state.stateAidPerMWInputVal = num.toLocaleString('ro-RO');
        stateAidPerMWInput.value = state.stateAidPerMWInputVal;
        stateAidPerMWDisplay.textContent = num.toLocaleString('ro-RO') + ' EUR';
        stateAidPerMWSlider.value = num;
        recalculateAndRender();
    });

    // --- Inițializare UI la încărcare ---
    function initializeUI() {
        // Setează valorile inițiale ale sliderelor și inputurilor pe baza 'state'
        monthlyConsumptionSlider.value = state.monthlyConsumption;
        monthlyConsumptionInput.value = state.monthlyConsumptionInputVal;
        
        selfConsumptionSlider.value = state.selfConsumptionPercent;
        selfValueDisplay.textContent = state.selfConsumptionPercent + '%';
        
        buyPriceSlider.value = state.buyPrice;
        buyPriceDisplay.textContent = state.buyPrice.toFixed(2).replace('.', ',') + ' RON/kWh';
        
        sellPriceSlider.value = state.sellPrice;
        sellPriceDisplay.textContent = state.sellPrice.toFixed(2).replace('.', ',') + ' RON/kWh';

        pvSystemSlider.value = state.pvSystem;
        pvSystemInput.value = state.pvSystemInputVal;
        // containerul de recomandare se afișează în recalculateAndRender

        state.storageCapacity = customStorageRoundup((state.pvSystem ?? 0) / 60 * 12); // Recalculează storage inițial pe baza PV
        state.storageCapacityInputVal = state.storageCapacity.toLocaleString('ro-RO');
        storageCapacitySlider.value = state.storageCapacity;
        storageCapacityInput.value = state.storageCapacityInputVal;
        
        stateAidPerMWSlider.value = state.stateAidPerMW;
        stateAidPerMWInput.value = state.stateAidPerMWInputVal;
        stateAidPerMWDisplay.textContent = state.stateAidPerMW.toLocaleString('ro-RO') + ' EUR';

        recalculateAndRender(); // Calculează și afișează totul
    }

    initializeUI();

    // --- Chart Unit Toggle Button Logic ---
    const toggleBtn = document.getElementById('toggleChartUnit');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            chartDisplayMode = chartDisplayMode === 'kWh' ? 'RON' : 'kWh';
            // Change button label as well
            toggleBtn.textContent = chartDisplayMode === 'kWh' ? 'kWh / RON' : 'RON / kWh';
            recalculateAndRender();
        });
    }
});