/**
 * Hostel Management System - Frontend Logic
 */

/** Java Spring Boot: API on port 8080 under /api */
const API_BASE_URL = '/api';

/** Global Student Management Actions */
window.viewStudent = async function(id) {
    console.log('--- ACTION: viewStudent --- ID:', id);
    try {
        const response = await apiFetch(`/students/${id}`);
        if (response.ok) {
            const student = await response.json();
            
            document.getElementById('viewStudentName').textContent = student.name || 'N/A';
            document.getElementById('viewStudentId').textContent = `ID: ${student.id}`;
            document.getElementById('viewStudentContact').textContent = student.contact || 'N/A';
            document.getElementById('viewStudentFatherContact').textContent = student.fatherContact || 'N/A';
            document.getElementById('viewStudentRoom').textContent = student.roomNo || 'Not Allotted';
            document.getElementById('viewStudentBlock').textContent = student.blockNo || 'N/A';
            document.getElementById('viewStudentCategory').textContent = student.category || 'General';
            document.getElementById('viewStudentStatus').textContent = student.status || 'Active';
            document.getElementById('viewStudentAddress').textContent = student.address || 'N/A';
            
            const img = document.getElementById('viewStudentImage');
            if (student.image) {
                const imgPath = student.image.startsWith('/') ? student.image : '/' + student.image;
                img.src = imgPath + '?t=' + new Date().getTime();
            } else {
                img.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}&background=random`;
            }

            if (typeof bootstrap !== 'undefined') {
                const modalEl = document.getElementById('viewStudentModal');
                const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
                modal.show();
            } else {
                alert('Error: Bootstrap JS not loaded');
            }
        }
    } catch (error) {
        console.error('viewStudent Error:', error);
    }
};

window.editStudent = async function(id) {
    console.log('--- ACTION: editStudent --- ID:', id);
    try {
        const response = await apiFetch(`/students/${id}`);
        if (response.ok) {
            const student = await response.json();
            document.getElementById('editStudentId').value = student.id;
            document.getElementById('editStudentName').value = student.name || '';
            document.getElementById('editStudentContact').value = student.contact || '';
            document.getElementById('editStudentFatherContact').value = student.fatherContact || '';
            document.getElementById('editStudentCategory').value = student.category || 'General';
            document.getElementById('editStudentStatus').value = student.status || 'Active';
            document.getElementById('editStudentAddress').value = student.address || '';
            
            if (typeof bootstrap !== 'undefined') {
                const modalEl = document.getElementById('editStudentModal');
                const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
                modal.show();
            }
        }
    } catch (error) {
        console.error('editStudent Error:', error);
    }
};

window.deleteStudent = async function(id) {
    console.log('--- ACTION: deleteStudent --- ID:', id);
    if (!confirm('Are you sure you want to delete this student?')) return;
    try {
        const response = await apiFetch(`/students/${id}`, { method: 'DELETE' });
        if (response.ok) {
            alert('Student deleted successfully');
            loadFullStudentsList();
        }
    } catch (error) {
        console.error('deleteStudent Error:', error);
    }
};

window.handleEditStudentSubmit = async function(e) {
    e.preventDefault();
    const id = document.getElementById('editStudentId').value;
    const updatedData = {
        name: document.getElementById('editStudentName').value,
        contact: document.getElementById('editStudentContact').value,
        fatherContact: document.getElementById('editStudentFatherContact').value,
        category: document.getElementById('editStudentCategory').value,
        status: document.getElementById('editStudentStatus').value,
        address: document.getElementById('editStudentAddress').value
    };

    const btn = e.target.querySelector('button[type="submit"]');
    if (btn) {
        btn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i> Updating...';
        btn.disabled = true;
    }

    try {
        const response = await apiFetch(`/students/${id}/profile`, {
            method: 'PUT',
            body: JSON.stringify(updatedData)
        });

        if (response.ok) {
            alert('Student updated successfully!');
            const modalEl = document.getElementById('editStudentModal');
            if (typeof bootstrap !== 'undefined') {
                bootstrap.Modal.getOrCreateInstance(modalEl).hide();
            }
            loadFullStudentsList();
        } else {
            alert('Failed to update student');
        }
    } catch (error) {
        console.error('handleEditStudentSubmit Error:', error);
    } finally {
        if (btn) {
            btn.innerHTML = 'Update Student';
            btn.disabled = false;
        }
    }
};

// Clear any corrupted localStorage on app start
function initializeApp() {
    try {
        const token = localStorage.getItem('token');
        const userInfoRaw = localStorage.getItem('userInfo');
        
        if (token && userInfoRaw) {
            try {
                const userInfo = JSON.parse(userInfoRaw);
                // Validate that userInfo has required fields
                if (!userInfo.email || typeof userInfo !== 'object') {
                    throw new Error('Invalid user info structure');
                }
            } catch {
                // Clear corrupted data
                localStorage.removeItem('token');
                localStorage.removeItem('userInfo');
                console.log('Cleared corrupted localStorage');
            }
        }
    } catch (e) {
        console.error('Error initializing app:', e);
        localStorage.clear();
    }
}

/** Pages only for hostel admins (full management UI). */
const ADMIN_ONLY_PAGES = [
    'dashboard.html',
    'students.html',
    'rooms.html',
    'attendance.html',
    'allotment.html',
];

function isPublicPath(path) {
    return (
        path.endsWith('index.html') ||
        path.endsWith('register.html') ||
        path === '/' ||
        path.endsWith('/')
    );
}

/** Last path segment e.g. student-dashboard.html (must not use endsWith('dashboard.html') — that matches student-dashboard too). */
function pathBasename(path) {
    const seg = (path.split('/').pop() || '').split('?')[0];
    return seg || '';
}

function isAdminOnlyPath(path) {
    const file = pathBasename(path);
    return ADMIN_ONLY_PAGES.includes(file);
}

function isAdminUser() {
    try {
        const u = JSON.parse(localStorage.getItem('userInfo') || '{}');
        return !!u.isAdmin;
    } catch {
        return false;
    }
}

/** Local calendar date as YYYY-MM-DD (matches <input type="date">). */
function formatLocalDateInput(d = new Date()) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

document.addEventListener('DOMContentLoaded', () => {
    // Initialize and clean localStorage first
    initializeApp();
    
    console.log('Hostel Management App Initialized');

    checkSession();

    // Check Backend Connection
    checkBackendConnection();

    // Check if we're on the admin dashboard
    if (document.getElementById('pendingRoomRequestsTable')) {
        loadDashboardStats();
        loadPendingRoomRequests();
        loadWaitingList();
        loadRecentRegisteredUsers();
    }

    // Check if we're on the student dashboard
    if (document.getElementById('studentRoomNumber')) {
        loadStudentDashboard();
        setupStudentNavigation();
    }

    // Check if we're on the students page
    if (document.getElementById('studentsList')) {
        loadFullStudentsList();
    }

    // Check if we're on the rooms page
    const roomsListEl = document.getElementById('roomsList');
    if (roomsListEl) {
        roomsListEl.addEventListener('click', onRoomsListClick);
        loadRoomsList();
    }

    // Check if we're on the allotment page
    if (document.getElementById('allotmentList')) {
        loadAllotmentsList();
        loadAllotmentModalData();
    }

    // Check if we're on the attendance page
    if (document.getElementById('attendanceTableBody')) {
        const dateInput = document.getElementById('attendanceDate');
        if (dateInput) {
            // Must set date before loadAttendanceTable — otherwise the first fetch uses an empty date and saved rows never load.
            dateInput.valueAsDate = new Date();
            dateInput.addEventListener('change', loadAttendanceTable);
        }
        loadAttendanceTable();
        const dateDisplay = document.getElementById('currentDateDisplay');
        if (dateDisplay) {
            dateDisplay.textContent = new Date().toLocaleDateString();
        }

        // Add event listeners for filters
        const blockFilter = document.getElementById('blockFilter');
        if (blockFilter) blockFilter.addEventListener('change', loadAttendanceTable);
        
        const roomFilter = document.getElementById('roomFilter');
        if (roomFilter) roomFilter.addEventListener('change', loadAttendanceTable);
        
        const applyBtn = document.getElementById('applyAttendanceFilters');
        if (applyBtn) applyBtn.addEventListener('click', loadAttendanceTable);
    }

    // Handle Student and Admin Login Forms
    const studentLoginForm = document.getElementById('studentLoginForm');
    if (studentLoginForm) {
        studentLoginForm.addEventListener('submit', (e) => handleLogin(e, 'student'));
    }

    const adminLoginForm = document.getElementById('adminLoginForm');
    if (adminLoginForm) {
        adminLoginForm.addEventListener('submit', (e) => handleLogin(e, 'admin'));
    }

    // Handle Register Form
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }

    const editStudentForm = document.getElementById('editStudentForm');
    if (editStudentForm) {
        editStudentForm.addEventListener('submit', handleEditStudentSubmit);
    }

    // Handle Add Room Form
    const addRoomForm = document.getElementById('addRoomForm');
    if (addRoomForm) {
        addRoomForm.addEventListener('submit', handleAddRoom);
    }

    const allotFromRoomForm = document.getElementById('allotFromRoomForm');
    if (allotFromRoomForm) {
        allotFromRoomForm.addEventListener('submit', handleAllotFromRoomSubmit);
    }

    // Handle Add Allotment Form
    const addAllotmentForm = document.getElementById('addAllotmentForm');
    if (addAllotmentForm) {
        addAllotmentForm.addEventListener('submit', handleAddAllotment);
    }

    // Handle Export and Generate Report
    const exportBtn = document.getElementById('exportReportBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', handleExportReport);
    }

    const generateReportBtn = document.getElementById('generateReportBtn');
    if (generateReportBtn) {
        generateReportBtn.addEventListener('click', handleGenerateReport);
    }

    // Handle Mark All Present
    const markAllPresentBtn = document.getElementById('markAllPresent');
    if (markAllPresentBtn) {
        markAllPresentBtn.addEventListener('click', () => {
            const radioButtons = document.querySelectorAll('input[id^="p-"]');
            radioButtons.forEach(radio => radio.checked = true);
        });
    }

    // Handle Save Attendance
    const saveAttendanceBtn = document.getElementById('saveAttendance');
    if (saveAttendanceBtn) {
        saveAttendanceBtn.addEventListener('click', handleSaveAttendance);
    }

    // Handle Logout
    const doLogout = (e) => {
        e.preventDefault();
        localStorage.removeItem('token');
        localStorage.removeItem('userInfo');
        window.location.href = 'index.html';
    };
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) logoutBtn.addEventListener('click', doLogout);
    const logoutBtnStudent = document.getElementById('logoutBtnStudent');
    if (logoutBtnStudent) logoutBtnStudent.addEventListener('click', doLogout);

    if (document.getElementById('pendingRegistrationsTable')) {
        loadPendingRegistrations();
        const refreshPendingBtn = document.getElementById('refreshPendingBtn');
        if (refreshPendingBtn) {
            refreshPendingBtn.addEventListener('click', () => loadPendingRegistrations());
        }
    }

    if (document.getElementById('studentRoomNumber')) {
        loadStudentDashboard();
    }
});

/**
 * Helper for API calls with Authentication
 */
async function apiFetch(endpoint, options = {}) {
    const token = localStorage.getItem('token');
    const headers = { ...options.headers };

    // Only set JSON content type if body is not FormData
    if (!(options.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
    }

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
        ...options,
        headers: headers
    };

    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
    console.log('--- API FETCH ---');
    console.log('Endpoint:', endpoint);
    console.log('Final URL:', url);
    console.log('Method:', options.method || 'GET');
    
    const response = await fetch(url, config);
    return response;
}

/**
 * Check Connection to Backend
 */
async function checkBackendConnection() {
    try {
        const response = await fetch(`${API_BASE_URL}/status`);
        if (response.ok) {
            console.log('Backend connection successful');
            const statusIndicator = document.getElementById('connectionStatus');
            if (statusIndicator) {
                statusIndicator.innerHTML = '<span class="badge bg-success rounded-pill px-3"><i class="fas fa-check-circle me-1"></i> Connected</span>';
            }
        } else {
            throw new Error(`Status: ${response.status}`);
        }
    } catch (error) {
        console.error('Backend connection failed:', error);
        const statusIndicator = document.getElementById('connectionStatus');
        if (statusIndicator) {
            statusIndicator.innerHTML = `<span class="badge bg-danger rounded-pill px-3" title="${error.message}"><i class="fas fa-times-circle me-1"></i> Offline</span>`;
        }
    }
}

/**
 * Auth redirects: admin vs student areas
 */
function checkSession() {
    const token = localStorage.getItem('token');
    const path = window.location.pathname;
    const file = pathBasename(path);
    
    // Validate userInfo data - if corrupt, clear it
    let userInfo = null;
    try {
        const raw = localStorage.getItem('userInfo');
        userInfo = raw ? JSON.parse(raw) : null;
    } catch {
        localStorage.removeItem('userInfo');
        localStorage.removeItem('token');
        userInfo = null;
    }
    
    const admin = userInfo && (userInfo.isAdmin === true || userInfo.isAdmin === 'true');

    // No token - show login page
    if (!token) {
        if (!isPublicPath(path)) {
            window.location.href = 'index.html';
        }
        return;
    }

    // Logged in but on login/register — send to the right home once
    if (isPublicPath(path)) {
        const target = admin ? 'dashboard.html' : 'student-dashboard.html';
        window.location.href = target;
        return;
    }

    if (!admin && isAdminOnlyPath(path)) {
        window.location.href = 'student-dashboard.html';
        return;
    }

    if (admin && file === 'student-dashboard.html') {
        window.location.href = 'dashboard.html';
        return;
    }

    // Display user name if available
    if (userInfo && document.getElementById('userName')) {
        document.getElementById('userName').textContent = userInfo.name || 'User';
    }
}

function escapeHtml(str) {
    if (str == null) return '';
    const d = document.createElement('div');
    d.textContent = String(str);
    return d.innerHTML;
}

/** Clicks on Vacant Rooms table: Allot / row / Delete (no inline onclick — works without globals). */
function onRoomsListClick(e) {
    const allotBtn = e.target.closest('.js-open-allot-modal');
    const delBtn = e.target.closest('.js-delete-room');
    const vacantRow = e.target.closest('tr.vacant-room-row');

    if (allotBtn) {
        e.preventDefault();
        e.stopPropagation();
        const tr = allotBtn.closest('tr');
        if (tr && tr.dataset.roomId) {
            openAllotRoomModal(
                parseInt(tr.dataset.roomId, 10),
                tr.dataset.roomNumber || '',
                tr.dataset.hostelBlock || ''
            );
        }
        return;
    }
    if (delBtn) {
        e.preventDefault();
        e.stopPropagation();
        const id = parseInt(delBtn.getAttribute('data-room-id'), 10);
        if (Number.isFinite(id)) deleteRoom(id);
        return;
    }
    if (vacantRow && !e.target.closest('button')) {
        openAllotRoomModal(
            parseInt(vacantRow.dataset.roomId, 10),
            vacantRow.dataset.roomNumber || '',
            vacantRow.dataset.hostelBlock || ''
        );
    }
}

async function loadPendingRoomRequests() {
    const tbody = document.getElementById('pendingRoomRequestsTable');
    if (!tbody) return;
    try {
        const response = await apiFetch('/requests/pending');
        if (!response.ok) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-danger">Could not load requests.</td></tr>';
            return;
        }
        const requests = await response.json();

        if (requests.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-muted">No pending room requests.</td></tr>';
            return;
        }

        tbody.innerHTML = '';
        requests.forEach((req) => {
            const student = req.student || {};
            const room = req.room || {};
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="ps-3 fw-semibold">${escapeHtml(student.name)}</td>
                <td>Room ${escapeHtml(room.roomNumber)} (${escapeHtml(room.hostelBlock)})</td>
                <td class="small text-muted">${new Date(req.createdAt).toLocaleString()}</td>
                <td class="text-end pe-3">
                    <button type="button" class="btn btn-sm btn-success rounded-pill px-3 me-1" onclick="approveRoomRequest(${req.id})">Approve</button>
                    <button type="button" class="btn btn-sm btn-outline-danger rounded-pill px-3" onclick="rejectRoomRequest(${req.id})">Reject</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (e) {
        console.error(e);
        tbody.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-danger">Error loading requests.</td></tr>';
    }
}

async function approveRoomRequest(requestId) {
    if (!confirm('Approve this room request?')) return;
    try {
        const res = await apiFetch(`/requests/${requestId}/approve`, { method: 'POST' });
        if (res.ok) {
            const data = await res.json();
            alert(data.message || 'Request approved.');
            loadPendingRoomRequests();
            loadDashboardStats();
            loadRecentRegisteredUsers(); // Refresh the list after room allotment
            return;
        }
        const err = await res.json().catch(() => ({}));
        alert(err.message || 'Approval failed.');
    } catch (e) {
        console.error(e);
        alert('Connection error.');
    }
}

async function rejectRoomRequest(requestId) {
    if (!confirm('Reject this room request?')) return;
    try {
        const res = await apiFetch(`/requests/${requestId}/reject`, { method: 'POST' });
        if (res.ok) {
            const data = await res.json();
            alert(data.message || 'Request rejected.');
            loadPendingRoomRequests();
            return;
        }
        const err = await res.json().catch(() => ({}));
        alert(err.message || 'Could not reject.');
    } catch (e) {
        console.error(e);
        alert('Connection error.');
    }
}

async function loadWaitingList() {
    const tbody = document.getElementById('waitingListTable');
    if (!tbody) return;
    try {
        const response = await apiFetch('/requests/waiting-list');
        if (response.ok) {
            const list = await response.json();
            tbody.innerHTML = '';
            if (list.length === 0) {
                tbody.innerHTML = '<tr><td colspan="3" class="text-center py-4 text-muted">Waiting list is empty.</td></tr>';
                return;
            }
            list.forEach((item, index) => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td class="ps-3 fw-bold">#${index + 1}</td>
                    <td>${escapeHtml(item.student.name)}</td>
                    <td class="small text-muted">${new Date(item.createdAt).toLocaleString()}</td>
                `;
                tbody.appendChild(tr);
            });
        }
    } catch (e) {
        console.error('Error loading waiting list:', e);
    }
}

