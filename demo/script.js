/**
 * Campaign Report Demo - Full Functional Version
 * Author: DieuDB | CExP Studio
 */

// ======================= STATE =======================
const state = {
    period: 'day',
    viewMode: 'campaign', // campaign, channel, file
    metrics: 'revenue',
    channel: 'all',
    account: 'all',
    campaign: 'all',
    searchQuery: '',
    currentPage: 1,
    itemsPerPage: 10,
    visibleColumns: {},
    charts: { donut: null, combo: null },
    // Date state
    startDate: '2025-12-01',
    endDate: '2025-12-07',
    isComparing: false,
    // Data cache
    tableData: [],
    filteredData: [],
    // Page state
    currentReport: 'main', // main or beta
    sidebarCollapsed: true, // Auto-collapsed by default

    // Column & Sort State
    columns: {}, // Will be initialized from COLUMN_DEFS
    sort: { column: null, direction: 'asc' }
};

// ======================= COLUMN DEFINITIONS =======================
const COLUMN_DEFS = {
    campaign: [
        { id: 'cb', label: '', static: true, width: '40px' },
        { id: 'name', label: 'Tên chiến dịch', static: true },
        { id: 'user', label: 'Người tạo', default: true },
        { id: 'channel', label: 'Kênh triển khai', default: true },
        { id: 'status', label: 'Trạng thái', default: true },
        { id: 'sent', label: 'Số lượng gửi', type: 'number', default: true },
        { id: 'date', label: 'Thời gian triển khai', default: true },
        { id: 'success', label: 'Số lượng thành công', type: 'number', default: false },
        { id: 'orders', label: 'Số Khách hàng mua', type: 'number', default: false },
        { id: 'revenue', label: 'Doanh thu bán hàng', type: 'money', default: true },
        { id: 'cr', label: 'Tỷ lệ chuyển đổi', type: 'percent', default: false },
        { id: 'aov', label: 'AOV (TB đơn)', type: 'money', default: false }
    ],
    channel: [
        { id: 'cb', label: '', static: true, width: '40px' },
        { id: 'name', label: 'Kênh đi tin', static: true },
        { id: 'total_kh_u', label: 'Tổng Khách hàng (Unique)', type: 'number', default: true },
        { id: 'sent', label: 'Số lượng gửi', type: 'number', default: true },
        { id: 'success', label: 'Số lượng thành công', type: 'number', default: true },
        { id: 'reached', label: 'Khách hàng Tiếp cận', type: 'number', default: true },
        { id: 'orders', label: 'Đơn hàng', type: 'number', default: true },
        { id: 'revenue', label: 'Doanh thu', type: 'money', default: true },
        { id: 'cost', label: 'Chi phí', type: 'money', default: false },
        { id: 'cr', label: 'Tỷ lệ chuyển đổi', type: 'percent', default: true },
        { id: 'cpo', label: 'Chi phí/Đơn', type: 'money', default: false }
    ],
    file: [
        { id: 'cb', label: '', static: true, width: '40px' },
        { id: 'name', label: 'Tên tệp', static: true },
        { id: 'campaign', label: 'Chiến dịch', default: true },
        { id: 'uploadDate', label: 'Ngày upload', default: true },
        { id: 'totalRows', label: 'Số dòng', type: 'number', default: true },
        { id: 'sent', label: 'Số lượng gửi', type: 'number', default: true },
        { id: 'success', label: 'Số lượng thành công', type: 'number', default: true },
        { id: 'orders', label: 'Đơn hàng', type: 'number', default: true },
        { id: 'revenue', label: 'Doanh thu', type: 'money', default: true },
        { id: 'cr', label: 'Tỷ lệ chuyển đổi', type: 'percent', default: true }
    ]
};

// ======================= UTILITY FUNCTIONS =======================
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const formatCurrency = (val) => new Intl.NumberFormat('vi-VN').format(val);
const formatNumber = (val) => new Intl.NumberFormat('en-US').format(val);

/**
 * Format giá trị trục Y/Y1 theo quy tắc K/M/B
 * @param {number} value - Giá trị cần format
 * @returns {string} Giá trị đã format
 */
const formatAxisValue = (value) => {
    if (value < 1000) {
        return value.toString();
    } else if (value < 1000000) {
        return (value / 1000).toFixed(0) + 'K';
    } else if (value < 1000000000) {
        return (value / 1000000).toFixed(0) + 'M';
    } else {
        return (value / 1000000000).toFixed(1) + 'B';
    }
};

// ======================= DATA GENERATORS =======================
function generateTableData(count) {
    const campaigns = [
        "Khuyến mãi Tết 2026", "Tri ân khách hàng VIP", "Ra mắt sản phẩm mới", "Flash Sale 09/09",
        "Chào mừng thành viên mới", "Gợi ý sản phẩm", "Thông báo lịch nghỉ lễ",
        "Back to School", "Black Friday Deal", "Cyber Monday Exclusive"
    ];
    const users = ["vydhm@fpt.com", "linhnt@fpt.com", "cuongdv@fpt.com", "trangtt@fpt.com"];
    const channelOptions = [
        { type: "zalo", icon: "fa-solid fa-comment-dots", class: "zalo", name: "ZNS" },
        { type: "email", icon: "fa-solid fa-envelope", class: "email", name: "Email" },
        { type: "social", icon: "fa-brands fa-facebook", class: "fb", name: "Facebook" },
        { type: "tiktok", icon: "fa-brands fa-tiktok", class: "tiktok", name: "TikTok" },
        { type: "sms", icon: "fa-solid fa-comment-sms", class: "sms", name: "SMS" }
    ];

    return Array.from({ length: count }, (_, i) => {
        const sent = randomInt(50000, 500000);
        const successRate = randomInt(85, 99) / 100;
        const success = Math.floor(sent * successRate);
        const orders = Math.floor(success * (randomInt(1, 5) / 100));
        const aov = randomInt(500000, 2000000);
        const revenue = orders * aov;
        const channel = channelOptions[randomInt(0, channelOptions.length - 1)];

        return {
            id: i + 1,
            name: campaigns[i % campaigns.length] + ` (Batch ${Math.floor(i / campaigns.length) + 1})`,
            subId: '#' + Math.random().toString(16).substr(2, 8),
            date: `01/${randomInt(1, 12)}/2025 - 05/${randomInt(1, 12)}/2025`,
            status: Math.random() > 0.3 ? 'Kết thúc' : 'Đang chạy',
            sent: sent,
            success: success,
            orders: orders,
            revenue: revenue,
            cr: ((orders / sent) * 100).toFixed(2),
            aov: aov,
            user: users[randomInt(0, users.length - 1)],
            channel: channel
        };
    });
}

