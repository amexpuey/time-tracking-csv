class TimeTrackingApp {
    constructor() {
        this.emails = new Set();
        this.timeEntries = [];
        this.selectedMonths = new Set();
        this.selectedWeekdays = new Set();
        this.selectedYear = new Date().getFullYear();
        this.timeRanges = [];
        this.initializeElements();
        this.attachEventListeners();
        this.addInitialTimeRange();
        this.addInitialRestPeriod();
    }

    initializeElements() {
        // Email input elements
        this.emailInput = document.getElementById('email-input');
        this.emailTags = document.getElementById('email-tags');
        
        // Date selection elements
        this.yearSpan = document.getElementById('selected-year');
        this.yearNavBtns = document.querySelectorAll('.year-nav');
        this.monthsGrid = document.getElementById('months-grid');
        this.weekdaysGrid = document.getElementById('weekdays-grid');
        this.selectAllBtns = document.querySelectorAll('.select-all');
        
        // Mode elements
        this.modeRadios = document.querySelectorAll('input[name="timeMode"]');
        this.manualMode = document.getElementById('manual-mode');
        this.autoMode = document.getElementById('auto-mode');
        
        // Manual mode elements
        this.timeRangesContainer = document.getElementById('time-ranges');
        this.addTimeRangeBtn = document.getElementById('add-time-range');
        
        // Auto mode elements
        this.workHours = document.getElementById('work-hours');
        this.workStartTime = document.getElementById('work-start-time');
        this.restPeriodsContainer = document.getElementById('rest-periods');
        this.addRestPeriodBtn = document.getElementById('add-rest-period');
        
        // Buttons
        this.generateEntriesBtn = document.getElementById('generate-entries');
        this.downloadCsvBtn = document.getElementById('download-csv');
        
        // Containers
        this.timeEntriesContainer = document.getElementById('time-entries');
        this.previewTableBody = document.getElementById('preview-body');
    }

    attachEventListeners() {
        this.emailInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.addEmail();
            }
        });

        // Month selection
        this.monthsGrid.querySelectorAll('.month-btn').forEach(btn => {
            btn.addEventListener('click', () => this.toggleMonth(btn));
        });

        // Weekday selection
        this.weekdaysGrid.querySelectorAll('.weekday-btn').forEach(btn => {
            btn.addEventListener('click', () => this.toggleWeekday(btn));
        });

        // Select all buttons
        this.selectAllBtns.forEach(btn => {
            btn.addEventListener('click', () => this.handleSelectAll(btn.dataset.target));
        });

        this.modeRadios.forEach(radio => {
            radio.addEventListener('change', () => this.handleModeChange());
        });

        this.addTimeRangeBtn.addEventListener('click', () => this.addTimeRange());
        this.generateEntriesBtn.addEventListener('click', () => this.generateTimeEntries());
        this.downloadCsvBtn.addEventListener('click', () => this.downloadCsv());
        
        this.startDate = document.getElementById('start-date');
        this.endDate = document.getElementById('end-date');
        this.startDate.addEventListener('change', () => this.validateDateRange());
        this.endDate.addEventListener('change', () => this.validateDateRange());

        // Year navigation
        this.yearNavBtns.forEach(btn => {
            btn.addEventListener('click', () => this.navigateYear(btn.dataset.direction));
        });

        // Rest period management
        this.addRestPeriodBtn.addEventListener('click', () => this.addRestPeriod());
        this.attachRestPeriodListeners(this.restPeriodsContainer.querySelector('.rest-period'));
    }

    toggleMonth(btn) {
        const month = btn.dataset.month;
        btn.classList.toggle('selected');
        if (this.selectedMonths.has(month)) {
            this.selectedMonths.delete(month);
        } else {
            this.selectedMonths.add(month);
        }
    }

    toggleWeekday(btn) {
        const day = btn.dataset.day;
        btn.classList.toggle('selected');
        if (this.selectedWeekdays.has(day)) {
            this.selectedWeekdays.delete(day);
        } else {
            this.selectedWeekdays.add(day);
        }
    }

    handleSelectAll(target) {
        const isMonths = target === 'months';
        const grid = isMonths ? this.monthsGrid : this.weekdaysGrid;
        const buttons = grid.querySelectorAll(isMonths ? '.month-btn' : '.weekday-btn');
        const selectedSet = isMonths ? this.selectedMonths : this.selectedWeekdays;
        
        const allSelected = Array.from(buttons).every(btn => btn.classList.contains('selected'));
        
        buttons.forEach(btn => {
            const value = btn.dataset[isMonths ? 'month' : 'day'];
            if (allSelected) {
                btn.classList.remove('selected');
                selectedSet.delete(value);
            } else {
                btn.classList.add('selected');
                selectedSet.add(value);
            }
        });
    }

    handleModeChange() {
        const mode = document.querySelector('input[name="timeMode"]:checked').value;
        this.manualMode.style.display = mode === 'manual' ? 'block' : 'none';
        this.autoMode.style.display = mode === 'auto' ? 'block' : 'none';
    }

    addInitialTimeRange() {
        this.addTimeRange();
    }

    addTimeRange() {
        const rangeDiv = document.createElement('div');
        rangeDiv.className = 'time-range';
        rangeDiv.innerHTML = `
            <input type="time" class="range-time-in" placeholder="Check-in">
            <span>to</span>
            <input type="time" class="range-time-out" placeholder="Check-out">
            <button type="button" class="remove-range">&times;</button>
        `;

        // Add event listener to remove button
        const removeBtn = rangeDiv.querySelector('.remove-range');
        removeBtn.addEventListener('click', () => {
            if (this.timeRangesContainer.children.length > 1) {
                rangeDiv.remove();
            } else {
                alert('At least one time range is required');
            }
        });

        // Add validation for time ranges
        const timeIn = rangeDiv.querySelector('.range-time-in');
        const timeOut = rangeDiv.querySelector('.range-time-out');

        [timeIn, timeOut].forEach(input => {
            input.addEventListener('change', () => {
                if (timeIn.value && timeOut.value) {
                    if (timeIn.value >= timeOut.value) {
                        alert('Check-out time must be after check-in time');
                        input.value = '';
                    }
                }
            });
        });

        this.timeRangesContainer.appendChild(rangeDiv);
    }

    getTimeRanges() {
        const ranges = [];
        const timeRanges = this.timeRangesContainer.querySelectorAll('.time-range');
        
        timeRanges.forEach(range => {
            const timeIn = range.querySelector('.range-time-in').value;
            const timeOut = range.querySelector('.range-time-out').value;
            
            if (timeIn && timeOut) {
                ranges.push({ timeIn, timeOut });
            }
        });
        
        return ranges;
    }

    addEmail() {
        const email = this.emailInput.value.trim();
        if (email && this.validateEmail(email) && !this.emails.has(email)) {
            this.emails.add(email);
            this.createEmailTag(email);
            this.emailInput.value = '';
        }
    }

    validateEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    createEmailTag(email) {
        const tag = document.createElement('div');
        tag.className = 'email-tag';
        tag.innerHTML = `
            ${email}
            <button onclick="app.removeEmail('${email}')">&times;</button>
        `;
        this.emailTags.appendChild(tag);
    }

    removeEmail(email) {
        this.emails.delete(email);
        this.updateEmailTags();
    }

    updateEmailTags() {
        this.emailTags.innerHTML = '';
        this.emails.forEach(email => this.createEmailTag(email));
    }

    validateDateRange() {
        const start = this.startDate.value;
        const end = this.endDate.value;
        
        if (start && end && start > end) {
            alert('End date must be after start date');
            this.endDate.value = '';
        }
    }

    navigateYear(direction) {
        this.selectedYear += direction === 'next' ? 1 : -1;
        this.yearSpan.textContent = this.selectedYear;
    }

    addInitialRestPeriod() {
        // First rest period is added by default in HTML
    }

    addRestPeriod() {
        const restPeriod = document.createElement('div');
        restPeriod.className = 'rest-period';
        restPeriod.innerHTML = `
            <select class="rest-type select-input">
                <option value="lunch">Lunch Break</option>
                <option value="coffee">Coffee Break</option>
                <option value="other">Other Break</option>
            </select>
            <div class="rest-duration">
                <input type="number" class="rest-minutes number-input" min="5" max="240" value="30">
                <span>minutes</span>
            </div>
            <button type="button" class="remove-rest">&times;</button>
        `;

        this.attachRestPeriodListeners(restPeriod);
        this.restPeriodsContainer.appendChild(restPeriod);
    }

    attachRestPeriodListeners(restPeriod) {
        const removeBtn = restPeriod.querySelector('.remove-rest');
        removeBtn.addEventListener('click', () => {
            if (this.restPeriodsContainer.children.length > 1) {
                restPeriod.remove();
            } else {
                alert('At least one rest period is required');
            }
        });
    }

    getRestPeriods() {
        const periods = [];
        this.restPeriodsContainer.querySelectorAll('.rest-period').forEach(period => {
            periods.push({
                type: period.querySelector('.rest-type').value,
                minutes: parseInt(period.querySelector('.rest-minutes').value)
            });
        });
        return periods;
    }

    generateTimeEntries() {
        if (!this.validateForm()) return;

        this.timeEntries = [];

        // Generate entries for each selected month
        this.selectedMonths.forEach(month => {
            const daysInMonth = new Date(this.selectedYear, month, 0).getDate();
            
            // For each day in the month
            for (let day = 1; day <= daysInMonth; day++) {
                const date = new Date(this.selectedYear, month - 1, day);
                const weekday = date.getDay().toString();
                
                // Skip if weekday not selected
                if (!this.selectedWeekdays.has(weekday)) continue;
                
                const dateStr = date.toISOString().split('T')[0];
                
                if (document.querySelector('input[name="timeMode"]:checked').value === 'manual') {
                    this.generateManualEntries(dateStr);
                } else {
                    this.generateAutoEntries(dateStr);
                }
            }
        });

        this.updatePreview();
        this.downloadCsvBtn.disabled = false;
    }

    generateManualEntries(dateStr) {
        const timeRanges = this.getTimeRanges();
        timeRanges.forEach(range => {
            this.emails.forEach(email => {
                // Add random seconds to manual entries as well
                const checkInSecs = Math.floor(Math.random() * 60);
                const checkOutSecs = Math.floor(Math.random() * 60);
                this.timeEntries.push({
                    email,
                    checkIn: `${dateStr} ${range.timeIn}:${checkInSecs.toString().padStart(2, '0')}`,
                    checkOut: `${dateStr} ${range.timeOut}:${checkOutSecs.toString().padStart(2, '0')}`
                });
            });
        });
    }

    generateAutoEntries(dateStr) {
        const workHours = parseFloat(this.workHours.value);
        const baseStartTime = this.workStartTime.value;
        const restPeriods = this.getRestPeriods();
        
        this.emails.forEach(email => {
            const entries = this.generateRandomWorkTimes(dateStr, workHours, restPeriods, baseStartTime);
            this.timeEntries.push(...entries.map(entry => ({ email, ...entry })));
        });
    }

    generateRandomWorkTimes(dateStr, totalHours, restPeriods, baseStartTime) {
        const entries = [];
        let remainingMinutes = totalHours * 60;
        let currentTime = new Date(`${dateStr}T${baseStartTime}`);
        
        // Add random deviation to total work time (-7 to +7 minutes)
        const deviation = Math.floor(Math.random() * 15) - 7;
        remainingMinutes += deviation;

        // Add random minutes (-5 to +5) to start time for more variation
        const startDeviation = Math.floor(Math.random() * 11) - 5;
        currentTime.setMinutes(currentTime.getMinutes() + startDeviation);

        // Calculate work segments based on rest periods
        const segments = restPeriods.length + 1;
        const avgSegmentMinutes = Math.floor(remainingMinutes / segments);

        for (let i = 0; i < segments; i++) {
            // Calculate this segment's duration with some variation
            const segmentVariation = Math.floor(Math.random() * 21) - 10; // ±10 minutes
            const segmentMinutes = Math.max(30, avgSegmentMinutes + segmentVariation);
            
            // Add random seconds to check-in time
            const checkInSecs = Math.floor(Math.random() * 60);
            currentTime.setSeconds(checkInSecs);
            const checkIn = this.formatTime(currentTime);
            
            // Add the segment duration
            currentTime.setMinutes(currentTime.getMinutes() + segmentMinutes);
            
            // Add random seconds to check-out time
            const checkOutSecs = Math.floor(Math.random() * 60);
            currentTime.setSeconds(checkOutSecs);
            const checkOut = this.formatTime(currentTime);
            
            entries.push({
                checkIn: `${dateStr} ${checkIn}`,
                checkOut: `${dateStr} ${checkOut}`
            });
            
            // Add rest period if not the last segment
            if (i < segments - 1) {
                const restPeriod = restPeriods[i];
                // Add random variation to rest time (-2 to +2 minutes)
                const restDeviation = Math.floor(Math.random() * 5) - 2;
                currentTime.setMinutes(currentTime.getMinutes() + restPeriod.minutes + restDeviation);
            }
        }
        
        return entries;
    }

    formatTime(date) {
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const seconds = date.getSeconds().toString().padStart(2, '0');
        return `${hours}:${minutes}:${seconds}`;
    }

    validateForm() {
        if (this.emails.size === 0) {
            alert('Please add at least one email address');
            return false;
        }
        if (this.selectedMonths.size === 0) {
            alert('Please select at least one month');
            return false;
        }
        if (this.selectedWeekdays.size === 0) {
            alert('Please select at least one day of the week');
            return false;
        }
        
        const mode = document.querySelector('input[name="timeMode"]:checked').value;
        if (mode === 'manual') {
            const timeRanges = this.getTimeRanges();
            if (timeRanges.length === 0) {
                alert('Please add at least one valid time range');
                return false;
            }
        } else {
            if (!this.workHours.value || !this.workStartTime.value) {
                alert('Please fill in all auto-generate options');
                return false;
            }
        }
        
        return true;
    }

    updatePreview() {
        this.previewTableBody.innerHTML = '';
        
        this.timeEntries.forEach(entry => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${entry.email}</td>
                <td>${entry.checkIn}</td>
                <td>${entry.checkOut}</td>
            `;
            this.previewTableBody.appendChild(row);
        });
    }

    downloadCsv() {
        if (this.timeEntries.length === 0) {
            alert('No time entries to download');
            return;
        }

        const csv = this.convertToCSV(this.timeEntries);
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.setAttribute('hidden', '');
        a.setAttribute('href', url);
        a.setAttribute('download', 'time_tracking.csv');
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    convertToCSV(entries) {
        const header = ['Email,Check-in DateTime,Check-out DateTime'];
        const rows = entries.map(entry => 
            `${entry.email},${entry.checkIn},${entry.checkOut}`
        );
        return header.concat(rows).join('\n');
    }
}

// Initialize the app
const app = new TimeTrackingApp();