async function loadStudentDashboard() {
    // Ping API to verify connection
    try {
        const ping = await apiFetch('/students/ping');
        if (ping.ok) {
            console.log('API connection verified');
        } else {
            console.error('API ping failed:', ping.status);
        }
    } catch (e) {
        console.error('Could not reach API:', e);
    }

    const myRoomNumber = document.getElementById('studentRoomNumber');
    const myBlockLine = document.getElementById('studentBlockLine');
    const myRoomHint = document.getElementById('studentRoomHint');
    const availableRoomsCard = document.getElementById('availableRoomsCard');
    const unlinkedAlert = document.getElementById('unlinkedProfileAlert');
    
    if (!myRoomNumber) return;

    try {
        // 1. Fetch Room and Profile Details from the unified endpoint
        const response = await apiFetch('/students/room');
        
        if (!response.ok) {
            if (response.status === 401) {
                window.location.href = 'index.html';
                return;
            }
            console.error('Error fetching student room info');
            return;
        }

        const data = await response.json();

        // Store studentId for later use
        window.currentStudentId = data.studentId;

        // 2. Handle Profile Linking (Should always be linked now due to auto-creation)
        if (!data.linked) {
            if (unlinkedAlert) unlinkedAlert.classList.remove('d-none');
            if (myRoomHint) myRoomHint.textContent = 'Profile not linked.';
            return;
        }
        if (unlinkedAlert) unlinkedAlert.classList.add('d-none');

        // 3. Handle Allocation State
        if (data.hasRoom) {
            if (myRoomNumber) myRoomNumber.textContent = data.roomNumber || '—';
            if (myBlockLine) myBlockLine.textContent = data.block ? `Block ${data.block}` : '—';
            if (myRoomHint) myRoomHint.textContent = `Type: ${data.type || '—'} | Status: ${data.status || '—'}`;
            
            // If has room, hide available rooms section
            if (availableRoomsCard) availableRoomsCard.classList.add('d-none');
        } else {
            if (myRoomNumber) myRoomNumber.textContent = 'Not Allotted';
            if (myBlockLine) myBlockLine.textContent = 'Pending allocation';
            if (myRoomHint) myRoomHint.textContent = 'Request a room from the list below';
            
            // Show available rooms
            if (availableRoomsCard) availableRoomsCard.classList.remove('d-none');
            loadAvailableRooms(data.studentId);
            
            // Handle Request Any Room Button
            const requestAnyRoomBtn = document.getElementById('requestAnyRoomBtn');
            if (requestAnyRoomBtn) {
                requestAnyRoomBtn.onclick = () => submitRoomRequest(data.studentId, null);
            }
        }

        // 4. Load student's requests
        loadStudentRequests(data.studentId);
        
        // 5. Load student's profile data
        loadProfileData(data.studentId);

    } catch (e) {
        console.error('Error loading student dashboard:', e);
    }
}