function generateChannelData() {
    const channels = [
        { name: "FPL Noti", type: "app", icon: "fa-solid fa-bell" },
        { name: "Facebook Ads", type: "social", icon: "fa-brands fa-facebook" },
        { name: "ZNS", type: "zalo", icon: "fa-solid fa-comment-dots" },
        { name: "Tiktok Ads", type: "tiktok", icon: "fa-brands fa-tiktok" },
        { name: "Email", type: "email", icon: "fa-solid fa-envelope" },
        { name: "SMS", type: "sms", icon: "fa-solid fa-comment-sms" }
    ];

    return channels.map((ch, i) => {
        const total_kh_u = randomInt(50000, 200000);
        const sent = Math.floor(total_kh_u * 1.05);
        const success = Math.floor(sent * (randomInt(80, 98) / 100));
        const reached = Math.floor(success * 0.95);
        const orders = Math.floor(reached * (randomInt(1, 8) / 100));
        const revenue = orders * randomInt(200000, 1500000);
        const cost = sent * (i === 5 ? 300 : (i === 4 ? 50 : 250));

        return {
            id: ch.type,
            name: ch.name,
            icon: ch.icon,
            total_kh_u: total_kh_u,
            sent: sent,
            success: success,
            reached: reached,
            orders: orders,
            revenue: revenue,
            cost: cost,
            cr: ((orders / sent) * 100).toFixed(2),
            cpo: orders > 0 ? Math.floor(cost / orders) : 0
        };
    });
}

function generateFileData() {
    const files = [
        "KH_VIP_Segment_A.xlsx", "Data_Email_Campaign.csv", "ZNS_Target_List.xlsx",
        "Facebook_Audience.csv", "SMS_Promo_List.xlsx", "Retargeting_Users.csv",
        "New_Customers_Q4.xlsx", "Churned_Users_Reactivate.csv"
    ];
    const campaigns = ["Khuyến mãi Tết 2026", "Tri ân VIP", "Flash Sale", "Black Friday"];

    return files.map((file, i) => {
        const totalRows = randomInt(10000, 100000);
        const sent = Math.floor(totalRows * 0.95);
        const success = Math.floor(sent * (randomInt(80, 98) / 100));
        const orders = Math.floor(success * (randomInt(1, 5) / 100));
        const revenue = orders * randomInt(300000, 1500000);

        return {
            id: i + 1,
            name: file,
            campaign: campaigns[i % campaigns.length],
            uploadDate: `${randomInt(1, 28)}/${randomInt(10, 12)}/2025`,
            totalRows: totalRows,
            sent: sent,
            success: success,
            orders: orders,
            revenue: revenue,
            cr: ((orders / sent) * 100).toFixed(2)
        };
    });
}

// ======================= INITIALIZATION =======================
document.addEventListener('DOMContentLoaded', function () {
    initColumnVisibility();
    initCharts();
    loadTableData();
    renderTable();
    renderColumnToggle();
    setupEventListeners();
    updatePagination();
    initSidebar();
    initPageSwitching();
});

// ======================= SIDEBAR FUNCTIONS =======================
function initSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const appContainer = document.querySelector('.app-container');

    // Set initial collapsed state
    if (state.sidebarCollapsed) {
        sidebar.classList.add('collapsed');
        appContainer.classList.add('sidebar-collapsed');
    }

    // Auto-expand on hover
    sidebar.addEventListener('mouseenter', () => {
        sidebar.classList.remove('collapsed');
        appContainer.classList.remove('sidebar-collapsed');
    });

    // Auto-collapse on mouse leave
    sidebar.addEventListener('mouseleave', () => {
        if (state.sidebarCollapsed) {
            sidebar.classList.add('collapsed');
            appContainer.classList.add('sidebar-collapsed');
        }
    });
}

function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const appContainer = document.querySelector('.app-container');
    state.sidebarCollapsed = !state.sidebarCollapsed;

    sidebar.classList.toggle('collapsed');
    appContainer.classList.toggle('sidebar-collapsed');
}

// ======================= PAGE SWITCHING =======================
function initPageSwitching() {
    const navReportMain = document.getElementById('navReportMain');
    const navReportBeta = document.getElementById('navReportBeta');

    navReportMain?.addEventListener('click', () => switchReportPage('main'));
    navReportBeta?.addEventListener('click', () => switchReportPage('beta'));
}

function switchReportPage(pageType) {
    state.currentReport = pageType;

    // Update content visibility
    document.getElementById('reportMain').classList.toggle('active', pageType === 'main');
    document.getElementById('reportBeta').classList.toggle('active', pageType === 'beta');

    // Update nav active states
    document.getElementById('navReportMain').classList.toggle('active', pageType === 'main');
    document.getElementById('navReportBeta').classList.toggle('active', pageType === 'beta');

    // Update breadcrumb (optional)
    const breadcrumb = document.querySelector('.breadcrumbs');
    if (breadcrumb && pageType === 'beta') {
        showToast('Đã chuyển sang Báo cáo Beta');
    } else if (breadcrumb) {
        showToast('Đã chuyển sang Báo cáo chính');
    }
}

function initColumnVisibility() {
    // Deep copy COLUMN_DEFS to state.columns to allow reordering without mutating original
    state.columns = JSON.parse(JSON.stringify(COLUMN_DEFS));

    Object.keys(COLUMN_DEFS).forEach(mode => {
        state.visibleColumns[mode] = COLUMN_DEFS[mode]
            .filter(col => col.static || col.default)
            .map(col => col.id);
    });
}

function loadTableData() {
    if (state.viewMode === 'campaign') {
        state.tableData = generateTableData(25);
    } else if (state.viewMode === 'channel') {
        state.tableData = generateChannelData();
    } else {
        state.tableData = generateFileData();
    }
    state.filteredData = [...state.tableData];
    state.currentPage = 1;
}