/**
 * Student Dashboard Navigation and Profile Features
 */
function setupStudentNavigation() {
    const navDashboard = document.getElementById('navDashboard');
    const navProfile = document.getElementById('navProfile');
    const navHelp = document.getElementById('navHelp');
    
    const dashboardSection = document.getElementById('dashboardSection');
    const profileSection = document.getElementById('profileSection');
    const helpSection = document.getElementById('helpSection');
    
    if (!navDashboard) return;

    const sections = [dashboardSection, profileSection, helpSection];
    const navLinks = [navDashboard, navProfile, navHelp];

    const switchSection = (targetId) => {
        sections.forEach(s => s?.classList.add('d-none'));
        navLinks.forEach(l => l?.classList.remove('active'));
        
        if (targetId === 'dashboard') {
            dashboardSection?.classList.remove('d-none');
            navDashboard?.classList.add('active');
        } else if (targetId === 'profile') {
            profileSection?.classList.remove('d-none');
            navProfile?.classList.add('active');
        } else if (targetId === 'help') {
            helpSection?.classList.remove('d-none');
            navHelp?.classList.add('active');
        }
    };

    navDashboard.onclick = (e) => { e.preventDefault(); switchSection('dashboard'); };
    navProfile.onclick = (e) => { e.preventDefault(); switchSection('profile'); };
    navHelp.onclick = (e) => { e.preventDefault(); switchSection('help'); };

    // Profile Image Upload Listener
    const profileImageInput = document.getElementById('profileImageInput');
    if (profileImageInput) {
        profileImageInput.onchange = handleProfileImageUpload;
    }

    // Edit Profile Form Listeners
    const editProfileBtn = document.getElementById('editProfileBtn');
    const cancelEditBtn = document.getElementById('cancelEditBtn');
    const profileEditForm = document.getElementById('profileEditForm');
    const profileViewMode = document.getElementById('profileViewMode');

    if (editProfileBtn) {
        editProfileBtn.onclick = () => {
            profileViewMode.classList.add('d-none');
            profileEditForm.classList.remove('d-none');
            editProfileBtn.classList.add('d-none');
        };
    }

    if (cancelEditBtn) {
        cancelEditBtn.onclick = () => {
            profileViewMode.classList.remove('d-none');
            profileEditForm.classList.add('d-none');
            editProfileBtn.classList.remove('d-none');
        };
    }

    if (profileEditForm) {
        profileEditForm.onsubmit = handleProfileUpdate;
    }
}

async function loadProfileData(studentId) {
    try {
        const response = await apiFetch(`/students/${studentId}`);
        if (response.ok) {
            const student = await response.json();
            
            // View Mode
            document.getElementById('profileName').textContent = student.name || '—';
            document.getElementById('viewContact').textContent = student.contact || '—';
            document.getElementById('viewFatherContact').textContent = student.fatherContact || '—';
            document.getElementById('viewCategory').textContent = student.category || 'General';
            document.getElementById('viewCity').textContent = student.city || '—';
            document.getElementById('viewAddress').textContent = student.address || '—';
            
            if (student.image) {
                // Ensure the path is absolute relative to root
                let imgPath = student.image.startsWith('/') ? student.image : '/' + student.image;
                const profileImg = document.getElementById('profileImage');
                
                // Add cache buster and error handler
                profileImg.onerror = () => {
                    console.warn('Image failed to load, falling back to avatar:', imgPath);
                    profileImg.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name || 'Student')}&background=random`;
                    profileImg.onerror = null; // Prevent infinite loop
                };
                profileImg.src = imgPath + '?t=' + new Date().getTime();
            } else {
                const name = student.name || 'Student';
                document.getElementById('profileImage').src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`;
            }

            // Edit Mode
            document.getElementById('editContact').value = student.contact || '';
            document.getElementById('editFatherContact').value = student.fatherContact || '';
            document.getElementById('editCategory').value = student.category || 'General';
            document.getElementById('editCity').value = student.city || '';
            document.getElementById('editAddress').value = student.address || '';
            
            // Set email from userInfo
            const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
            document.getElementById('profileEmail').textContent = userInfo.email || '—';
        }
    } catch (e) {
        console.error('Error loading profile data:', e);
    }
}