// ======================= EVENT LISTENERS =======================
function setupEventListeners() {
    // ---- Date Picker ----
    // ---- Date Picker (Litepicker) ----
    const datePicker = document.getElementById('dateRangePicker');
    const dateDropdown = document.getElementById('dateDropdown');
    const btnApply = document.querySelector('.btn-apply');
    const btnCancel = document.querySelector('.btn-cancel');
    const dateText = document.getElementById('dateText');
    const cbCompare = document.getElementById('cbCompare');
    const compareFilter = document.getElementById('compareFilter');

    // Initialize Litepicker
    const picker = new Litepicker({
        element: document.getElementById('litepicker-container'),
        singleMode: false,
        numberOfMonths: 2,
        numberOfColumns: 2,
        inlineMode: true,
        startDate: state.startDate,
        endDate: state.endDate,
        format: 'DD/MM/YYYY',
        maxDays: null, // Dynamic based on Compare mode
        lang: 'vi-VN',
        setup: (picker) => {
            picker.on('selected', (date1, date2) => {
                // Optional: Update UI immediately or wait for Apply
                // state.startDate = date1.format('YYYY-MM-DD');
                // state.endDate = date2.format('YYYY-MM-DD');
            });

            picker.on('error:range', (errMsg) => {
                if (errMsg === 'maxDays') {
                    showToast("Đang bật so sánh: Chỉ được chọn tối đa 31 ngày.");
                }
            });
        }
    });

    // Toggle Dropdown
    datePicker.addEventListener('click', (e) => {
        if (e.target.closest('.date-range-dropdown')) return;
        dateDropdown.classList.toggle('show');

        // Sync picker if opened
        if (dateDropdown.classList.contains('show')) {
            picker.setDateRange(state.startDate, state.endDate);
        }
    });

    // Date Presets
    document.querySelectorAll('.dr-preset').forEach(preset => {
        preset.addEventListener('click', (e) => {
            document.querySelectorAll('.dr-preset').forEach(p => p.classList.remove('active'));
            e.target.classList.add('active');

            const presetText = e.target.innerText;
            const today = new Date();
            let start, end;

            switch (presetText) {
                case 'Hôm nay':
                    start = end = today;
                    break;
                case 'Hôm qua':
                    start = end = new Date(today.setDate(today.getDate() - 1));
                    break;
                case 'Tuần này':
                    const dayOfWeek = today.getDay();
                    start = new Date(today.setDate(today.getDate() - dayOfWeek + 1));
                    end = new Date();
                    break;
                case '30 ngày qua':
                    end = new Date();
                    start = new Date(new Date().setDate(new Date().getDate() - 30));
                    break;
                case 'Tháng này':
                    start = new Date(today.getFullYear(), today.getMonth(), 1);
                    end = new Date();
                    break;
                case 'Tháng trước':
                    start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                    end = new Date(today.getFullYear(), today.getMonth(), 0);
                    break;
                case '2 tháng qua':
                    end = new Date();
                    start = new Date();
                    start.setMonth(start.getMonth() - 2);
                    break;
                case '3 tháng qua':
                    end = new Date();
                    start = new Date();
                    start.setMonth(start.getMonth() - 3);
                    break;
                case '6 tháng qua':
                    end = new Date();
                    start = new Date();
                    start.setMonth(start.getMonth() - 6);
                    break;
                case '12 tháng qua':
                    end = new Date();
                    start = new Date();
                    start.setMonth(start.getMonth() - 12);
                    break;
                case '18 tháng qua':
                    end = new Date();
                    start = new Date();
                    start.setMonth(start.getMonth() - 18);
                    break;
                case '24 tháng qua':
                    end = new Date();
                    start = new Date();
                    start.setMonth(start.getMonth() - 24);
                    break;
            }

            // Update Litepicker
            picker.setDateRange(start, end);
        });
    });

    let isLongMode = false;
    btnApply.addEventListener('click', () => {
        const start = picker.getStartDate();
        const end = picker.getEndDate();

        if (!start || !end) return;

        // Check constraint: If Compare is ON and range > 31 days
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (cbCompare.checked && diffDays > 31) {
            showToast("Đang bật so sánh: Chỉ được chọn tối đa 31 ngày.");
            return; // Stop applying
        }

        // Update State
        state.startDate = start.format('YYYY-MM-DD');
        state.endDate = end.format('YYYY-MM-DD');
        dateText.innerText = `${start.format('DD/MM/YYYY')} - ${end.format('DD/MM/YYYY')}`;

        // Handle Long Mode Switching (Mock Logic)
        // If range > 31 days, we treat it as "Long Mode" and disable Compare
        if (diffDays > 31) {
            isLongMode = true;
            cbCompare.checked = false;
            cbCompare.disabled = true;
            compareFilter.classList.add('disabled');
            document.getElementById('compareInfo').style.display = 'none';

            // Force hide trends
            document.querySelectorAll('.stat-trend').forEach(el => el.style.display = 'none');
            document.querySelectorAll('.stat-subtext').forEach(el => el.style.display = 'block');

            showToast("Đã chọn > 31 ngày. Tắt chế độ so sánh.");
        } else {
            isLongMode = false;
            cbCompare.disabled = false;
            compareFilter.classList.remove('disabled');
        }

        dateDropdown.classList.remove('show');
        updateCharts();
        loadTableData();
        renderTable();
        updatePagination();
    });

    cbCompare.addEventListener('change', (e) => {
        const compareInfo = document.getElementById('compareInfo');
        const trends = document.querySelectorAll('.stat-trend');
        const subtexts = document.querySelectorAll('.stat-subtext');

        if (e.target.checked) {
            // Set maxDays constraint on picker
            // picker.setOptions({ maxDays: 31 }); // Optional: strictly enforce in picker

            const prevRange = getPreviousPeriod(state.startDate, state.endDate);
            if (prevRange) {
                compareInfo.style.display = 'inline';
                compareInfo.innerText = `(vs ${prevRange.previousRange.start} - ${prevRange.previousRange.end})`;
                state.isComparing = true;
                showToast(`Đang so sánh với: ${prevRange.previousRange.start} - ${prevRange.previousRange.end}`);

                // Show trends, hide subtexts
                trends.forEach(el => el.style.display = 'flex');
                subtexts.forEach(el => el.style.display = 'none');
            }
        } else {
            // Remove maxDays constraint
            // picker.setOptions({ maxDays: null });

            compareInfo.style.display = 'none';
            state.isComparing = false;

            // Hide trends, show subtexts
            trends.forEach(el => el.style.display = 'none');
            subtexts.forEach(el => el.style.display = 'block');
        }
    });

    btnCancel.addEventListener('click', () => dateDropdown.classList.remove('show'));

    // ---- Generic Dropdown Handler ----
    setupDropdown('accountFilter', 'accountDropdown', 'accountValue', (val, text) => {
        state.account = val;
        showToast(`Lọc theo tài khoản: ${text}`);
        loadTableData();
        filterTableData();
        renderTable();
    });

    setupDropdown('campaignFilter', 'campaignDropdown', 'campaignValue', (val, text) => {
        state.campaign = val;
        showToast(`Lọc theo chiến dịch: ${text}`);
        loadTableData();
        filterTableData();
        renderTable();
    });

    setupDropdown('periodFilter', 'periodDropdown', 'periodValue', (val, text) => {
        state.period = val;
        showToast(`Hiển thị: ${text}`);
        updateCharts();
    });

    setupDropdown('metricFilter', 'metricDropdown', 'metricValue', (val, text) => {
        state.metrics = val;
        document.getElementById('metricValue').innerText = `Metric: ${text}`;
        showToast(`Metric: ${text}`);
        updateComboChart();
    });

    setupDropdown('channelFilter', 'channelDropdown', 'channelValue', (val, text) => {
        state.channel = val;
        document.getElementById('channelValue').innerText = `Kênh: ${text}`;
        showToast(`Lọc kênh: ${text}`);
        updateCharts();
    });

    // ---- Column Toggle ----
    const btnAddMetric = document.getElementById('btnAddMetric');
    const colDropdown = document.getElementById('columnToggleDropdown');

    btnAddMetric.addEventListener('click', (e) => {
        e.stopPropagation();
        colDropdown.classList.toggle('show');
    });

    document.getElementById('btnResetColumns')?.addEventListener('click', () => {
        initColumnVisibility();
        renderColumnToggle();
        renderTable();
        showToast('Đã đặt lại cấu hình cột mặc định');
    });

    // ---- Table Tabs ----
    document.querySelectorAll('.table-tabs .tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.table-tabs .tab-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');

            const tabName = e.target.innerText.trim();
            if (tabName === 'Chiến dịch') state.viewMode = 'campaign';
            else if (tabName === 'Kênh đi tin') state.viewMode = 'channel';
            else state.viewMode = 'file';

            loadTableData();
            renderColumnToggle();
            renderTable();
            updatePagination();
            showToast(`Đã chuyển sang: ${tabName}`);
        });
    });

    // ---- Search ----
    const searchInput = document.getElementById('tableSearchInput');
    searchInput.addEventListener('input', (e) => {
        state.searchQuery = e.target.value.toLowerCase();
        state.currentPage = 1;
        filterTableData();
        renderTable();
        updatePagination();
    });

    // ---- Drag & Drop for Headers ----
    // Delegated event for dynamically generated headers
    const thead = document.querySelector('thead');
    let draggedColId = null;

    thead.addEventListener('dragstart', (e) => {
        const th = e.target.closest('th');
        if (!th || !th.draggable) return;

        draggedColId = th.dataset.colId;
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', draggedColId);
        th.classList.add('dragging');
    });

    thead.addEventListener('dragend', (e) => {
        const th = e.target.closest('th');
        if (th) th.classList.remove('dragging');
        document.querySelectorAll('th').forEach(cell => cell.classList.remove('drag-over'));
    });

    thead.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        const th = e.target.closest('th');
        if (th && th.dataset.colId && th.dataset.colId !== draggedColId) {
            th.classList.add('drag-over');
        }
    });

    thead.addEventListener('dragleave', (e) => {
        const th = e.target.closest('th');
        if (th) th.classList.remove('drag-over');
    });

    thead.addEventListener('drop', (e) => {
        e.preventDefault();
        const targetTh = e.target.closest('th');
        if (!targetTh || !draggedColId) return;

        const targetColId = targetTh.dataset.colId;
        if (targetColId === draggedColId) return;

        // Reorder state.columns
        const currentCols = state.columns[state.viewMode];
        const fromIndex = currentCols.findIndex(c => c.id === draggedColId);
        const toIndex = currentCols.findIndex(c => c.id === targetColId);

        if (fromIndex > -1 && toIndex > -1) {
            // Remove from old pos
            const [movedCol] = currentCols.splice(fromIndex, 1);
            // Insert at new pos
            currentCols.splice(toIndex, 0, movedCol);

            showToast('Đã thay đổi vị trí cột');
            renderTable();
        }
    });

    // ---- Export Buttons ----
    document.getElementById('btnExportTable')?.addEventListener('click', exportTableToCSV);
    document.getElementById('btnExportChart')?.addEventListener('click', exportChartImage);

    // ---- Close dropdowns on outside click ----
    document.addEventListener('click', (e) => {
        // Close date dropdown
        if (!datePicker.contains(e.target)) {
            dateDropdown.classList.remove('show');
        }
        // Close column dropdown
        if (!document.getElementById('addMetricFilter').contains(e.target)) {
            colDropdown.classList.remove('show');
        }
        // Close all filter dropdowns
        document.querySelectorAll('.filter-item.dropdown').forEach(item => {
            if (!item.contains(e.target)) {
                item.querySelector('.dropdown-menu')?.classList.remove('show');
            }
        });
        document.querySelectorAll('.filter-pil').forEach(item => {
            if (!item.contains(e.target)) {
                item.querySelector('.dropdown-menu')?.classList.remove('show');
            }
        });
    });

    // ---- Sidebar Navigation ----
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function () {
            document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
            this.classList.add('active');
            showToast('Navigation: Demo mode');
        });
    });
}