async function handleProfileUpdate(e) {
    e.preventDefault();
    if (!window.currentStudentId) {
        alert('Student ID not found. Please refresh the page.');
        return;
    }

    const formData = new FormData(e.target);
    const updatedData = {
        contact: formData.get('contact'),
        fatherContact: formData.get('fatherContact'),
        category: formData.get('category'),
        city: formData.get('city'),
        address: formData.get('address')
    };

    console.log('Updating profile for student:', window.currentStudentId, updatedData);

    try {
        const res = await apiFetch(`/students/${window.currentStudentId}/profile`, {
            method: 'PUT',
            body: JSON.stringify(updatedData)
        });

        if (res.ok) {
            const data = await res.json();
            console.log('Profile update response:', data);
            alert('Profile updated successfully!');
            loadProfileData(window.currentStudentId);
            document.getElementById('cancelEditBtn').click(); // Back to view mode
        } else {
            const errData = await res.json().catch(() => ({}));
            console.error('Profile update failed:', res.status, errData);
            alert(`Failed to update profile: ${errData.message || 'Server error'}`);
        }
    } catch (e) {
        console.error('Error updating profile:', e);
        alert('Connection error. Could not reach server.');
    }
}

async function handleProfileImageUpload(e) {
    const file = e.target.files[0];
    if (!file || !window.currentStudentId) return;

    // Validate file size (e.g., 5MB)
    if (file.size > 5 * 1024 * 1024) {
        alert('File is too large. Please select an image smaller than 5MB.');
        return;
    }

    const formData = new FormData();
    formData.append('file', file);

    const profileImg = document.getElementById('profileImage');
    const originalSrc = profileImg.src;
    profileImg.style.opacity = '0.5';

    try {
        const response = await apiFetch(`/students/${window.currentStudentId}/upload`, {
            method: 'POST',
            body: formData
        });

        const data = await response.json();
        if (response.ok) {
            const imgPath = data.imageUrl.startsWith('/') ? data.imageUrl : '/' + data.imageUrl;
            
            profileImg.onerror = () => {
                console.warn('Newly uploaded image failed to load:', imgPath);
                profileImg.src = `https://ui-avatars.com/api/?name=Student&background=random`;
                profileImg.onerror = null;
            };
            
            profileImg.src = imgPath + '?t=' + new Date().getTime();
            alert('Profile picture updated successfully!');
        } else {
            alert(`Upload failed: ${data.message || 'Please try again.'}`);
            profileImg.src = originalSrc;
        }
    } catch (e) {
        console.error('Error uploading image:', e);
        alert('Connection error. Could not upload image.');
        profileImg.src = originalSrc;
    } finally {
        profileImg.style.opacity = '1';
    }
}

async function loadAvailableRooms(studentId) {
    const tbody = document.getElementById('availableRoomsTable');
    const myRoomHint = document.getElementById('studentRoomHint');
    const cardHeader = document.querySelector('#availableRoomsCard .card-header h5');
    const requestAnyRoomBtn = document.getElementById('requestAnyRoomBtn');
    
    if (!tbody) return;

    try {
        // Check if student has a pending request
        const pendingRes = await apiFetch(`/requests/student/${studentId}/has-pending`);
        const hasPending = pendingRes.ok ? await pendingRes.json() : false;
        
        if (hasPending && requestAnyRoomBtn) {
            requestAnyRoomBtn.disabled = true;
            requestAnyRoomBtn.title = "You already have a pending request";
        }

        console.log('Fetching available rooms for studentId:', studentId);
        const res = await apiFetch('/rooms/vacant');
        
        if (res.ok) {
            const available = await res.json();
            console.log('Available rooms received:', available);
            
            tbody.innerHTML = '';
            
            // Update available count in header
            if (cardHeader) {
                cardHeader.innerHTML = `Available Rooms <span class="badge bg-primary ms-2">${available.length}</span>`;
            }

            if (!available || available.length === 0) {
                tbody.innerHTML = '<tr><td colspan="4" class="text-center py-4 text-muted">No rooms available. You will be added to the waiting list if you request.</td></tr>';
                if (myRoomHint) {
                    myRoomHint.innerHTML = '<span class="text-danger fw-bold">No rooms available. Please contact admin.</span>';
                }
            } else {
                available.forEach(room => {
                    const tr = document.createElement('tr');
                    // Standardize status for display (e.g. VACANT -> Available)
                    const displayStatus = (room.status || '').toUpperCase() === 'VACANT' ? 'Available' : escapeHtml(room.status);
                    
                    const disabledAttr = hasPending ? 'disabled' : '';
                    const titleAttr = hasPending ? 'title="You already have a pending request"' : '';

                    tr.innerHTML = `
                        <td class="ps-3 fw-bold">${escapeHtml(room.roomNumber)}</td>
                        <td>${escapeHtml(room.hostelBlock)}</td>
                        <td>${escapeHtml(room.type)}</td>
                        <td><span class="badge bg-success-subtle text-success p-2 rounded-3 px-3">${displayStatus}</span></td>
                        <td class="text-end pe-3">
                            <button class="btn btn-sm btn-primary rounded-pill px-3" ${disabledAttr} ${titleAttr} onclick="submitRoomRequest(${studentId}, ${room.id})">Request</button>
                        </td>
                    `;
                    tbody.appendChild(tr);
                });
            }
        } else {
            console.error('Failed to fetch available rooms. Status:', res.status);
            tbody.innerHTML = '<tr><td colspan="4" class="text-center py-4 text-danger">Error loading rooms from server.</td></tr>';
        }
    } catch (e) {
        console.error('Error in loadAvailableRooms:', e);
        tbody.innerHTML = '<tr><td colspan="4" class="text-center py-4 text-danger">Connection error. Could not reach server.</td></tr>';
    }
}

async function submitRoomRequest(studentId, roomId) {
    if (!studentId) {
        alert('Student ID not found. Please refresh the page.');
        return;
    }
    
    try {
        const res = await apiFetch('/requests/submit', {
            method: 'POST',
            body: JSON.stringify({ studentId, roomId })
        });
        
        const data = await res.json();
        if (res.ok) {
            alert(data.message || 'Request submitted successfully!');
            loadStudentDashboard();
        } else {
            alert(data.message || 'Failed to submit request.');
        }
    } catch (e) {
        console.error('Error submitting request:', e);
        alert('Could not connect to the server. Please try again later.');
    }
}

async function loadStudentRequests(studentId) {
    const tbody = document.getElementById('myRequestsTable');
    if (!tbody) return;

    try {
        const res = await apiFetch(`/requests/student/${studentId}`);
        if (res.ok) {
            const requests = await res.json();
            tbody.innerHTML = '';
            if (requests.length === 0) {
                tbody.innerHTML = '<tr><td colspan="3" class="text-center py-3 text-muted">No requests yet.</td></tr>';
                return;
            }
            requests.forEach(req => {
                const tr = document.createElement('tr');
                const badgeClass = req.status === 'APPROVED' ? 'bg-success' : (req.status === 'REJECTED' ? 'bg-danger' : 'bg-warning');
                tr.innerHTML = `
                    <td class="ps-3">${req.room ? `Room ${req.room.roomNumber}` : 'General Request'}</td>
                    <td><span class="badge ${badgeClass} rounded-pill px-3">${req.status}</span></td>
                    <td class="small text-muted pe-3">${new Date(req.createdAt).toLocaleDateString()}</td>
                `;
                tbody.appendChild(tr);
            });
        }
    } catch (e) {
        console.error('Error loading student requests:', e);
    }
}

/**
 * Handle Login
 */
async function handleLogin(e, roleType = 'student') {
    e.preventDefault();
    
    // Extract values based on which form was submitted
    const email = roleType === 'admin' 
        ? document.getElementById('adminEmail').value 
        : document.getElementById('studentEmail').value;
    const password = roleType === 'admin'
        ? document.getElementById('adminPassword').value
        : document.getElementById('studentPassword').value;

    console.log(`Logging in as ${roleType}:`, email);
    
    const btn = e.target.querySelector('button');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i> Signing in...';
    btn.disabled = true;

    try {
        const response = await apiFetch('/users/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });

        if (response.ok) {
            const data = await response.json();
            
            // Handle possible naming variations (isAdmin vs admin)
            if (data.isAdmin === undefined && data.admin !== undefined) {
                data.isAdmin = data.admin;
            }
            
            localStorage.setItem('token', data.token);
            localStorage.setItem('userInfo', JSON.stringify(data));
            
            const target = data.isAdmin ? 'dashboard.html' : 'student-dashboard.html';
            window.location.href = target;
        } else {
            const errorData = await response.json().catch(() => ({}));
            if (response.status === 403) {
                alert(errorData.message || 'Your account is not approved yet.');
            } else {
                alert(errorData.message || 'Invalid email or password');
            }
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    } catch (error) {
        console.error('Login error details:', error);
        alert(`Could not connect to the server at ${API_BASE_URL}.\n\n${error.message}\n\nStart the API from the project folder: npm run dev-mysql`);
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

/**
 * Handle Register
 */
async function handleRegister(e) {
    e.preventDefault();
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const contact = document.getElementById('contact').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (password !== confirmPassword) {
        alert('Passwords do not match');
        return;
    }

    const btn = e.target.querySelector('button');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i> Creating account...';
    btn.disabled = true;

    try {
        const response = await apiFetch('/users/register', {
            method: 'POST',
            body: JSON.stringify({ name, email, contact, password })
        });

        if (response.ok) {
            const data = await response.json().catch(() => ({}));
            alert(
                data.message ||
                    'Account created successfully! You can now log in.'
            );
            window.location.href = 'index.html';
        } else {
            const errorData = await response.json();
            alert(errorData.message || 'Registration failed');
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    } catch (error) {
        console.error('Register error:', error);
        alert('Could not connect to the server.');
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

/**
 * Handle Add Student
 */
async function handleAddStudent(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const studentData = {
        name: formData.get('name'),
        contact: formData.get('contact'),
        fatherContact: formData.get('fatherContact'),
        category: formData.get('category'),
        blockNo: formData.get('blockNo'),
        roomNo: formData.get('roomNo'),
        city: formData.get('city'),
        address: formData.get('address'),
        status: 'Active',
        image: 'default-student.png' // Default image for now
    };

    console.log('Adding student:', studentData);

    // Get the submit button, whether it's inside or outside the form
    let btn = e.target.querySelector('button[type="submit"]');
    if (!btn) {
        btn = document.querySelector(`button[type="submit"][form="${e.target.id}"]`);
    }
    
    const originalText = btn ? btn.innerHTML : 'Save Student';
    if (btn) {
        btn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i> Saving...';
        btn.disabled = true;
    }

    try {
        const response = await apiFetch('/students', {
            method: 'POST',
            body: JSON.stringify(studentData)
        });

        if (response.ok) {
            alert('Student added successfully!');
            e.target.reset();
            const modalElement = document.getElementById('addStudentModal');
            if (modalElement && typeof bootstrap !== 'undefined') {
                const modal = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);
                modal.hide();
            }
            
            // Refresh data if on relevant pages
            if (document.getElementById('studentsList')) loadFullStudentsList();
            if (document.getElementById('recentStudentsTable')) loadRecentStudents();
            if (document.getElementById('totalStudents')) loadDashboardStats();
            
            if (btn) {
                btn.innerHTML = originalText;
                btn.disabled = false;
            }
        } else {
            // If response is not OK, try to get error message or show status
            const contentType = response.headers.get("content-type");
            let errorMsg = `Server returned status ${response.status}: ${response.statusText}`;
            
            if (contentType && contentType.includes("application/json")) {
                const errorData = await response.json();
                errorMsg = errorData.message || errorMsg;
            }

            if (response.status === 401 && errorMsg.includes('admin')) {
                alert('ACCESS DENIED: You are logged in as a regular user. Please logout and login with the Admin credentials provided on the login page to add students.');
            } else {
                alert(`Failed to add student: ${errorMsg}`);
            }
            
            if (btn) {
                btn.innerHTML = originalText;
                btn.disabled = false;
            }
        }
    } catch (error) {
        console.error('Error adding student:', error);
        alert(`Error connecting to server: ${error.message}`);
        if (btn) {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    }
}

/**
 * Load Recent Registered Users (Students)
 */
async function loadRecentRegisteredUsers() {
    const tableBody = document.getElementById('recentRegisteredUsersTable');
    if (!tableBody) return;

    try {
        const response = await apiFetch('/users/admin/students');
        if (response.ok) {
            let users = await response.json();
            // Show only the latest 5
            users = users.slice(-5).reverse();
            
            tableBody.innerHTML = '';
            if (users.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-muted">No recently registered students found.</td></tr>';
                return;
            }

            users.forEach(user => {
                const tr = document.createElement('tr');
                const regDate = user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A';
                
                // Handle Jackson boolean naming (isApproved vs approved)
                const isApproved = user.isApproved || user.approved;
                
                const statusBadge = isApproved ? 
                    '<span class="badge bg-success-subtle text-success px-3 rounded-pill">Approved</span>' : 
                    '<span class="badge bg-warning-subtle text-warning px-3 rounded-pill">Pending</span>';
                
                tr.innerHTML = `
                    <td class="ps-3 fw-bold">${escapeHtml(user.name)}</td>
                    <td>${escapeHtml(user.email)}</td>
                    <td>${escapeHtml(user.contact || 'N/A')}</td>
                    <td>${regDate}</td>
                    <td class="text-end pe-3">${statusBadge}</td>
                `;
                tableBody.appendChild(tr);
            });
        }
    } catch (error) {
        console.error('Error loading recent registered users:', error);
        tableBody.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-danger">Error loading registrations.</td></tr>';
    }
}

/**
 * Load Dashboard Stats
 */
async function loadDashboardStats() {
    try {
        const [studentsRes, roomsRes] = await Promise.all([
            apiFetch('/students'),
            apiFetch('/rooms')
        ]);

        if (studentsRes.ok) {
            const students = await studentsRes.json();
            document.getElementById('totalStudents').textContent = students.length;
        }

        if (roomsRes.ok) {
            const rooms = await roomsRes.json();
            const totalRooms = rooms.length;
            const occupiedRooms = rooms.filter(r => r.status === 'Full').length;
            const vacantRooms = rooms.filter(r => r.status === 'VACANT').length;

            document.getElementById('occupiedRooms').textContent = occupiedRooms;
            document.getElementById('vacantRooms').textContent = vacantRooms;
        }

        // Waiting List Count
        const waitingRes = await apiFetch('/requests/waiting-list');
        if (waitingRes.ok) {
            const waiting = await waitingRes.json();
            document.getElementById('waitingCount').textContent = waiting.length;
        }

        // Active Projects Count
        const projectsRes = await apiFetch('/projects');
        if (projectsRes.ok) {
            const projects = await projectsRes.json();
            const active = projects.filter(p => p.status === 'Active').length;
            document.getElementById('activeProjects').textContent = active;
        }

    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

/**
 * Load Recent Students
 */
async function loadRecentStudents() {
    const tableBody = document.getElementById('recentStudentsTable');
    if (!tableBody) return;

    try {
        const response = await apiFetch('/students');
        if (response.ok) {
            let students = await response.json();
            students = students.slice(-5).reverse();

            tableBody.innerHTML = '';
            if (students.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="4" class="text-center py-4 text-muted">No recent students found.</td></tr>';
                return;
            }

            students.forEach(student => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>
                        <div class="d-flex align-items-center">
                            <div class="bg-primary bg-opacity-10 text-primary p-2 rounded-circle me-3">
                                <i class="fas fa-user small"></i>
                            </div>
                            <div>
                                <div class="fw-bold text-dark">${student.name}</div>
                                <small class="text-muted">ID: ${student.id}</small>
                            </div>
                        </div>
                    </td>
                    <td>
                        <span class="badge bg-light text-dark border p-2 rounded-3">
                            <i class="fas fa-door-closed me-1 text-primary"></i> ${student.roomNo || 'Not Allotted'} ${student.blockNo ? `(${student.blockNo})` : ''}
                        </span>
                    </td>
                    <td>
                        <span class="badge bg-success-subtle text-success p-2 rounded-3">
                            <i class="fas fa-circle small me-1"></i> ${student.status}
                        </span>
                    </td>
                    <td class="text-end">
                        <button class="btn btn-sm btn-light border rounded-pill px-3">
                            <i class="fas fa-eye me-1"></i> Details
                        </button>
                    </td>
                `;
                tableBody.appendChild(row);
            });
        } else {
            const errorText = await response.text().catch(() => 'Unknown error');
            tableBody.innerHTML = `<tr><td colspan="4" class="text-center py-4 text-danger">Server Error (${response.status})</td></tr>`;
            console.error('Fetch error:', response.status, errorText);
        }
    } catch (error) {
        console.error('Error loading recent students:', error);
        tableBody.innerHTML = `<tr><td colspan="4" class="text-center py-4 text-danger">Connection Error: ${error.message}</td></tr>`;
    }
}

/**
 * Load Full Students List
 */
async function loadFullStudentsList() {
    const listBody = document.getElementById('studentsList');
    if (!listBody) return;

    // Remove existing event listener if any to avoid double triggers
    const newBody = listBody.cloneNode(false);
    listBody.parentNode.replaceChild(newBody, listBody);
    
    newBody.addEventListener('click', (e) => {
        const item = e.target.closest('[data-action]');
        if (!item) return;
        
        e.preventDefault();
        const action = item.dataset.action;
        const id = item.dataset.id;
        
        console.log('Action triggered:', action, 'ID:', id);
        
        if (action === 'view') window.viewStudent(id);
        else if (action === 'edit') window.editStudent(id);
        else if (action === 'delete') window.deleteStudent(id);
    });

    try {
        const response = await apiFetch('/students');
        if (!response.ok) {
            let msg = `Could not load students (HTTP ${response.status}).`;
            try {
                const err = await response.json();
                if (err.message) msg = err.message;
            } catch {
                /* ignore */
            }
            if (response.status === 401) {
                msg = 'Session expired or not logged in. Please sign in again (use admin account for this page).';
            }
            newBody.innerHTML = `<tr><td colspan="5" class="text-center py-5 text-danger">${msg}</td></tr>`;
            return;
        }

        const students = await response.json();

        newBody.innerHTML = '';
        if (students.length === 0) {
            newBody.innerHTML = '<tr><td colspan="5" class="text-center py-5">No students found. Add your first student!</td></tr>';
            return;
        }

        students.forEach((student) => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td class="ps-4">
                        <div class="d-flex align-items-center">
                            <div class="bg-primary bg-opacity-10 text-primary p-3 rounded-3 me-3">
                                <i class="fas fa-user-graduate"></i>
                            </div>
                            <div>
                                <div class="fw-bold text-dark">${escapeHtml(student.name)}</div>
                                <small class="text-muted">ID: ${student.id} ${student.blockNo ? `| ${escapeHtml(student.blockNo)}` : ''}</small>
                            </div>
                        </div>
                    </td>
                    <td>
                        <span class="fw-bold">${student.roomNo ? `Room ${escapeHtml(student.roomNo)}` : 'Not Allotted'}</span>
                    </td>
                    <td>
                        <div class="small"><i class="fas fa-phone-alt me-2 text-muted"></i> ${escapeHtml(student.contact || 'N/A')}</div>
                    </td>
                    <td>
                        <span class="badge ${student.status === 'Active' ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'} p-2 rounded-3 px-3">
                            ${escapeHtml(student.status)}
                        </span>
                    </td>
                    <td class="pe-4 text-end">
                        <div class="dropdown">
                            <button class="btn btn-light btn-sm border rounded-pill px-3 dropdown-toggle shadow-none" data-bs-toggle="dropdown" type="button">
                                Manage
                            </button>
                            <ul class="dropdown-menu border-0 shadow-lg rounded-3">
                                <li><a class="dropdown-item py-2" href="#" data-action="view" data-id="${student.id}"><i class="fas fa-eye me-2 text-primary"></i> View Details</a></li>
                                <li><a class="dropdown-item py-2" href="#" data-action="edit" data-id="${student.id}"><i class="fas fa-edit me-2 text-warning"></i> Edit Student</a></li>
                                <li><hr class="dropdown-divider"></li>
                                <li><a class="dropdown-item py-2 text-danger" href="#" data-action="delete" data-id="${student.id}"><i class="fas fa-trash-alt me-2"></i> Delete</a></li>
                            </ul>
                        </div>
                    </td>
                `;
                newBody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading students list:', error);
        newBody.innerHTML = '<tr><td colspan="5" class="text-center py-5 text-danger">Error loading data</td></tr>';
    }
}

/**
 * Load Attendance Table
 */
async function loadAttendanceTable() {
    const attendanceBody = document.getElementById('attendanceTableBody');
    if (!attendanceBody) return;

    const dateInput = document.getElementById('attendanceDate');
    let date = dateInput?.value?.trim() || '';
    if (!date) {
        date = formatLocalDateInput();
        if (dateInput) dateInput.value = date;
    }
    
    // Update display date
    const dateDisplay = document.getElementById('currentDateDisplay');
    if (dateDisplay) {
        dateDisplay.textContent = new Date(date).toLocaleDateString();
    }

    try {
        // Fetch both students and existing attendance for this date
        const [studentsRes, attendanceRes] = await Promise.all([
            apiFetch('/students'),
            apiFetch(`/attendance/${encodeURIComponent(date)}`)
        ]);

        if (studentsRes.ok) {
            let students = await studentsRes.json();
            
            // Apply Block and Room filters
            const blockFilter = document.getElementById('blockFilter')?.value || 'All Blocks';
            const roomFilter = document.getElementById('roomFilter')?.value || 'All Rooms';
            
            const selectedBlock = blockFilter.replace('Block ', '');
            const selectedRoom = roomFilter.replace('Room ', '');
            
            // Filter to only show students who have an allotted room and match filters
            students = students.filter(s => {
                const hasRoom = s.roomNo && s.roomNo !== 'Pending';
                if (!hasRoom) return false;
                
                const matchesBlock = blockFilter === 'All Blocks' || s.blockNo === selectedBlock;
                const matchesRoom = roomFilter === 'All Rooms' || s.roomNo === selectedRoom;
                
                return matchesBlock && matchesRoom;
            });
            
            let existingAttendance = [];
            
            if (attendanceRes.ok) {
                existingAttendance = await attendanceRes.json();
            }
            
            attendanceBody.innerHTML = '';
            if (students.length === 0) {
                attendanceBody.innerHTML = '<tr><td colspan="4" class="text-center py-4">No students found</td></tr>';
                return;
            }

            students.forEach(student => {
                // Find if there's a record for this student
                const record = existingAttendance.find(a => (a.student && a.student.id == student.id));
                const isAbsent = record && (record.status === 'Absent' || record.status === 'absent');
                const isLeave = record && (record.status === 'Leave' || record.status === 'leave');

                const row = document.createElement('tr');
                row.innerHTML = `
                    <td class="ps-4">
                        <div class="fw-bold text-dark">${student.name}</div>
                        <small class="text-muted">Student ID: ${student.id}</small>
                    </td>
                    <td>
                        <span class="badge bg-light text-dark border p-2 px-3 rounded-pill">${student.roomNo} (${student.blockNo})</span>
                    </td>
                    <td class="text-center">
                        <div class="btn-group btn-group-sm rounded-pill border overflow-hidden">
                            <input type="radio" class="btn-check" name="status-${student.id}" id="p-${student.id}" ${(!isAbsent && !isLeave) ? 'checked' : ''}>
                            <label class="btn btn-outline-success border-0 px-3" for="p-${student.id}">Present</label>
                            
                            <input type="radio" class="btn-check" name="status-${student.id}" id="a-${student.id}" ${isAbsent ? 'checked' : ''}>
                            <label class="btn btn-outline-danger border-0 px-3" for="a-${student.id}">Absent</label>
                            
                            <input type="radio" class="btn-check" name="status-${student.id}" id="l-${student.id}" ${isLeave ? 'checked' : ''}>
                            <label class="btn btn-outline-warning border-0 px-3" for="l-${student.id}">Leave</label>
                        </div>
                    </td>
                    <td class="pe-4 text-end">
                        <input type="text" class="form-control form-control-sm rounded-pill d-inline-block w-auto" 
                               id="rem-${student.id}" placeholder="Remarks" value="${record?.remarks || ''}">
                    </td>
                `;
                attendanceBody.appendChild(row);
            });
        }
    } catch (error) {
        console.error('Error loading attendance table:', error);
        attendanceBody.innerHTML = '<tr><td colspan="4" class="text-center py-4 text-danger">Error loading data</td></tr>';
    }
}

async function handleSaveAttendance(e) {
    e.preventDefault();
    const btn = e.currentTarget;
    const originalText = btn.innerHTML;
    
    const date = document.getElementById('attendanceDate').value;
    if (!date) {
        alert('Please select a date');
        return;
    }

    const attendanceData = [];
    const rows = document.querySelectorAll('#attendanceTableBody tr');
    
    rows.forEach(row => {
        const studentIdMatch = row.querySelector('small').textContent.match(/Student ID: (\d+)/);
        if (studentIdMatch) {
            const studentId = studentIdMatch[1];
            const isPresent = document.getElementById(`p-${studentId}`).checked;
            const isAbsent = document.getElementById(`a-${studentId}`).checked;
            const isLeave = document.getElementById(`l-${studentId}`).checked;
            const remarks = document.getElementById(`rem-${studentId}`).value;
            
            let status = 'Present';
            if (isAbsent) status = 'Absent';
            else if (isLeave) status = 'Leave';

            attendanceData.push({
                studentId,
                status,
                remarks
            });
        }
    });

    if (attendanceData.length === 0) {
        alert('No attendance data to save');
        return;
    }

    btn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i> Saving...';
    btn.disabled = true;

    try {
        const response = await apiFetch('/attendance', {
            method: 'POST',
            body: JSON.stringify({ date, attendanceData })
        });

        if (response.ok) {
            alert('Attendance saved successfully!');
            // Reload the table to confirm persistence
            loadAttendanceTable();
        } else {
            const errorData = await response.json();
            alert(`Failed to save attendance: ${errorData.message || 'Unknown error'}`);
        }
    } catch (error) {
        console.error('Error saving attendance:', error);
        alert(`Connection Error: ${error.message}`);
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

/**
 * Handle Export Report (CSV)
 */
async function handleExportReport(e) {
    e.preventDefault();
    console.log('Exporting report...');
    
    try {
        const response = await apiFetch('/students');
        if (response.ok) {
            const students = await response.json();
            let csvContent = "data:text/csv;charset=utf-8,ID,Name,Contact,Room,Block,Status\n";
            
            students.forEach(s => {
                csvContent += `${s.id},${s.name},${s.contact},${s.roomNo},${s.blockNo},${s.status}\n`;
            });

            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", `hostel_students_${new Date().toLocaleDateString()}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    } catch (error) {
        console.error('Export error:', error);
    }
}

/**
 * Handle Generate Report
 */
function handleGenerateReport(e) {
    e.preventDefault();
    const btn = e.currentTarget;
    const originalText = btn.innerHTML;
    
    btn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i> Generating...';
    btn.disabled = true;

    setTimeout(() => {
        alert('Report generated successfully! Check your downloads.');
        handleExportReport(e);
        btn.innerHTML = originalText;
        btn.disabled = false;
    }, 2000);
}

/**
 * Load Rooms List
 */
async function loadRoomsList() {
    const listBody = document.getElementById('roomsList');
    if (!listBody) return;

    try {
        const response = await apiFetch('/rooms');
        if (response.ok) {
            const rooms = await response.json();
            listBody.innerHTML = '';

            if (rooms.length === 0) {
                listBody.innerHTML = '<tr><td colspan="7" class="text-center py-5">No rooms found. Add your first room!</td></tr>';
                return;
            }

            rooms.forEach((room) => {
                const occ = Number(room.occupancyCount) || 0;
                const cap = Number(room.capacity) || 0;
                const hasVacancy = occ < cap;
                
                // Fix status color logic: Available/VACANT = Green, Occupied/Full = Red
                const statusStr = (room.status || '').trim().toUpperCase();
                let badgeClass = 'bg-danger-subtle text-danger'; // Default to red for safety
                
                if (statusStr === 'VACANT' || statusStr === 'AVAILABLE') {
                    badgeClass = 'bg-success-subtle text-success';
                }

                const row = document.createElement('tr');
                if (hasVacancy) {
                    row.classList.add('vacant-room-row');
                    row.style.cursor = 'pointer';
                    row.title = 'Click to allot this room to a student';
                    row.dataset.roomId = String(room.id);
                    row.dataset.roomNumber = String(room.roomNumber ?? '');
                    row.dataset.hostelBlock = String(room.hostelBlock ?? '');
                }
                row.innerHTML = `
                    <td class="ps-4 fw-bold text-primary">${escapeHtml(room.roomNumber)}</td>
                    <td>${escapeHtml(room.hostelBlock)}</td>
                    <td>${escapeHtml(room.type)}</td>
                    <td>${room.capacity} Students</td>
                    <td>${room.occupancyCount} / ${room.capacity}</td>
                    <td>
                        <span class="badge ${badgeClass} p-2 rounded-3 px-3">
                            ${escapeHtml(room.status || 'N/A')}
                        </span>
                    </td>
                    <td class="pe-4 text-end">
                        ${hasVacancy
        ? '<button type="button" class="btn btn-sm btn-primary rounded-pill px-3 js-open-allot-modal"><i class="fas fa-user-plus me-1"></i> Allot</button>'
        : '<span class="text-muted small me-2">Full</span>'}
                        <button type="button" class="btn btn-sm btn-light border rounded-pill px-3 js-delete-room" data-room-id="${room.id}" title="Delete room">
                            <i class="fas fa-trash-alt text-danger"></i>
                        </button>
                    </td>
                `;
                listBody.appendChild(row);
            });
        }
    } catch (error) {
        console.error('Error loading rooms:', error);
        listBody.innerHTML = '<tr><td colspan="7" class="text-center py-5 text-danger">Error loading rooms</td></tr>';
    }
}

async function openAllotRoomModal(roomId, roomNumber, hostelBlock) {
    const hidden = document.getElementById('allotFromRoomRoomId');
    const label = document.getElementById('allotFromRoomLabel');
    const sel = document.getElementById('allotFromRoomStudentSelect');
    const modalEl = document.getElementById('allotFromRoomModal');
    if (!hidden || !label || !sel || !modalEl) {
        alert('Allotment modal is missing from this page. Open Vacant Rooms from the main app (rooms.html on port 4041).');
        return;
    }
    if (typeof bootstrap === 'undefined' || !bootstrap.Modal) {
        alert('Bootstrap JS did not load. Check your network or the Bootstrap script on this page.');
        return;
    }

    hidden.value = String(roomId);
    label.textContent = `${roomNumber} (${hostelBlock})`;
    sel.innerHTML = '<option value="">Loading students...</option>';
    sel.disabled = true;

    try {
        const res = await apiFetch('/students');
        sel.innerHTML = '<option value="">Choose student...</option>';
        if (res.ok) {
            const students = await res.json();
            students.forEach((s) => {
                sel.innerHTML += `<option value="${s.id}">${s.name}</option>`;
            });
        }
    } catch (err) {
        console.error(err);
        sel.innerHTML = '<option value="">Could not load students</option>';
    }
    sel.disabled = false;

    try {
        const modal = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
        modal.show();
    } catch (err) {
        console.error(err);
        alert('Could not open the allotment dialog: ' + (err.message || String(err)));
    }
}

async function handleAllotFromRoomSubmit(e) {
    e.preventDefault();
    const roomId = document.getElementById('allotFromRoomRoomId')?.value;
    const studentId = document.getElementById('allotFromRoomStudentSelect')?.value;
    if (!roomId || !studentId) {
        alert('Please select a student.');
        return;
    }
    const ok = await submitAllotment(studentId, roomId);
    if (ok) {
        const modalEl = document.getElementById('allotFromRoomModal');
        if (modalEl) {
            const m = bootstrap.Modal.getInstance(modalEl);
            if (m) m.hide();
        }
        loadRoomsList();
    }
}

/** POST /allotments; returns true on success */
async function submitAllotment(studentId, roomId) {
    try {
        const response = await apiFetch('/allotments', {
            method: 'POST',
            body: JSON.stringify({
                studentId: Number(studentId),
                roomId: Number(roomId),
            }),
        });
        if (response.ok) {
            alert('Room allotted successfully. You can review it on the Allotment page.');
            if (document.getElementById('recentRegisteredUsersTable')) {
                loadRecentRegisteredUsers();
            }
            return true;
        }
        const err = await response.json().catch(() => ({}));
        alert(err.message || 'Could not allot room. You may need to be logged in as admin.');
        return false;
    } catch (error) {
        console.error('Allotment error:', error);
        alert('Could not connect to the server.');
        return false;
    }
}

async function deleteRoom(id) {
    if (!confirm('Delete this room?')) return;
    try {
        const response = await apiFetch(`/rooms/${id}`, { method: 'DELETE' });
        if (response.ok) {
            loadRoomsList();
        } else {
            alert('Could not delete room.');
        }
    } catch (error) {
        console.error(error);
        alert('Connection error.');
    }
}

/**
 * Handle Add Room
 */
async function handleAddRoom(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const roomData = {
        roomNumber: formData.get('roomNumber'),
        hostelBlock: formData.get('hostelBlock'),
        type: formData.get('type'),
        capacity: formData.get('capacity'),
        floor: formData.get('floor')
    };

    const btn = e.target.querySelector('button[type="submit"]');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i> Saving...';
    btn.disabled = true;

    try {
        const response = await apiFetch('/rooms', {
            method: 'POST',
            body: JSON.stringify(roomData)
        });

        if (response.ok) {
            alert('Room added successfully!');
            e.target.reset();
            bootstrap.Modal.getInstance(document.getElementById('addRoomModal')).hide();
            loadRoomsList();
        } else {
            const errorData = await response.json();
            alert(`Failed to add room: ${errorData.message}`);
        }
    } catch (error) {
        console.error('Error adding room:', error);
        alert('Connection error');
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

/**
 * Load Allotments List
 */
async function loadAllotmentsList() {
    const listBody = document.getElementById('allotmentList');
    if (!listBody) return;

    try {
        const response = await apiFetch('/allotments');
        if (!response.ok) {
            listBody.innerHTML = '<tr><td colspan="6" class="text-center py-5 text-danger">Could not load allotments.</td></tr>';
            return;
        }
        const rows = await response.json();
        listBody.innerHTML = '';
        if (!rows.length) {
            listBody.innerHTML = '<tr><td colspan="6" class="text-center py-5 text-muted">No active allotments yet. Allot a vacant room from Vacant Rooms.</td></tr>';
            return;
        }
        rows.forEach((a) => {
            const student = a.Student || a.student;
            const room = a.Room || a.room;
            const name = student?.name ?? '—';
            const roomNo = room?.roomNumber ?? '—';
            const block = room?.hostelBlock ?? '—';
            const dateStr = a.allotmentDate
                ? new Date(a.allotmentDate).toLocaleDateString()
                : '—';
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="ps-4 fw-bold">${name}</td>
                <td>${roomNo}</td>
                <td>${block}</td>
                <td>${dateStr}</td>
                <td><span class="badge bg-success-subtle text-success px-3 py-2 rounded-pill">${a.status || 'Active'}</span></td>
                <td class="pe-4 text-end">
                    <button type="button" class="btn btn-sm btn-outline-danger rounded-pill px-3" onclick="vacateAllotment(${a.id})">Vacate</button>
                </td>
            `;
            listBody.appendChild(tr);
        });
    } catch (error) {
        console.error('Error loading allotments:', error);
        listBody.innerHTML = '<tr><td colspan="6" class="text-center py-5 text-danger">Error loading allotments.</td></tr>';
    }
}

/**
 * Load Allotment Modal Data
 */
async function loadAllotmentModalData() {
    const studentSelect = document.getElementById('studentSelect');
    const roomSelect = document.getElementById('roomSelect');
    if (!studentSelect || !roomSelect) return;

    try {
        const [studentsRes, roomsRes] = await Promise.all([
            apiFetch('/students'),
            apiFetch('/rooms'),
        ]);

        if (studentsRes.ok) {
            const students = await studentsRes.json();
            studentSelect.innerHTML = '<option value="">Choose student...</option>';
            students.forEach((s) => {
                studentSelect.innerHTML += `<option value="${s.id}">${s.name} (${s.blockNo})</option>`;
            });
        }

        if (roomsRes.ok) {
            const rooms = await roomsRes.json();
            roomSelect.innerHTML = '<option value="">Choose room...</option>';
            rooms
                .filter((r) => Number(r.occupancyCount) < Number(r.capacity))
                .forEach((r) => {
                    roomSelect.innerHTML += `<option value="${r.id}">${r.roomNumber} (${r.hostelBlock}) — ${r.occupancyCount}/${r.capacity}</option>`;
                });
        }
    } catch (error) {
        console.error('Error loading allotment data:', error);
    }
}

/**
 * Handle Add Allotment
 */
async function handleAddAllotment(e) {
    e.preventDefault();
    const studentId = document.getElementById('studentSelect')?.value;
    const roomId = document.getElementById('roomSelect')?.value;
    if (!studentId || !roomId) {
        alert('Please select both student and room.');
        return;
    }
    const btn = e.target.querySelector('button[type="submit"]');
    const orig = btn?.innerHTML;
    if (btn) {
        btn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i> Saving...';
        btn.disabled = true;
    }
    const ok = await submitAllotment(studentId, roomId);
    if (btn) {
        btn.innerHTML = orig;
        btn.disabled = false;
    }
    if (ok) {
        const modalEl = document.getElementById('addAllotmentModal');
        if (modalEl) {
            const m = bootstrap.Modal.getInstance(modalEl);
            if (m) m.hide();
        }
        loadAllotmentsList();
        loadAllotmentModalData();
    }
}

async function vacateAllotment(id) {
    if (!confirm('Vacate this allotment? The student will be unassigned from the room.')) return;
    try {
        const res = await apiFetch(`/allotments/${id}/vacate`, { method: 'POST' });
        if (res.ok) {
            loadAllotmentsList();
            return;
        }
        const err = await res.json().catch(() => ({}));
        alert(err.message || 'Could not vacate.');
    } catch (e) {
        console.error(e);
        alert('Connection error.');
    }
}

/**
 * Load Projects List
 */
async function loadProjectsList() {
    const listBody = document.getElementById('projectsList');
    if (!listBody) return;

    try {
        const response = await apiFetch('/projects');
        if (response.ok) {
            const projects = await response.json();
            listBody.innerHTML = '';

            if (projects.length === 0) {
                listBody.innerHTML = '<tr><td colspan="5" class="text-center py-5">No projects found. Add your first project!</td></tr>';
                return;
            }

            projects.forEach((project) => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td class="ps-4 fw-bold">${escapeHtml(project.name)}</td>
                    <td>${escapeHtml(project.description || '—')}</td>
                    <td><span class="badge ${project.status === 'Active' ? 'bg-primary-subtle text-primary' : 'bg-success-subtle text-success'} p-2 rounded-3 px-3">${escapeHtml(project.status)}</span></td>
                    <td>${project.createdAt ? new Date(project.createdAt).toLocaleDateString() : '—'}</td>
                    <td class="pe-4 text-end">
                        <button type="button" class="btn btn-sm btn-light border rounded-pill px-3" onclick="deleteProject(${project.id})">
                            <i class="fas fa-trash-alt text-danger"></i>
                        </button>
                    </td>
                `;
                listBody.appendChild(tr);
            });
        }
    } catch (error) {
        console.error('Error loading projects:', error);
        listBody.innerHTML = '<tr><td colspan="5" class="text-center py-5 text-danger">Error loading projects.</td></tr>';
    }
}

/**
 * Handle Add Project
 */
async function handleAddProject(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const projectData = {
        name: formData.get('name'),
        description: formData.get('description'),
        status: 'Active'
    };

    const btn = e.target.querySelector('button[type="submit"]');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i> Saving...';
    btn.disabled = true;

    try {
        const response = await apiFetch('/projects', {
            method: 'POST',
            body: JSON.stringify(projectData)
        });

        if (response.ok) {
            alert('Project added successfully!');
            e.target.reset();
            bootstrap.Modal.getInstance(document.getElementById('addProjectModal')).hide();
            loadProjectsList();
        } else {
            const errorData = await response.json();
            alert(`Failed to add project: ${errorData.message}`);
        }
    } catch (error) {
        console.error('Error adding project:', error);
        alert('Connection error');
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

async function deleteProject(id) {
    if (!confirm('Delete this project?')) return;
    try {
        const response = await apiFetch(`/projects/${id}`, { method: 'DELETE' });
        if (response.ok) {
            loadProjectsList();
        } else {
            alert('Could not delete project.');
        }
    } catch (error) {
        console.error(error);
        alert('Connection error.');
    }
}