// ======================= DROPDOWN HELPER =======================
function setupDropdown(filterId, dropdownId, valueId, callback) {
    const filter = document.getElementById(filterId);
    const dropdown = document.getElementById(dropdownId);
    const valueSpan = document.getElementById(valueId);

    if (!filter || !dropdown) return;

    filter.addEventListener('click', (e) => {
        e.stopPropagation();
        // Close other dropdowns
        document.querySelectorAll('.dropdown-menu.show').forEach(d => {
            if (d.id !== dropdownId) d.classList.remove('show');
        });
        dropdown.classList.toggle('show');
    });

    dropdown.querySelectorAll('.dropdown-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.stopPropagation();
            const val = item.dataset.value;
            const text = item.innerText;
            if (valueSpan) valueSpan.innerText = text;
            dropdown.classList.remove('show');
            callback(val, text);
        });
    });
}

// ======================= TABLE RENDERING =======================
function filterTableData() {
    let data = [...state.tableData];

    // Search filter
    if (state.searchQuery) {
        data = data.filter(item =>
            item.name.toLowerCase().includes(state.searchQuery) ||
            (item.user && item.user.toLowerCase().includes(state.searchQuery)) ||
            (item.campaign && item.campaign.toLowerCase().includes(state.searchQuery))
        );
    }

    // Sorting
    if (state.sort.column) {
        sortData(data, state.sort.column, state.sort.direction);
    }

    state.filteredData = data;
}

function sortData(data, columnId, direction) {
    data.sort((a, b) => {
        let valA = a[columnId];
        let valB = b[columnId];

        // Handle special objects (column renderers might rely on objects, but sorting usually looks at raw data or name)
        if (typeof valA === 'object' && valA !== null && valA.name) valA = valA.name;
        if (typeof valB === 'object' && valB !== null && valB.name) valB = valB.name;

        // Handle percentages (string like "5.12%")
        if (typeof valA === 'string' && valA.includes('%')) valA = parseFloat(valA);
        if (typeof valB === 'string' && valB.includes('%')) valB = parseFloat(valB);

        // Handle numeric strings
        if (typeof valA === 'string' && !isNaN(valA) && !isNaN(parseFloat(valA))) valA = parseFloat(valA);
        if (typeof valB === 'string' && !isNaN(valB) && !isNaN(parseFloat(valB))) valB = parseFloat(valB);

        if (valA < valB) return direction === 'asc' ? -1 : 1;
        if (valA > valB) return direction === 'asc' ? 1 : -1;
        return 0;
    });
}

function renderTable() {
    const thead = document.querySelector('thead tr');
    const tbody = document.querySelector('tbody');
    const visibleCols = state.visibleColumns[state.viewMode] || [];
    const colDefs = COLUMN_DEFS[state.viewMode] || [];

    thead.innerHTML = '';
    tbody.innerHTML = '';

    // Render headers
    // Render headers
    // Use state.columns instead of COLUMN_DEFS to respect order
    const currentCols = state.columns[state.viewMode] || [];

    currentCols.forEach(col => {
        if (col.static || visibleCols.includes(col.id)) {
            const th = document.createElement('th');
            th.dataset.colId = col.id;

            // Content
            let content = col.label;
            if (col.id === 'cb') {
                content = '<input type="checkbox" id="selectAll">';
                th.style.width = col.width || '40px';
                th.classList.add('static-col');
            } else {
                // Add sort indicator
                th.draggable = true;
                th.style.cursor = 'grab';

                content += ` <span class="sort-icon">`;
                if (state.sort.column === col.id) {
                    content += state.sort.direction === 'asc' ? '<i class="fa-solid fa-sort-up"></i>' : '<i class="fa-solid fa-sort-down"></i>';
                } else {
                    content += '<i class="fa-solid fa-sort" style="opacity: 0.2;"></i>';
                }
                content += `</span>`;

                // Sort event
                th.addEventListener('click', () => {
                    const dir = (state.sort.column === col.id && state.sort.direction === 'asc') ? 'desc' : 'asc';
                    state.sort = { column: col.id, direction: dir };
                    filterTableData();
                    renderTable();
                });
            }

            th.innerHTML = content;
            if (col.type === 'number' || col.type === 'money' || col.type === 'percent') {
                th.classList.add('text-right');
            }
            thead.appendChild(th);
        }
    });

    // Pagination
    const start = (state.currentPage - 1) * state.itemsPerPage;
    const end = start + state.itemsPerPage;
    const pageData = state.filteredData.slice(start, end);

    if (pageData.length === 0) {
        tbody.innerHTML = `<tr><td colspan="${visibleCols.length + 1}" class="text-center" style="padding: 40px; color: #64748b;">
            <i class="fa-solid fa-inbox" style="font-size: 32px; margin-bottom: 8px; display: block;"></i>
            Không có dữ liệu
        </td></tr>`;
        return;
    }

    // Use helper to render based on current column order
    if (state.viewMode === 'campaign') {
        renderDynamicRows(tbody, pageData, visibleCols, currentCols, renderCampaignCell);
    } else if (state.viewMode === 'channel') {
        renderDynamicRows(tbody, pageData, visibleCols, currentCols, renderChannelCell);
    } else {
        renderDynamicRows(tbody, pageData, visibleCols, currentCols, renderFileCell);
    }

    // Select all checkbox
    document.getElementById('selectAll')?.addEventListener('change', (e) => {
        document.querySelectorAll('tbody input[type="checkbox"]').forEach(cb => {
            cb.checked = e.target.checked;
        });
    });

    // Update badge
    document.querySelector('.badge').innerText = `${state.filteredData.length} ${state.viewMode === 'campaign' ? 'Chiến dịch' : state.viewMode === 'channel' ? 'Kênh' : 'Tệp'}`;
}

function renderDynamicRows(tbody, data, visibleCols, orderedCols, cellRenderer) {
    data.forEach(item => {
        const tr = document.createElement('tr');

        orderedCols.forEach(col => {
            if (col.static || visibleCols.includes(col.id)) {
                // If checkbox
                if (col.id === 'cb') {
                    const td = document.createElement('td');
                    td.innerHTML = '<input type="checkbox">';
                    tr.appendChild(td);
                } else {
                    const td = document.createElement('td');
                    // Check alignment
                    if (['number', 'money', 'percent'].includes(col.type)) {
                        td.classList.add('text-right');
                    }
                    if (col.id === 'revenue') td.classList.add('bold');

                    td.innerHTML = cellRenderer(col.id, item);
                    tr.appendChild(td);
                }
            }
        });

        tbody.appendChild(tr);
    });
}

function renderCampaignCell(colId, item) {
    switch (colId) {
        case 'name':
            return `<div class="row-title">${item.name}</div><div class="row-sub">${item.subId}</div>`;
        case 'user':
            return `<div class="user-cell">${item.user || '--'}</div>`;
        case 'channel':
            return `<div class="channel-icon ${item.channel.class}"><i class="${item.channel.icon}"></i></div>`;
        case 'status':
            return `<span class="status-badge ${item.status === 'Kết thúc' ? 'success' : 'warning'}">${item.status}</span>`;
        case 'sent': return formatNumber(item.sent);
        case 'date': return item.date;
        case 'success': return formatNumber(item.success);
        case 'orders': return formatNumber(item.orders);
        case 'revenue': return formatNumber(item.revenue);
        case 'cr': return `${item.cr}%`;
        case 'aov': return formatNumber(item.aov);
        default: return item[colId] || '';
    }
}

function renderChannelCell(colId, item) {
    switch (colId) {
        case 'name':
            return `
                <div class="row-title" style="display:flex; align-items:center; gap:8px;">
                    <i class="${item.icon}" style="color: var(--accent-blue); width: 20px;"></i>
                    ${item.name}
                </div>`;
        case 'total_kh_u': return formatNumber(item.total_kh_u);
        case 'sent': return formatNumber(item.sent);
        case 'success': return formatNumber(item.success);
        case 'reached': return formatNumber(item.reached);
        case 'orders': return formatNumber(item.orders);
        case 'revenue': return formatNumber(item.revenue);
        case 'cost': return formatNumber(item.cost);
        case 'cr': return `${item.cr}%`;
        case 'cpo': return formatNumber(item.cpo);
        default: return item[colId] || '';
    }
}

function renderFileCell(colId, item) {
    switch (colId) {
        case 'name':
            return `<div class="row-title"><i class="fa-solid fa-file-excel" style="color: #16a34a; margin-right: 8px;"></i>${item.name}</div>`;
        case 'campaign': return item.campaign;
        case 'uploadDate': return item.uploadDate;
        case 'totalRows': return formatNumber(item.totalRows);
        case 'sent': return formatNumber(item.sent);
        case 'success': return formatNumber(item.success);
        case 'orders': return formatNumber(item.orders);
        case 'revenue': return formatNumber(item.revenue);
        case 'cr': return `${item.cr}%`;
        default: return item[colId] || '';
    }
}

// ======================= COLUMN TOGGLE =======================
function renderColumnToggle() {
    const container = document.getElementById('columnCheckboxes');
    if (!container) return;

    const colDefs = COLUMN_DEFS[state.viewMode] || [];
    const visibleCols = state.visibleColumns[state.viewMode] || [];

    container.innerHTML = colDefs
        .filter(col => !col.static)
        .map(col => `
            <label class="dropdown-item" style="cursor: pointer;">
                <input type="checkbox" ${visibleCols.includes(col.id) ? 'checked' : ''} data-col="${col.id}" style="margin-right: 8px;">
                ${col.label}
            </label>
        `).join('');

    // Add event listeners
    container.querySelectorAll('input[type="checkbox"]').forEach(cb => {
        cb.addEventListener('change', (e) => {
            const colId = e.target.dataset.col;
            if (e.target.checked) {
                if (!state.visibleColumns[state.viewMode].includes(colId)) {
                    state.visibleColumns[state.viewMode].push(colId);
                }
            } else {
                state.visibleColumns[state.viewMode] = state.visibleColumns[state.viewMode].filter(id => id !== colId);
            }
            renderTable();
        });
    });
}

// ======================= PAGINATION =======================
function updatePagination() {
    const totalPages = Math.ceil(state.filteredData.length / state.itemsPerPage);
    const pagination = document.querySelector('.pagination');

    const start = (state.currentPage - 1) * state.itemsPerPage + 1;
    const end = Math.min(state.currentPage * state.itemsPerPage, state.filteredData.length);

    pagination.innerHTML = `
        <span>Hiển thị ${start}-${end} trên ${state.filteredData.length}</span>
        <div class="page-controls">
            <button ${state.currentPage === 1 ? 'disabled' : ''} data-page="prev"><i class="fa-solid fa-chevron-left"></i></button>
            ${generatePageButtons(totalPages)}
            <button ${state.currentPage === totalPages ? 'disabled' : ''} data-page="next"><i class="fa-solid fa-chevron-right"></i></button>
        </div>
    `;

    // Event listeners
    pagination.querySelectorAll('button[data-page]').forEach(btn => {
        btn.addEventListener('click', () => {
            const page = btn.dataset.page;
            if (page === 'prev' && state.currentPage > 1) {
                state.currentPage--;
            } else if (page === 'next' && state.currentPage < totalPages) {
                state.currentPage++;
            } else if (!isNaN(page)) {
                state.currentPage = parseInt(page);
            }
            renderTable();
            updatePagination();
        });
    });
}

function generatePageButtons(totalPages) {
    let buttons = '';
    const maxVisible = 5;
    let startPage = Math.max(1, state.currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);

    if (endPage - startPage < maxVisible - 1) {
        startPage = Math.max(1, endPage - maxVisible + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
        buttons += `<button data-page="${i}" class="${i === state.currentPage ? 'active' : ''}">${i}</button>`;
    }
    return buttons;
}

// ======================= CHARTS =======================
function initCharts() {
    // Donut Chart
    const ctxDonut = document.getElementById('donutChart').getContext('2d');
    state.charts.donut = new Chart(ctxDonut, {
        type: 'doughnut',
        data: {
            labels: ['Thành công', 'Thất bại', 'Chưa có thông tin'],
            datasets: [{
                data: [85, 10, 5],
                backgroundColor: ['#1e3a8a', '#ef4444', '#cbd5e1'],
                borderWidth: 0,
                cutout: '75%'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            const dataset = context.dataset;
                            const total = dataset.data.reduce((acc, data) => acc + data, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });

    // Combo Chart
    const ctxCombo = document.getElementById('comboChart').getContext('2d');
    state.charts.combo = new Chart(ctxCombo, {
        type: 'bar',
        data: getComboData(),
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'top', align: 'end' }
            },
            scales: {
                x: { grid: { display: false } },
                y: {
                    beginAtZero: true,
                    grid: { borderDash: [2, 2] },
                    ticks: {
                        callback: function (value) {
                            return formatAxisValue(value);
                        }
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    grid: { display: false },
                    ticks: {
                        callback: function (value) {
                            return formatAxisValue(value);
                        }
                    }
                }
            }
        }
    });
}

function getComboData() {
    // Tạo labels động dựa trên date range và period
    const labels = generateDateLabels(state.startDate, state.endDate, state.period);

    const metricConfigs = {
        revenue: {
            bar: {
                label: 'Doanh thu (VND)',
                color: '#1e3a8a',
                data: Array.from({ length: labels.length }, () => randomInt(100000000, 500000000))
            },
            line: {
                label: 'Chi phí (VND)',
                color: '#ef4444',
                data: Array.from({ length: labels.length }, () => randomInt(5000000, 20000000))
            }
        },
        orders: {
            bar: {
                label: 'Số đơn hàng',
                color: '#1e3a8a',
                data: Array.from({ length: labels.length }, () => randomInt(50, 200))
            },
            line: {
                label: 'Tỷ lệ chuyển đổi (%)',
                color: '#10b981',
                data: Array.from({ length: labels.length }, () => (randomInt(1, 8) + Math.random()).toFixed(2))
            }
        },
        sendout: {
            bar: {
                label: 'Số lượng tin gửi',
                color: '#1e3a8a',
                data: Array.from({ length: labels.length }, () => randomInt(10000, 50000))
            },
            line: {
                label: 'Tỷ lệ thành công (%)',
                color: '#10b981',
                data: Array.from({ length: labels.length }, () => randomInt(85, 99))
            }
        },
        cir: {
            bar: {
                label: 'Doanh thu (VND)',
                color: '#1e3a8a',
                data: Array.from({ length: labels.length }, () => randomInt(100000000, 500000000))
            },
            line: {
                label: 'CIR (%)',
                color: '#f59e0b',
                data: Array.from({ length: labels.length }, () => (randomInt(3, 10) + Math.random()).toFixed(2))
            }
        },
        funnel: {
            bar: {
                label: 'KH tiếp cận',
                color: '#1e3a8a',
                data: Array.from({ length: labels.length }, () => randomInt(5000, 20000))
            },
            line: {
                label: 'KH mua hàng',
                color: '#10b981',
                data: Array.from({ length: labels.length }, () => randomInt(100, 500))
            }
        }
    };

    const config = metricConfigs[state.metrics] || metricConfigs.revenue;

    return {
        labels: labels,
        datasets: [
            {
                type: 'bar',
                label: config.bar.label,
                data: config.bar.data,
                backgroundColor: config.bar.color,
                order: 2,
                borderRadius: 4
            },
            {
                type: 'line',
                label: config.line.label,
                data: config.line.data,
                borderColor: config.line.color,
                borderWidth: 2,
                pointBackgroundColor: '#fff',
                tension: 0.4,
                yAxisID: 'y1',
                order: 1
            }
        ]
    };
}

function updateCharts() {
    // Update combo chart
    updateComboChart();

    // Update donut chart
    state.charts.donut.data.datasets[0].data = [randomInt(70, 90), randomInt(5, 15), randomInt(0, 10)];
    state.charts.donut.update();

    // Update center text
    const total = (randomInt(200, 300) / 100).toFixed(2);
    document.querySelector('.donut-center-text .text-large').innerText = total + 'M';
}

function updateComboChart() {
    const newData = getComboData();
    state.charts.combo.data = newData;
    state.charts.combo.update();
}

// ======================= EXPORT FUNCTIONS =======================
function exportTableToCSV() {
    const colDefs = COLUMN_DEFS[state.viewMode].filter(c => !c.static && state.visibleColumns[state.viewMode].includes(c.id));
    const headers = colDefs.map(c => c.label);

    let csv = headers.join(',') + '\n';

    state.filteredData.forEach(row => {
        const values = colDefs.map(col => {
            let val = row[col.id];
            if (typeof val === 'object') val = val.name || '';
            return `"${val}"`;
        });
        csv += values.join(',') + '\n';
    });

    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `campaign_report_${state.viewMode}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();

    showToast('Đã xuất file CSV thành công!');
}

function exportChartImage() {
    const canvas = document.getElementById('comboChart');
    const link = document.createElement('a');
    link.download = `chart_${state.metrics}_${new Date().toISOString().slice(0, 10)}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();

    showToast('Đã xuất biểu đồ thành công!');
}

// ======================= UTILITY FUNCTIONS =======================
/**
 * Tạo mảng nhãn cho trục X dựa trên khoảng thời gian
 * @param {string} startDate - Ngày bắt đầu (YYYY-MM-DD)
 * @param {string} endDate - Ngày kết thúc (YYYY-MM-DD)
 * @param {string} period - Loại hiển thị: 'day', 'week', 'month'
 * @returns {Array} Mảng nhãn cho trục X
 */
function generateDateLabels(startDate, endDate, period = 'day') {
    const parseDate = (str) => new Date(str + "T00:00:00");
    const start = parseDate(startDate);
    const end = parseDate(endDate);
    const oneDay = 24 * 60 * 60 * 1000;
    const daysDiff = Math.round((end - start) / oneDay) + 1;

    if (period === 'day') {
        // Tạo nhãn theo ngày
        const labels = [];
        for (let i = 0; i < daysDiff; i++) {
            const currentDate = new Date(start.getTime() + i * oneDay);
            labels.push(getDateLabel(currentDate));
        }
        return labels;
    } else if (period === 'week') {
        // Logic cho hiển thị theo tuần
        const weekCount = Math.ceil(daysDiff / 7);
        return Array.from({ length: weekCount }, (_, i) => `Tuần ${i + 1}`);
    } else {
        // Logic cho hiển thị theo tháng
        const months = [];
        let current = new Date(start);
        while (current <= end) {
            const monthName = `Tháng ${current.getMonth() + 1}`;
            if (!months.includes(monthName)) {
                months.push(monthName);
            }
            current.setMonth(current.getMonth() + 1);
        }
        return months.length > 0 ? months : ['Tháng 10', 'Tháng 11', 'Tháng 12'];
    }
}

/**
 * Chuyển đổi Date object thành nhãn dd/mm
 * @param {Date} date - Đối tượng Date
 * @returns {string} Nhãn ngày/tháng (01/12, 02/12, ...)
 */
function getDateLabel(date) {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    return `${day}/${month}`;
}

function getPreviousPeriod(startDateStr, endDateStr) {
    const parseDate = (str) => new Date(str + "T00:00:00");
    const formatDateUI = (date) => {
        const d = date.getDate().toString().padStart(2, '0');
        const m = (date.getMonth() + 1).toString().padStart(2, '0');
        return `${d}/${m}`;
    };

    const currentStart = parseDate(startDateStr);
    const currentEnd = parseDate(endDateStr);
    const oneDay = 24 * 60 * 60 * 1000;
    const daysDiff = Math.round((currentEnd - currentStart) / oneDay);
    const duration = daysDiff + 1;

    if (duration > 31) return null;

    let prevEnd = new Date(currentEnd);
    const originalDay = prevEnd.getDate();
    prevEnd.setMonth(prevEnd.getMonth() - 1);
    if (prevEnd.getDate() !== originalDay) prevEnd.setDate(0);

    let prevStart = new Date(prevEnd);
    prevStart.setDate(prevEnd.getDate() - daysDiff);

    return {
        previousRange: { start: formatDateUI(prevStart), end: formatDateUI(prevEnd) }
    };
}

function formatDateISO(date) {
    const y = date.getFullYear();
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const d = date.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${d}`;
}

function showToast(message) {
    let toast = document.querySelector('.toast-message');
    if (!toast) {
        toast = document.createElement('div');
        toast.className = 'toast-message';
        document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}
