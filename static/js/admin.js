// Admin Panel JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is authenticated and is admin
    fetch('/api/user/info')
        .then(response => {
            if (!response.ok) {
                throw new Error('Not authenticated');
            }
            return response.json();
        })
        .then(data => {
            if (!data.isAdmin) {
                window.location.href = '/login?error=Access denied. Admin privileges required.';
            }
        })
        .catch(error => {
            console.error('Error checking authentication:', error);
            window.location.href = '/login?error=Please login to access the admin panel';
        });

    // Add CSS for action buttons and charts
    const style = document.createElement('style');
    style.textContent = `
        .action-buttons {
            text-align: center;
            white-space: nowrap;
        }
        .action-buttons .btn {
            margin: 0 2px;
        }
        .chart-container {
            position: relative;
            height: 450px;
            width: 100%;
            margin-bottom: 30px;
            background: #fff;
            padding: 15px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            overflow: hidden;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
        }
        .chart-container canvas {
            display: block;
            max-width: 100%;
            /* Removed height and width CSS to prevent stretching */
        }
        .chart-title {
            font-size: 1.2em;
            font-weight: 600;
            margin-bottom: 15px;
            color: #333;
            text-align: center;
        }
        .reports-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            padding: 20px;
        }
    `;
    document.head.appendChild(style);

    // Tab switching functionality
    const tabLinks = document.querySelectorAll('.admin-nav a');
    const tabs = document.querySelectorAll('.admin-tab');

    tabLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetTab = this.getAttribute('data-tab');

            // Remove active class from all tabs and links
            tabLinks.forEach(l => l.classList.remove('active'));
            tabs.forEach(t => t.classList.remove('active'));

            // Add active class to clicked tab and link
            this.classList.add('active');
            document.getElementById(targetTab).classList.add('active');

            // Load data for the selected tab
            loadTabData(targetTab);
        });
    });

    // Load dashboard data initially
    loadTabData('dashboard');

    // Dashboard period filter
    const dashboardPeriod = document.getElementById('dashboard-period');
    if (dashboardPeriod) {
        dashboardPeriod.addEventListener('change', () => loadTabData('dashboard'));
    }

    // Search functionality for all tables
    const searchInputs = document.querySelectorAll('.search-filter input');
    searchInputs.forEach(input => {
        input.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            const tableId = this.id.replace('-search', '-table');
            const tableRows = document.querySelectorAll(`#${tableId} tbody tr`);

            tableRows.forEach(row => {
                const text = row.textContent.toLowerCase();
                row.style.display = text.includes(searchTerm) ? '' : 'none';
            });
        });
    });

    // Settings form submission
    const saveSettingsBtn = document.getElementById('save-settings');
    if (saveSettingsBtn) {
        saveSettingsBtn.addEventListener('click', async () => {
            const settings = {
                systemEmail: document.getElementById('system-email').value,
                notificationsEnabled: document.getElementById('notifications').checked,
                maintenanceMode: document.getElementById('maintenance-mode').checked
            };

            try {
                const response = await fetch('/api/admin/settings', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(settings)
                });
                const data = await response.json();
                if (data.success) {
                    alert('Settings saved successfully');
                } else {
                    alert('Error saving settings: ' + data.error);
                }
            } catch (error) {
                console.error('Error:', error);
                alert('An error occurred while saving settings');
            }
        });
    }

    // Action buttons functionality
    const actionButtons = document.querySelectorAll('.action-buttons button');

    actionButtons.forEach(button => {
        button.addEventListener('click', function() {
            const action = this.querySelector('i').className;
            const row = this.closest('tr');
            const id = row.querySelector('td:first-child').textContent;
            const name = row.querySelector('td:nth-child(2)').textContent;
            const tableElem = this.closest('table');
            const table = tableElem && tableElem.id ? tableElem.id.replace('-table', '') : '';

            if (!table) {
                alert('Unknown table for this action.');
                return;
            }

            let url = '';
            if (table === 'users') {
                url = `/api/admin/users/${id}`;
            } else if (table === 'volunteers') {
                url = `/api/admin/volunteers/${id}`;
            } else if (table === 'requests') {
                url = `/api/admin/requests/${id}`;
            } else {
                alert('Unknown table for this action.');
                return;
            }

            if (action.includes('fa-eye')) {
                fetch(url)
                    .then(res => res.json())
                    .then(data => {
                        if (data.success) {
                            alert(`Viewing details for ${table.slice(0, -1)}: ${name} (ID: ${id})\n${JSON.stringify(data.item, null, 2)}`);
                        } else {
                            alert('Error: ' + data.error);
                        }
                    })
                    .catch(() => alert('An error occurred while loading details'));
            } else if (action.includes('fa-edit')) {
                fetch(url)
                    .then(res => res.json())
                    .then(data => {
                        if (data.success) {
                            alert(`Editing ${table.slice(0, -1)}: ${name} (ID: ${id})\n${JSON.stringify(data.item, null, 2)}`);
                        } else {
                            alert('Error: ' + data.error);
                        }
                    })
                    .catch(() => alert('An error occurred while loading details'));
            } else if (action.includes('fa-trash')) {
                if (confirm(`Are you sure you want to delete ${table.slice(0, -1)}: ${name}?`)) {
                    fetch(url, { method: 'DELETE' })
                        .then(res => res.json())
                        .then(data => {
                            if (data.success) {
                                row.remove();
                                alert(`${table.slice(0, -1).charAt(0).toUpperCase() + table.slice(1, -1)} deleted successfully`);
                            } else {
                                alert('Error: ' + data.error);
                            }
                        })
                        .catch(() => alert('An error occurred while deleting'));
                }
            }
        });
    });

    // Pagination functionality
    const paginationButtons = document.querySelectorAll('.pagination-btn');
    
    paginationButtons.forEach(button => {
        button.addEventListener('click', function() {
            if (!this.disabled) {
                paginationButtons.forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');
                // Here you would typically make an AJAX call to load the next page of data
            }
        });
    });

    // Hamburger menu for mobile
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');

    hamburger.addEventListener('click', function() {
        navLinks.classList.toggle('active');
        hamburger.classList.toggle('active');
    });
});

// Function to load data for each tab
async function loadTabData(tabName) {
    try {
        switch (tabName) {
            case 'dashboard':
                const period = document.getElementById('dashboard-period').value;
                const dashResponse = await fetch(`/api/admin/dashboard?period=${period}`);
                if (!dashResponse.ok) {
                    if (dashResponse.status === 401 || dashResponse.status === 403) {
                        window.location.href = '/login';
                        return;
                    }
                    throw new Error('Failed to fetch dashboard data');
                }
                const dashData = await dashResponse.json();
                
                if (dashData.success) {
                    document.querySelector('#user-count .stat-number').textContent = dashData.stats.userCount;
                    document.querySelector('#volunteer-count .stat-number').textContent = dashData.stats.volunteerCount;
                    document.querySelector('#request-count .stat-number').textContent = dashData.stats.requestCount;
                    document.querySelector('#completed-count .stat-number').textContent = dashData.stats.completedCount;
                }
                break;

            case 'volunteers':
                const volResponse = await fetch('/api/admin/volunteers');
                const volData = await volResponse.json();
                
                if (volData.success) {
                    const tbody = document.querySelector('#volunteers-table tbody');
                    tbody.innerHTML = volData.volunteers.map(v => `
                        <tr>
                            <td>${v.id}</td>
                            <td>${v.name}</td>
                            <td>${v.email}</td>
                            <td>${v.phone || 'N/A'}</td>
                            <td>${v.skills || 'N/A'}</td>
                            <td><span class="status-badge ${v.status || 'active'}">${v.status || 'active'}</span></td>
                            <td class="action-buttons">
                                <button class="btn btn-sm btn-secondary view-btn" data-id="${v.id}"><i class="fas fa-eye"></i></button>
                                <button class="btn btn-sm btn-primary edit-btn" data-id="${v.id}"><i class="fas fa-edit"></i></button>
                                <button class="btn btn-sm btn-danger delete-btn" data-id="${v.id}"><i class="fas fa-trash"></i></button>
                            </td>
                        </tr>
                    `).join('');

                    // Add event listeners to the new buttons
                    tbody.querySelectorAll('.view-btn').forEach(btn => {
                        btn.addEventListener('click', async () => {
                            const id = btn.dataset.id;
                            try {
                                const response = await fetch(`/api/admin/volunteers/${id}`);
                                const data = await response.json();
                                if (data.success) {
                                    const volunteer = data.item;
                                    
                                    // Create and show the view modal
                                    const modalHtml = `
                                        <div class="modal fade" id="viewVolunteerModal" tabindex="-1" role="dialog" aria-labelledby="viewVolunteerModalLabel" aria-hidden="true">
                                            <div class="modal-dialog modal-lg" role="document">
                                                <div class="modal-content">
                                                    <div class="modal-header bg-light">
                                                        <h5 class="modal-title" id="viewVolunteerModalLabel">Volunteer Details</h5>
                                                        <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                                                            <span aria-hidden="true">&times;</span>
                                                        </button>
                                                    </div>
                                                    <div class="modal-body">
                                                        <div class="table-responsive">
                                                            <table class="table table-bordered">
                                                                <tbody>
                                                                    <tr><th>ID</th><td>${volunteer.id}</td></tr>
                                                                    <tr><th>Name</th><td>${volunteer.name}</td></tr>
                                                                    <tr><th>Email</th><td>${volunteer.email}</td></tr>
                                                                    <tr><th>Phone</th><td>${volunteer.phone || 'N/A'}</td></tr>
                                                                    <tr><th>Address</th><td>${volunteer.address || 'N/A'}</td></tr>
                                                                    <tr><th>Skills</th><td>${volunteer.skills || 'N/A'}</td></tr>
                                                                    <tr><th>Status</th><td><span class="status-badge ${volunteer.status || 'active'}">${volunteer.status || 'active'}</span></td></tr>
                                                                    <tr><th>Created</th><td>${new Date(volunteer.created_at).toLocaleString()}</td></tr>
                                                                    <tr><th>Last Login</th><td>${volunteer.last_login ? new Date(volunteer.last_login).toLocaleString() : 'N/A'}</td></tr>
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    </div>
                                                    <div class="modal-footer bg-light">
                                                        <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    `;

                                    // Remove existing modal if any
                                    const existingModal = document.getElementById('viewVolunteerModal');
                                    if (existingModal) {
                                        existingModal.remove();
                                    }

                                    // Add modal to body
                                    document.body.insertAdjacentHTML('beforeend', modalHtml);

                                    // Show modal
                                    const modalElement = document.getElementById('viewVolunteerModal');
                                    modalElement.classList.add('show');
                                    modalElement.style.display = 'block';
                                    document.body.classList.add('modal-open');
                                    
                                    // Add backdrop
                                    const backdrop = document.createElement('div');
                                    backdrop.className = 'modal-backdrop fade show';
                                    document.body.appendChild(backdrop);

                                    // Handle modal close
                                    const closeButtons = modalElement.querySelectorAll('[data-dismiss="modal"]');
                                    closeButtons.forEach(button => {
                                        button.addEventListener('click', () => {
                                            modalElement.classList.remove('show');
                                            modalElement.style.display = 'none';
                                            document.body.classList.remove('modal-open');
                                            backdrop.remove();
                                        });
                                    });

                                    // Close modal when clicking outside
                                    modalElement.addEventListener('click', (e) => {
                                        if (e.target === modalElement) {
                                            modalElement.classList.remove('show');
                                            modalElement.style.display = 'none';
                                            document.body.classList.remove('modal-open');
                                            backdrop.remove();
                                        }
                                    });
                                } else {
                                    alert('Error: ' + data.error);
                                }
                            } catch (error) {
                                alert('An error occurred while loading volunteer details');
                            }
                        });
                    });

                    tbody.querySelectorAll('.edit-btn').forEach(btn => {
                        btn.addEventListener('click', async () => {
                            const id = btn.dataset.id;
                            try {
                                const response = await fetch(`/api/admin/volunteers/${id}`);
                                const data = await response.json();
                                if (data.success) {
                                    const volunteer = data.item;
                                    
                                    // Create and show the edit modal
                                    const modalHtml = `
                                        <div class="modal fade" id="editVolunteerModal" tabindex="-1" role="dialog">
                                            <div class="modal-dialog" role="document">
                                                <div class="modal-content">
                                                    <div class="modal-header">
                                                        <h5 class="modal-title">Edit Volunteer</h5>
                                                        <button type="button" class="close" data-dismiss="modal">
                                                            <span>&times;</span>
                                                        </button>
                                                    </div>
                                                    <div class="modal-body">
                                                        <form id="editVolunteerForm">
                                                            <input type="hidden" id="editVolunteerId" value="${volunteer.id}">
                                                            <div class="form-group">
                                                                <label for="editVolunteerName">Name</label>
                                                                <input type="text" class="form-control" id="editVolunteerName" value="${volunteer.name}" required>
                                                            </div>
                                                            <div class="form-group">
                                                                <label for="editVolunteerEmail">Email</label>
                                                                <input type="email" class="form-control" id="editVolunteerEmail" value="${volunteer.email}" required>
                                                            </div>
                                                            <div class="form-group">
                                                                <label for="editVolunteerPhone">Phone</label>
                                                                <input type="tel" class="form-control" id="editVolunteerPhone" value="${volunteer.phone || ''}">
                                                            </div>
                                                            <div class="form-group">
                                                                <label for="editVolunteerAddress">Address</label>
                                                                <input type="text" class="form-control" id="editVolunteerAddress" value="${volunteer.address || ''}" required>
                                                            </div>
                                                            <div class="form-group">
                                                                <label for="editVolunteerSkills">Skills</label>
                                                                <textarea class="form-control" id="editVolunteerSkills">${volunteer.skills || ''}</textarea>
                                                            </div>
                                                            <div class="form-group">
                                                                <label for="editVolunteerStatus">Status</label>
                                                                <select class="form-control" id="editVolunteerStatus">
                                                                    <option value="active" ${volunteer.status === 'active' ? 'selected' : ''}>Active</option>
                                                                    <option value="inactive" ${volunteer.status === 'inactive' ? 'selected' : ''}>Inactive</option>
                                                                    <option value="suspended" ${volunteer.status === 'suspended' ? 'selected' : ''}>Suspended</option>
                                                                </select>
                                                            </div>
                                                        </form>
                                                    </div>
                                                    <div class="modal-footer">
                                                        <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
                                                        <button type="button" class="btn btn-primary" id="saveVolunteerChanges">Save changes</button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    `;

                                    // Remove existing modal if any
                                    const existingModal = document.getElementById('editVolunteerModal');
                                    if (existingModal) {
                                        existingModal.remove();
                                    }

                                    // Add modal to body
                                    document.body.insertAdjacentHTML('beforeend', modalHtml);

                                    // Show modal
                                    const modalElement = document.getElementById('editVolunteerModal');
                                    modalElement.classList.add('show');
                                    modalElement.style.display = 'block';
                                    document.body.classList.add('modal-open');
                                    
                                    // Add backdrop
                                    const backdrop = document.createElement('div');
                                    backdrop.className = 'modal-backdrop fade show';
                                    document.body.appendChild(backdrop);

                                    // Handle modal close
                                    const closeButtons = modalElement.querySelectorAll('[data-dismiss="modal"]');
                                    closeButtons.forEach(button => {
                                        button.addEventListener('click', () => {
                                            modalElement.classList.remove('show');
                                            modalElement.style.display = 'none';
                                            document.body.classList.remove('modal-open');
                                            backdrop.remove();
                                        });
                                    });

                                    // Close modal when clicking outside
                                    modalElement.addEventListener('click', (e) => {
                                        if (e.target === modalElement) {
                                            modalElement.classList.remove('show');
                                            modalElement.style.display = 'none';
                                            document.body.classList.remove('modal-open');
                                            backdrop.remove();
                                        }
                                    });

                                    // Handle save changes
                                    document.getElementById('saveVolunteerChanges').addEventListener('click', async () => {
                                        const updatedVolunteer = {
                                            name: document.getElementById('editVolunteerName').value,
                                            email: document.getElementById('editVolunteerEmail').value,
                                            phone: document.getElementById('editVolunteerPhone').value,
                                            address: document.getElementById('editVolunteerAddress').value,
                                            skills: document.getElementById('editVolunteerSkills').value,
                                            status: document.getElementById('editVolunteerStatus').value
                                        };

                                        try {
                                            const updateResponse = await fetch(`/api/admin/volunteers/${id}`, {
                                                method: 'PUT',
                                                headers: {
                                                    'Content-Type': 'application/json'
                                                },
                                                body: JSON.stringify(updatedVolunteer)
                                            });

                                            const updateData = await updateResponse.json();
                                            if (updateData.success) {
                                                // Update the row in the table
                                                const row = btn.closest('tr');
                                                row.querySelector('td:nth-child(2)').textContent = updatedVolunteer.name;
                                                row.querySelector('td:nth-child(3)').textContent = updatedVolunteer.email;
                                                row.querySelector('td:nth-child(4)').textContent = updatedVolunteer.phone || 'N/A';
                                                row.querySelector('td:nth-child(5)').textContent = updatedVolunteer.skills || 'N/A';
                                                row.querySelector('td:nth-child(6)').innerHTML = `<span class="status-badge ${updatedVolunteer.status}">${updatedVolunteer.status}</span>`;

                                                // Close modal
                                                modalElement.classList.remove('show');
                                                modalElement.style.display = 'none';
                                                document.body.classList.remove('modal-open');
                                                backdrop.remove();
                                                
                                                alert('Volunteer updated successfully');
                                            } else {
                                                alert('Error: ' + updateData.error);
                                            }
                                        } catch (error) {
                                            alert('An error occurred while updating the volunteer');
                                        }
                                    });
                                } else {
                                    alert('Error: ' + data.error);
                                }
                            } catch (error) {
                                alert('An error occurred while loading volunteer details');
                            }
                        });
                    });

                    tbody.querySelectorAll('.delete-btn').forEach(btn => {
                        btn.addEventListener('click', async () => {
                            const id = btn.dataset.id;
                            const row = btn.closest('tr');
                            const name = row.querySelector('td:nth-child(2)').textContent;
                            
                            if (confirm(`Are you sure you want to delete volunteer: ${name}?`)) {
                                try {
                                    const response = await fetch(`/api/admin/volunteers/${id}`, {
                                        method: 'DELETE'
                                    });
                                    const data = await response.json();
                                    if (data.success) {
                                        row.remove();
                                        alert('Volunteer deleted successfully');
                                    } else {
                                        alert('Error: ' + data.error);
                                    }
                                } catch (error) {
                                    alert('An error occurred while deleting the volunteer');
                                }
                            }
                        });
                    });
                }
                break;

            case 'requests':
                const reqResponse = await fetch('/api/admin/requests');
                const reqData = await reqResponse.json();
                
                if (reqData.success) {
                    const tbody = document.querySelector('#requests-table tbody');
                    tbody.innerHTML = reqData.requests.map(r => `
                        <tr>
                            <td>${r.id}</td>
                            <td>${r.title}</td>
                            <td>${r.user_id ? r.user_name : 'Not Assigned'}</td>
                            <td>${r.volunteer_id ? r.volunteer_name : 'Not Assigned'}</td>
                            <td><span class="status-badge ${r.status}">${r.status}</span></td>
                            <td>${new Date(r.created_at).toLocaleDateString()}</td>
                            <td class="action-buttons">
                                <button class="btn btn-sm btn-secondary view-btn" data-id="${r.id}"><i class="fas fa-eye"></i></button>
                                <button class="btn btn-sm btn-primary edit-btn" data-id="${r.id}"><i class="fas fa-edit"></i></button>
                                <button class="btn btn-sm btn-danger delete-btn" data-id="${r.id}"><i class="fas fa-trash"></i></button>
                            </td>
                        </tr>
                    `).join('');

                    // Add event listeners to the new buttons
                    tbody.querySelectorAll('.view-btn').forEach(btn => {
                        btn.addEventListener('click', async () => {
                            const id = btn.dataset.id;
                            try {
                                const response = await fetch(`/api/admin/requests/${id}`);
                                const data = await response.json();
                                if (data.success) {
                                    const r = data.item;
                                    const modalHtml = `
                                        <div class="modal fade" id="viewRequestModal" tabindex="-1" role="dialog" aria-labelledby="viewRequestModalLabel" aria-hidden="true">
                                            <div class="modal-dialog modal-lg" role="document">
                                                <div class="modal-content">
                                                    <div class="modal-header bg-light">
                                                        <h5 class="modal-title" id="viewRequestModalLabel">Help Request Details</h5>
                                                        <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                                                            <span aria-hidden="true">&times;</span>
                                                        </button>
                                                    </div>
                                                    <div class="modal-body">
                                                        <div class="table-responsive">
                                                            <table class="table table-bordered">
                                                                <tbody>
                                                                    <tr><th>ID</th><td>${r.id}</td></tr>
                                                                    <tr><th>Title</th><td>${r.title}</td></tr>
                                                                    <tr><th>User</th><td>${r.user_name || 'Unknown User'}</td></tr>
                                                                    <tr><th>Volunteer</th><td>${r.volunteer_name || 'Unassigned'}</td></tr>
                                                                    <tr><th>Status</th><td>${r.status}</td></tr>
                                                                    <tr><th>Date</th><td>${new Date(r.created_at).toLocaleString()}</td></tr>
                                                                    <tr><th>Description</th><td>${r.description || 'N/A'}</td></tr>
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    </div>
                                                    <div class="modal-footer bg-light">
                                                        <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    `;

                                    // Remove existing modal if any
                                    const existingModal = document.getElementById('viewRequestModal');
                                    if (existingModal) existingModal.remove();

                                    // Add modal to body
                                    document.body.insertAdjacentHTML('beforeend', modalHtml);

                                    // Show modal
                                    const modalElement = document.getElementById('viewRequestModal');
                                    modalElement.classList.add('show');
                                    modalElement.style.display = 'block';
                                    document.body.classList.add('modal-open');

                                    // Add backdrop
                                    const backdrop = document.createElement('div');
                                    backdrop.className = 'modal-backdrop fade show';
                                    document.body.appendChild(backdrop);

                                    // Handle modal close
                                    const closeButtons = modalElement.querySelectorAll('[data-dismiss="modal"]');
                                    closeButtons.forEach(button => {
                                        button.addEventListener('click', () => {
                                            modalElement.classList.remove('show');
                                            modalElement.style.display = 'none';
                                            document.body.classList.remove('modal-open');
                                            backdrop.remove();
                                        });
                                    });

                                    // Close modal when clicking outside
                                    modalElement.addEventListener('click', (e) => {
                                        if (e.target === modalElement) {
                                            modalElement.classList.remove('show');
                                            modalElement.style.display = 'none';
                                            document.body.classList.remove('modal-open');
                                            backdrop.remove();
                                        }
                                    });
                                } else {
                                    alert('Error: ' + data.error);
                                }
                            } catch (error) {
                                alert('An error occurred while loading help request details');
                            }
                        });
                    });

                    tbody.querySelectorAll('.edit-btn').forEach(btn => {
                        btn.addEventListener('click', async () => {
                            const id = btn.dataset.id;
                            try {
                                const response = await fetch(`/api/admin/requests/${id}`);
                                const data = await response.json();
                                if (data.success) {
                                    const r = data.item;
                                    const modalHtml = `
                                        <div class="modal fade" id="editRequestModal" tabindex="-1" role="dialog" aria-labelledby="editRequestModalLabel" aria-hidden="true">
                                            <div class="modal-dialog modal-lg" role="document">
                                                <div class="modal-content">
                                                    <div class="modal-header bg-light">
                                                        <h5 class="modal-title" id="editRequestModalLabel">Edit Help Request</h5>
                                                        <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                                                            <span aria-hidden="true">&times;</span>
                                                        </button>
                                                    </div>
                                                    <div class="modal-body">
                                                        <form id="editRequestForm">
                                                            <table class="table table-bordered">
                                                                <tbody>
                                                                    <tr><th>ID</th><td>${r.id}</td></tr>
                                                                    <tr><th>Title</th><td><input type="text" class="form-control" id="editRequestTitle" value="${r.title}" required></td></tr>
                                                                    <tr><th>Type</th><td>
                                                                        <select class="form-control" id="editRequestType" required>
                                                                            <option value="cleaning" ${r.type === 'cleaning' ? 'selected' : ''}>Cleaning</option>
                                                                            <option value="shopping" ${r.type === 'shopping' ? 'selected' : ''}>Shopping</option>
                                                                            <option value="medical" ${r.type === 'medical' ? 'selected' : ''}>Medical</option>
                                                                            <option value="transportation" ${r.type === 'transportation' ? 'selected' : ''}>Transportation</option>
                                                                            <option value="other" ${r.type === 'other' ? 'selected' : ''}>Other</option>
                                                                        </select>
                                                                    </td></tr>
                                                                    <tr><th>Date</th><td>
                                                                        <input type="date" class="form-control" id="editRequestDate" value="${r.date ? new Date(r.date).toISOString().split('T')[0] : ''}" required>
                                                                    </td></tr>
                                                                    <tr><th>Time</th><td>
                                                                        <input type="time" class="form-control" id="editRequestTime" value="${r.time || ''}" required>
                                                                    </td></tr>
                                                                    <tr><th>Duration (hours)</th><td>
                                                                        <input type="number" class="form-control" id="editRequestDuration" value="${r.duration || ''}" min="1" max="24" required>
                                                                    </td></tr>
                                                                    <tr><th>Location</th><td>
                                                                        <input type="text" class="form-control" id="editRequestLocation" value="${r.location || ''}" required>
                                                                    </td></tr>
                                                                    <tr><th>User</th><td>${r.user_name || 'Unknown User'}</td></tr>
                                                                    <tr><th>Volunteer</th><td>${r.volunteer_name || 'Unassigned'}</td></tr>
                                                                    <tr><th>Status</th><td>
                                                                        <select class="form-control" id="editRequestStatus" required>
                                                                            <option value="pending" ${r.status === 'pending' ? 'selected' : ''}>Pending</option>
                                                                            <option value="in_progress" ${r.status === 'in_progress' ? 'selected' : ''}>In Progress</option>
                                                                            <option value="completed" ${r.status === 'completed' ? 'selected' : ''}>Completed</option>
                                                                            <option value="cancelled" ${r.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                                                                        </select>
                                                                    </td></tr>
                                                                    <tr><th>Description</th><td><textarea class="form-control" id="editRequestDescription">${r.description || ''}</textarea></td></tr>
                                                                </tbody>
                                                            </table>
                                                        </form>
                                                    </div>
                                                    <div class="modal-footer bg-light">
                                                        <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
                                                        <button type="button" class="btn btn-primary" id="saveRequestChanges">Save changes</button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    `;

                                    // Remove existing modal if any
                                    const existingModal = document.getElementById('editRequestModal');
                                    if (existingModal) existingModal.remove();

                                    // Add modal to body
                                    document.body.insertAdjacentHTML('beforeend', modalHtml);

                                    // Show modal
                                    const modalElement = document.getElementById('editRequestModal');
                                    modalElement.classList.add('show');
                                    modalElement.style.display = 'block';
                                    document.body.classList.add('modal-open');

                                    // Add backdrop
                                    const backdrop = document.createElement('div');
                                    backdrop.className = 'modal-backdrop fade show';
                                    document.body.appendChild(backdrop);

                                    // Handle modal close
                                    const closeButtons = modalElement.querySelectorAll('[data-dismiss="modal"]');
                                    closeButtons.forEach(button => {
                                        button.addEventListener('click', () => {
                                            modalElement.classList.remove('show');
                                            modalElement.style.display = 'none';
                                            document.body.classList.remove('modal-open');
                                            backdrop.remove();
                                        });
                                    });

                                    // Close modal when clicking outside
                                    modalElement.addEventListener('click', (e) => {
                                        if (e.target === modalElement) {
                                            modalElement.classList.remove('show');
                                            modalElement.style.display = 'none';
                                            document.body.classList.remove('modal-open');
                                            backdrop.remove();
                                        }
                                    });

                                    // Handle save changes
                                    document.getElementById('saveRequestChanges').addEventListener('click', async () => {
                                        const dateInput = document.getElementById('editRequestDate');
                                        const timeInput = document.getElementById('editRequestTime');
                                        
                                        // Validate date and time
                                        if (!dateInput.value) {
                                            alert('Please select a valid date');
                                            return;
                                        }
                                        if (!timeInput.value) {
                                            alert('Please select a valid time');
                                            return;
                                        }

                                        const updatedRequest = {
                                            title: document.getElementById('editRequestTitle').value,
                                            type: document.getElementById('editRequestType').value,
                                            date: dateInput.value, // This will be in YYYY-MM-DD format
                                            time: timeInput.value,
                                            duration: document.getElementById('editRequestDuration').value,
                                            location: document.getElementById('editRequestLocation').value,
                                            status: document.getElementById('editRequestStatus').value,
                                            description: document.getElementById('editRequestDescription').value
                                        };

                                        try {
                                            const updateResponse = await fetch(`/api/admin/requests/${id}`, {
                                                method: 'PUT',
                                                headers: {
                                                    'Content-Type': 'application/json'
                                                },
                                                body: JSON.stringify(updatedRequest)
                                            });

                                            const updateData = await updateResponse.json();
                                            if (updateData.success) {
                                                // Update the row in the table
                                                const row = btn.closest('tr');
                                                row.querySelector('td:nth-child(2)').textContent = updatedRequest.title;
                                                row.querySelector('td:nth-child(5)').innerHTML = `<span class="status-badge ${updatedRequest.status}">${updatedRequest.status}</span>`;

                                                // Close modal
                                                modalElement.classList.remove('show');
                                                modalElement.style.display = 'none';
                                                document.body.classList.remove('modal-open');
                                                backdrop.remove();
                                                
                                                alert('Help request updated successfully');
                                            } else {
                                                alert('Error: ' + updateData.error);
                                            }
                                        } catch (error) {
                                            alert('An error occurred while updating the help request');
                                        }
                                    });
                                } else {
                                    alert('Error: ' + data.error);
                                }
                            } catch (error) {
                                alert('An error occurred while loading help request details');
                            }
                        });
                    });

                    tbody.querySelectorAll('.delete-btn').forEach(btn => {
                        btn.addEventListener('click', async () => {
                            const id = btn.dataset.id;
                            const row = btn.closest('tr');
                            const title = row.querySelector('td:nth-child(2)').textContent;
                            
                            if (confirm(`Are you sure you want to delete help request: ${title}?`)) {
                                try {
                                    const response = await fetch(`/api/admin/requests/${id}`, {
                                        method: 'DELETE'
                                    });
                                    const data = await response.json();
                                    if (data.success) {
                                        row.remove();
                                        alert('Help request deleted successfully');
                                    } else {
                                        alert('Error: ' + data.error);
                                    }
                                } catch (error) {
                                    alert('An error occurred while deleting the help request');
                                }
                            }
                        });
                    });
                }
                break;

            case 'feedback':
                const fbResponse = await fetch('/api/admin/feedback');
                if (!fbResponse.ok) {
                    if (fbResponse.status === 401 || fbResponse.status === 403) {
                        window.location.href = '/login';
                        return;
                    }
                    throw new Error('Failed to fetch feedback data');
                }
                const fbData = await fbResponse.json();
                
                if (fbData.success) {
                    const tbody = document.querySelector('#feedback-table tbody');
                    tbody.innerHTML = fbData.feedback.map(f => `
                        <tr>
                            <td>${f.id}</td>
                            <td>${f.user_name || 'Anonymous'}</td>
                            <td>${f.volunteer_name || 'N/A'}</td>
                            <td>${'★'.repeat(f.rating)}${'☆'.repeat(5-f.rating)}</td>
                            <td>${f.comment || 'N/A'}</td>
                            <td>${new Date(f.created_at).toLocaleDateString()}</td>
                            <td class="action-buttons">
                                <button class="btn btn-sm btn-secondary view-btn" data-id="${f.id}"><i class="fas fa-eye"></i></button>
                                <button class="btn btn-sm btn-danger delete-btn" data-id="${f.id}"><i class="fas fa-trash"></i></button>
                            </td>
                        </tr>
                    `).join('');

                    // Add event listeners to the new buttons
                    tbody.querySelectorAll('.view-btn').forEach(btn => {
                        btn.addEventListener('click', async () => {
                            const id = btn.dataset.id;
                            try {
                                const response = await fetch(`/api/admin/feedback/${id}`);
                                if (!response.ok) {
                                    if (response.status === 401 || response.status === 403) {
                                        window.location.href = '/login';
                                        return;
                                    }
                                    throw new Error('Failed to fetch feedback details');
                                }
                                const data = await response.json();
                                if (data.success) {
                                    const feedback = data.item;
                                    const modalHtml = `
                                        <div class="modal fade" id="viewFeedbackModal" tabindex="-1" role="dialog">
                                            <div class="modal-dialog modal-lg">
                                                <div class="modal-content">
                                                    <div class="modal-header">
                                                        <h5 class="modal-title">Feedback Details</h5>
                                                        <button type="button" class="close" data-dismiss="modal">&times;</button>
                                                    </div>
                                                    <div class="modal-body">
                                                        <table class="table table-bordered">
                                                            <tbody>
                                                                <tr><th>ID</th><td>${feedback.id}</td></tr>
                                                                <tr><th>User</th><td>${feedback.user_name || 'Anonymous'}</td></tr>
                                                                <tr><th>Volunteer</th><td>${feedback.volunteer_name || 'N/A'}</td></tr>
                                                                <tr><th>Rating</th><td>${'★'.repeat(feedback.rating)}${'☆'.repeat(5-feedback.rating)}</td></tr>
                                                                <tr><th>Comment</th><td>${feedback.comment || 'N/A'}</td></tr>
                                                                <tr><th>Date</th><td>${new Date(feedback.created_at).toLocaleString()}</td></tr>
                                                                <tr><th>Public</th><td>${feedback.is_public ? 'Yes' : 'No'}</td></tr>
                                                                <tr><th>Request ID</th><td>${feedback.request_id || 'N/A'}</td></tr>
                                                                <tr><th>Email</th><td>${feedback.email || 'N/A'}</td></tr>
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                    <div class="modal-footer">
                                                        <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    `;

                                    // Remove existing modal if any
                                    const existingModal = document.getElementById('viewFeedbackModal');
                                    if (existingModal) {
                                        existingModal.remove();
                                    }

                                    // Add modal to body
                                    document.body.insertAdjacentHTML('beforeend', modalHtml);

                                    // Show modal
                                    const modalElement = document.getElementById('viewFeedbackModal');
                                    modalElement.classList.add('show');
                                    modalElement.style.display = 'block';
                                    document.body.classList.add('modal-open');
                                    
                                    // Add backdrop
                                    const backdrop = document.createElement('div');
                                    backdrop.className = 'modal-backdrop fade show';
                                    document.body.appendChild(backdrop);

                                    // Handle modal close
                                    const closeButtons = modalElement.querySelectorAll('[data-dismiss="modal"]');
                                    closeButtons.forEach(button => {
                                        button.addEventListener('click', () => {
                                            modalElement.classList.remove('show');
                                            modalElement.style.display = 'none';
                                            document.body.classList.remove('modal-open');
                                            backdrop.remove();
                                        });
                                    });

                                    // Close modal when clicking outside
                                    modalElement.addEventListener('click', (e) => {
                                        if (e.target === modalElement) {
                                            modalElement.classList.remove('show');
                                            modalElement.style.display = 'none';
                                            document.body.classList.remove('modal-open');
                                            backdrop.remove();
                                        }
                                    });
                                } else {
                                    alert('Error: ' + data.error);
                                }
                            } catch (error) {
                                console.error('Error loading feedback details:', error);
                                alert('An error occurred while loading feedback details');
                            }
                        });
                    });

                    tbody.querySelectorAll('.delete-btn').forEach(btn => {
                        btn.addEventListener('click', async () => {
                            const id = btn.dataset.id;
                            const row = btn.closest('tr');
                            const userName = row.querySelector('td:nth-child(2)').textContent;
                            const volunteerName = row.querySelector('td:nth-child(3)').textContent;
                            
                            if (confirm(`Are you sure you want to delete feedback from ${userName} for ${volunteerName}?`)) {
                                try {
                                    const response = await fetch(`/api/admin/feedback/${id}`, {
                                        method: 'DELETE'
                                    });
                                    if (!response.ok) {
                                        if (response.status === 401 || response.status === 403) {
                                            window.location.href = '/login';
                                            return;
                                        }
                                        throw new Error('Failed to delete feedback');
                                    }
                                    const data = await response.json();
                                    if (data.success) {
                                        row.remove();
                                        alert('Feedback deleted successfully');
                                    } else {
                                        alert('Error: ' + data.error);
                                    }
                                } catch (error) {
                                    console.error('Error deleting feedback:', error);
                                    alert('An error occurred while deleting the feedback');
                                }
                            }
                        });
                    });
                }
                break;

            case 'transactions':
                const txResponse = await fetch('/api/admin/transactions');
                if (!txResponse.ok) {
                    if (txResponse.status === 401 || txResponse.status === 403) {
                        window.location.href = '/login';
                        return;
                    }
                    throw new Error('Failed to fetch transaction data');
                }
                const txData = await txResponse.json();
                
                if (txData.success) {
                    const tbody = document.querySelector('#transactions-table tbody');
                    tbody.innerHTML = txData.transactions.map(t => `
                        <tr>
                            <td>${t.id}</td>
                            <td>${t.user_name || 'N/A'}</td>
                            <td>${t.volunteer_name || 'N/A'}</td>
                            <td>₹${Number(t.amount).toFixed(2)}</td>
                            <td><span class="status-badge ${t.status}">${t.status}</span></td>
                            <td>${new Date(t.created_at).toLocaleDateString()}</td>
                            <td class="action-buttons">
                                <button class="btn btn-sm btn-secondary view-btn" data-id="${t.id}"><i class="fas fa-eye"></i></button>
                                <button class="btn btn-sm btn-primary edit-btn" data-id="${t.id}"><i class="fas fa-edit"></i></button>
                            </td>
                        </tr>
                    `).join('');

                    // Add event listeners to the new buttons
                    tbody.querySelectorAll('.view-btn').forEach(btn => {
                        btn.addEventListener('click', async () => {
                            const id = btn.dataset.id;
                            try {
                                const response = await fetch(`/api/admin/transactions/${id}`);
                                if (!response.ok) {
                                    if (response.status === 401 || response.status === 403) {
                                        window.location.href = '/login';
                                        return;
                                    }
                                    throw new Error('Failed to fetch transaction details');
                                }
                                const data = await response.json();
                                if (data.success) {
                                    const transaction = data.item;
                                    const modalHtml = `
                                        <div class="modal fade" id="viewTransactionModal" tabindex="-1" role="dialog">
                                            <div class="modal-dialog modal-lg">
                                                <div class="modal-content">
                                                    <div class="modal-header">
                                                        <h5 class="modal-title">Transaction Details</h5>
                                                        <button type="button" class="close" data-dismiss="modal">&times;</button>
                                                    </div>
                                                    <div class="modal-body">
                                                        <table class="table table-bordered">
                                                            <tbody>
                                                                <tr><th>ID</th><td>${transaction.id}</td></tr>
                                                                <tr><th>User</th><td>${transaction.user_name || 'N/A'}</td></tr>
                                                                <tr><th>Volunteer</th><td>${transaction.volunteer_name || 'N/A'}</td></tr>
                                                                <tr><th>Amount</th><td>₹${Number(transaction.amount).toFixed(2)}</td></tr>
                                                                <tr><th>Status</th><td><span class="status-badge ${transaction.status}">${transaction.status}</span></td></tr>
                                                                <tr><th>Date</th><td>${new Date(transaction.created_at).toLocaleString()}</td></tr>
                                                                <tr><th>Payment Method</th><td>${transaction.payment_method || 'N/A'}</td></tr>
                                                                <tr><th>Transaction Reference</th><td>${transaction.transaction_ref || 'N/A'}</td></tr>
                                                                <tr><th>Notes</th><td>${transaction.notes || 'N/A'}</td></tr>
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                    <div class="modal-footer">
                                                        <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    `;

                                    // Remove existing modal if any
                                    const existingModal = document.getElementById('viewTransactionModal');
                                    if (existingModal) {
                                        existingModal.remove();
                                    }

                                    // Add modal to body
                                    document.body.insertAdjacentHTML('beforeend', modalHtml);

                                    // Show modal
                                    const modalElement = document.getElementById('viewTransactionModal');
                                    modalElement.classList.add('show');
                                    modalElement.style.display = 'block';
                                    document.body.classList.add('modal-open');
                                    
                                    // Add backdrop
                                    const backdrop = document.createElement('div');
                                    backdrop.className = 'modal-backdrop fade show';
                                    document.body.appendChild(backdrop);

                                    // Handle modal close
                                    const closeButtons = modalElement.querySelectorAll('[data-dismiss="modal"]');
                                    closeButtons.forEach(button => {
                                        button.addEventListener('click', () => {
                                            modalElement.classList.remove('show');
                                            modalElement.style.display = 'none';
                                            document.body.classList.remove('modal-open');
                                            backdrop.remove();
                                        });
                                    });

                                    // Close modal when clicking outside
                                    modalElement.addEventListener('click', (e) => {
                                        if (e.target === modalElement) {
                                            modalElement.classList.remove('show');
                                            modalElement.style.display = 'none';
                                            document.body.classList.remove('modal-open');
                                            backdrop.remove();
                                        }
                                    });
                                } else {
                                    alert('Error: ' + data.error);
                                }
                            } catch (error) {
                                console.error('Error loading transaction details:', error);
                                alert('An error occurred while loading transaction details');
                            }
                        });
                    });
                }
                break;

            case 'reports':
                try {
                    const repResponse = await fetch('/api/admin/reports');
                    const repData = await repResponse.json();
                    
                    if (repData.success) {
                        // Check if Chart.js is loaded
                        if (typeof Chart === 'undefined') {
                            console.error('Chart.js is not loaded');
                            alert('Chart.js library is not loaded. Please check your internet connection and refresh the page.');
                            return;
                        }

                        // Remove any existing .reports-grid from #reports
                        const reportsSection = document.querySelector('#reports');
                        const oldGrid = reportsSection.querySelector('.reports-grid');
                        if (oldGrid) oldGrid.remove();

                        // Create chart containers
                        const reportsContainer = document.createElement('div');
                        reportsContainer.className = 'reports-grid';
                        
                        const chartIds = ['userGrowthChart', 'requestStatusChart', 'volunteerActivityChart'];
                        const chartTitles = ['User Growth Over Time', 'Request Status Distribution', 'Volunteer Activity'];
                        
                        chartIds.forEach((id, index) => {
                            const container = document.createElement('div');
                            container.className = 'chart-container';
                            container.innerHTML = `
                                <div class="chart-title">${chartTitles[index]}</div>
                                <canvas id="${id}" width="1000" height="600"></canvas>
                            `;
                            reportsContainer.appendChild(container);
                        });

                        // Append the new reports container
                        reportsSection.appendChild(reportsContainer);

                        // Destroy existing charts if they exist
                        chartIds.forEach(chartId => {
                            const chartElement = document.getElementById(chartId);
                            if (chartElement && chartElement.chart) {
                                chartElement.chart.destroy();
                            }
                        });

                        // Common chart options
                        const commonOptions = {
                            responsive: true,
                            maintainAspectRatio: true,
                            aspectRatio: 1.66, // 1000/600
                            plugins: {
                                legend: {
                                    position: 'bottom',
                                    labels: {
                                        boxWidth: 12,
                                        padding: 10
                                    }
                                }
                            }
                        };

                        // User Growth Chart
                        const userGrowthCtx = document.getElementById('userGrowthChart');
                        if (userGrowthCtx) {
                            new Chart(userGrowthCtx, {
                                type: 'line',
                                data: {
                                    labels: repData.reports.userGrowth.map(d => d.month),
                                    datasets: [{
                                        label: 'New Users',
                                        data: repData.reports.userGrowth.map(d => d.count),
                                        borderColor: '#4CAF50',
                                        tension: 0.1,
                                        fill: false
                                    }]
                                },
                                options: {
                                    ...commonOptions,
                                    scales: {
                                        y: {
                                            beginAtZero: true,
                                            ticks: {
                                                stepSize: 1
                                            }
                                        }
                                    }
                                }
                            });
                        }

                        // Request Status Chart
                        const requestStatusCtx = document.getElementById('requestStatusChart');
                        if (requestStatusCtx) {
                            new Chart(requestStatusCtx, {
                                type: 'pie',
                                data: {
                                    labels: repData.reports.requestStats.map(d => d.status),
                                    datasets: [{
                                        data: repData.reports.requestStats.map(d => d.count),
                                        backgroundColor: ['#4CAF50', '#2196F3', '#f44336', '#FFC107']
                                    }]
                                },
                                options: commonOptions
                            });
                        }

                        // Volunteer Activity Chart
                        const volunteerActivityCtx = document.getElementById('volunteerActivityChart');
                        if (volunteerActivityCtx) {
                            new Chart(volunteerActivityCtx, {
                                type: 'bar',
                                data: {
                                    labels: repData.reports.volunteerActivity.map(d => d.name),
                                    datasets: [{
                                        label: 'Completed Requests',
                                        data: repData.reports.volunteerActivity.map(d => d.completed_requests),
                                        backgroundColor: '#2196F3'
                                    }]
                                },
                                options: {
                                    ...commonOptions,
                                    scales: {
                                        y: {
                                            beginAtZero: true,
                                            ticks: {
                                                stepSize: 1
                                            }
                                        }
                                    }
                                }
                            });
                        }
                    } else {
                        throw new Error(repData.error || 'Failed to load reports data');
                    }
                } catch (error) {
                    console.error('Error loading reports:', error);
                    alert('Error loading reports: ' + error.message);
                }
                break;

            case 'users':
                const userResponse = await fetch('/api/admin/users');
                const userData = await userResponse.json();
                
                if (userData.success) {
                    const tbody = document.querySelector('#users-table tbody');
                    tbody.innerHTML = userData.users.map(u => `
                        <tr>
                            <td>${u.id}</td>
                            <td>${u.name}</td>
                            <td>${u.email}</td>
                            <td>${u.phone || 'N/A'}</td>
                            <td>${u.disability || 'N/A'}</td>
                            <td><span class="status-badge ${u.status || 'active'}">${u.status || 'active'}</span></td>
                            <td>${new Date(u.created_at).toLocaleDateString()}</td>
                            <td class="action-buttons">
                                <button class="btn btn-sm btn-secondary view-btn" data-id="${u.id}"><i class="fas fa-eye"></i></button>
                                <button class="btn btn-sm btn-primary edit-btn" data-id="${u.id}"><i class="fas fa-edit"></i></button>
                                <button class="btn btn-sm btn-danger delete-btn" data-id="${u.id}"><i class="fas fa-trash"></i></button>
                            </td>
                        </tr>
                    `).join('');

                    // Add event listeners to the new buttons
                    tbody.querySelectorAll('.view-btn').forEach(btn => {
                        btn.addEventListener('click', async () => {
                            const id = btn.dataset.id;
                            try {
                                const response = await fetch(`/api/admin/users/${id}`);
                                if (!response.ok) {
                                    throw new Error(`HTTP error! status: ${response.status}`);
                                }
                                const data = await response.json();
                                if (data.success) {
                                    const user = data.item;
                                    
                                    // Create and show the view modal
                                    const modalHtml = `
                                        <div class="modal fade" id="viewUserModal" tabindex="-1" role="dialog" aria-labelledby="viewUserModalLabel" aria-hidden="true">
                                            <div class="modal-dialog modal-lg" role="document">
                                                <div class="modal-content">
                                                    <div class="modal-header bg-light">
                                                        <h5 class="modal-title" id="viewUserModalLabel">User Details</h5>
                                                        <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                                                            <span aria-hidden="true">&times;</span>
                                                        </button>
                                                    </div>
                                                    <div class="modal-body">
                                                        <div class="user-details">
                                                            <div class="row">
                                                                <div class="col-md-6">
                                                                    <div class="detail-row">
                                                                        <span class="detail-label">ID:</span>
                                                                        <span class="detail-value">${user.id}</span>
                                                                    </div>
                                                                    <div class="detail-row">
                                                                        <span class="detail-label">Name:</span>
                                                                        <span class="detail-value">${user.name}</span>
                                                                    </div>
                                                                    <div class="detail-row">
                                                                        <span class="detail-label">Email:</span>
                                                                        <span class="detail-value">${user.email}</span>
                                                                    </div>
                                                                    <div class="detail-row">
                                                                        <span class="detail-label">Phone:</span>
                                                                        <span class="detail-value">${user.phone || 'N/A'}</span>
                                                                    </div>
                                                                </div>
                                                                <div class="col-md-6">
                                                                    <div class="detail-row">
                                                                        <span class="detail-label">Address:</span>
                                                                        <span class="detail-value">${user.address || 'N/A'}</span>
                                                                    </div>
                                                                    <div class="detail-row">
                                                                        <span class="detail-label">Disability:</span>
                                                                        <span class="detail-value">${user.disability || 'N/A'}</span>
                                                                    </div>
                                                                    <div class="detail-row">
                                                                        <span class="detail-label">Status:</span>
                                                                        <span class="detail-value"><span class="status-badge ${user.status || 'active'}">${user.status || 'active'}</span></span>
                                                                    </div>
                                                                    <div class="detail-row">
                                                                        <span class="detail-label">Created:</span>
                                                                        <span class="detail-value">${new Date(user.created_at).toLocaleString()}</span>
                                                                    </div>
                                                                    <div class="detail-row">
                                                                        <span class="detail-label">Last Login:</span>
                                                                        <span class="detail-value">${user.last_login ? new Date(user.last_login).toLocaleString() : 'N/A'}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div class="modal-footer bg-light">
                                                        <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    `;

                                    // Remove existing modal if any
                                    const existingModal = document.getElementById('viewUserModal');
                                    if (existingModal) {
                                        existingModal.remove();
                                    }

                                    // Add modal to body
                                    document.body.insertAdjacentHTML('beforeend', modalHtml);

                                    // Add some CSS for the details
                                    const style = document.createElement('style');
                                    style.textContent = `
                                        .user-details {
                                            padding: 20px;
                                        }
                                        .detail-row {
                                            margin-bottom: 15px;
                                            display: flex;
                                            align-items: flex-start;
                                            padding: 10px;
                                            border-bottom: 1px solid #eee;
                                        }
                                        .detail-row:last-child {
                                            border-bottom: none;
                                        }
                                        .detail-label {
                                            font-weight: 600;
                                            min-width: 120px;
                                            color: #555;
                                            font-size: 0.95em;
                                        }
                                        .detail-value {
                                            flex: 1;
                                            word-break: break-word;
                                            color: #333;
                                        }
                                        .status-badge {
                                            display: inline-block;
                                            padding: 5px 12px;
                                            border-radius: 15px;
                                            font-size: 0.85em;
                                            font-weight: 500;
                                        }
                                        .status-badge.active {
                                            background-color: #e8f5e9;
                                            color: #2e7d32;
                                        }
                                        .status-badge.inactive {
                                            background-color: #f5f5f5;
                                            color: #616161;
                                        }
                                        .status-badge.suspended {
                                            background-color: #ffebee;
                                            color: #c62828;
                                        }
                                        .modal-content {
                                            border-radius: 8px;
                                            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                                        }
                                        .modal-header {
                                            border-bottom: 1px solid #eee;
                                            padding: 15px 20px;
                                        }
                                        .modal-footer {
                                            border-top: 1px solid #eee;
                                            padding: 15px 20px;
                                        }
                                        .modal-body {
                                            padding: 0;
                                        }
                                    `;
                                    document.head.appendChild(style);

                                    // Show modal
                                    const modalElement = document.getElementById('viewUserModal');
                                    modalElement.classList.add('show');
                                    modalElement.style.display = 'block';
                                    document.body.classList.add('modal-open');
                                    
                                    // Add backdrop
                                    const backdrop = document.createElement('div');
                                    backdrop.className = 'modal-backdrop fade show';
                                    document.body.appendChild(backdrop);

                                    // Handle modal close
                                    const closeButtons = modalElement.querySelectorAll('[data-dismiss="modal"]');
                                    closeButtons.forEach(button => {
                                        button.addEventListener('click', () => {
                                            modalElement.classList.remove('show');
                                            modalElement.style.display = 'none';
                                            document.body.classList.remove('modal-open');
                                            backdrop.remove();
                                        });
                                    });

                                    // Close modal when clicking outside
                                    modalElement.addEventListener('click', (e) => {
                                        if (e.target === modalElement) {
                                            modalElement.classList.remove('show');
                                            modalElement.style.display = 'none';
                                            document.body.classList.remove('modal-open');
                                            backdrop.remove();
                                        }
                                    });
                                } else {
                                    throw new Error(data.error || 'Failed to load user details');
                                }
                            } catch (error) {
                                console.error('Error:', error);
                                alert('Error loading user details: ' + error.message);
                            }
                        });
                    });

                    tbody.querySelectorAll('.edit-btn').forEach(btn => {
                        btn.addEventListener('click', async () => {
                            const id = btn.dataset.id;
                            try {
                                const response = await fetch(`/api/admin/users/${id}`);
                                const data = await response.json();
                                if (data.success) {
                                    const user = data.item;
                                    
                                    // Create and show the edit modal
                                    const modalHtml = `
                                        <div class="modal fade" id="editUserModal" tabindex="-1" role="dialog">
                                            <div class="modal-dialog" role="document">
                                                <div class="modal-content">
                                                    <div class="modal-header">
                                                        <h5 class="modal-title">Edit User</h5>
                                                        <button type="button" class="close" data-dismiss="modal">
                                                            <span>&times;</span>
                                                        </button>
                                                    </div>
                                                    <div class="modal-body">
                                                        <form id="editUserForm">
                                                            <input type="hidden" id="editUserId" value="${user.id}">
                                                            <div class="form-group">
                                                                <label for="editUserName">Name</label>
                                                                <input type="text" class="form-control" id="editUserName" value="${user.name}" required>
                                                            </div>
                                                            <div class="form-group">
                                                                <label for="editUserEmail">Email</label>
                                                                <input type="email" class="form-control" id="editUserEmail" value="${user.email}" required>
                                                            </div>
                                                            <div class="form-group">
                                                                <label for="editUserPhone">Phone</label>
                                                                <input type="tel" class="form-control" id="editUserPhone" value="${user.phone || ''}">
                                                            </div>
                                                            <div class="form-group">
                                                                <label for="editUserAddress">Address</label>
                                                                <textarea class="form-control" id="editUserAddress">${user.address || ''}</textarea>
                                                            </div>
                                                            <div class="form-group">
                                                                <label for="editUserDisability">Disability</label>
                                                                <input type="text" class="form-control" id="editUserDisability" value="${user.disability || ''}">
                                                            </div>
                                                            <div class="form-group">
                                                                <label for="editUserStatus">Status</label>
                                                                <select class="form-control" id="editUserStatus">
                                                                    <option value="active" ${user.status === 'active' ? 'selected' : ''}>Active</option>
                                                                    <option value="inactive" ${user.status === 'inactive' ? 'selected' : ''}>Inactive</option>
                                                                    <option value="suspended" ${user.status === 'suspended' ? 'selected' : ''}>Suspended</option>
                                                                </select>
                                                            </div>
                                                        </form>
                                                    </div>
                                                    <div class="modal-footer">
                                                        <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
                                                        <button type="button" class="btn btn-primary" id="saveUserChanges">Save changes</button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    `;

                                    // Remove existing modal if any
                                    const existingModal = document.getElementById('editUserModal');
                                    if (existingModal) {
                                        existingModal.remove();
                                    }

                                    // Add modal to body
                                    document.body.insertAdjacentHTML('beforeend', modalHtml);

                                    // Show modal
                                    const modalElement = document.getElementById('editUserModal');
                                    modalElement.classList.add('show');
                                    modalElement.style.display = 'block';
                                    document.body.classList.add('modal-open');
                                    
                                    // Add backdrop
                                    const backdrop = document.createElement('div');
                                    backdrop.className = 'modal-backdrop fade show';
                                    document.body.appendChild(backdrop);

                                    // Handle modal close
                                    const closeButtons = modalElement.querySelectorAll('[data-dismiss="modal"]');
                                    closeButtons.forEach(button => {
                                        button.addEventListener('click', () => {
                                            modalElement.classList.remove('show');
                                            modalElement.style.display = 'none';
                                            document.body.classList.remove('modal-open');
                                            backdrop.remove();
                                        });
                                    });

                                    // Close modal when clicking outside
                                    modalElement.addEventListener('click', (e) => {
                                        if (e.target === modalElement) {
                                            modalElement.classList.remove('show');
                                            modalElement.style.display = 'none';
                                            document.body.classList.remove('modal-open');
                                            backdrop.remove();
                                        }
                                    });

                                    // Handle save changes
                                    document.getElementById('saveUserChanges').addEventListener('click', async () => {
                                        const updatedUser = {
                                            name: document.getElementById('editUserName').value,
                                            email: document.getElementById('editUserEmail').value,
                                            phone: document.getElementById('editUserPhone').value,
                                            address: document.getElementById('editUserAddress').value,
                                            disability: document.getElementById('editUserDisability').value,
                                            status: document.getElementById('editUserStatus').value
                                        };

                                        try {
                                            const updateResponse = await fetch(`/api/admin/users/${id}`, {
                                                method: 'PUT',
                                                headers: {
                                                    'Content-Type': 'application/json'
                                                },
                                                body: JSON.stringify(updatedUser)
                                            });

                                            const updateData = await updateResponse.json();
                                            if (updateData.success) {
                                                // Update the row in the table
                                                const row = btn.closest('tr');
                                                row.querySelector('td:nth-child(2)').textContent = updatedUser.name;
                                                row.querySelector('td:nth-child(3)').textContent = updatedUser.email;
                                                row.querySelector('td:nth-child(4)').textContent = updatedUser.phone || 'N/A';
                                                row.querySelector('td:nth-child(5)').textContent = updatedUser.disability || 'N/A';
                                                row.querySelector('td:nth-child(6)').innerHTML = `<span class="status-badge ${updatedUser.status}">${updatedUser.status}</span>`;

                                                // Close modal
                                                modalElement.classList.remove('show');
                                                modalElement.style.display = 'none';
                                                document.body.classList.remove('modal-open');
                                                backdrop.remove();
                                                
                                                alert('User updated successfully');
                                            } else {
                                                alert('Error: ' + updateData.error);
                                            }
                                        } catch (error) {
                                            alert('An error occurred while updating the user');
                                        }
                                    });
                                } else {
                                    alert('Error: ' + data.error);
                                }
                            } catch (error) {
                                alert('An error occurred while loading user details');
                            }
                        });
                    });

                    tbody.querySelectorAll('.delete-btn').forEach(btn => {
                        btn.addEventListener('click', async () => {
                            const id = btn.dataset.id;
                            const row = btn.closest('tr');
                            const name = row.querySelector('td:nth-child(2)').textContent;
                            
                            if (confirm(`Are you sure you want to delete user: ${name}?`)) {
                                try {
                                    const response = await fetch(`/api/admin/users/${id}`, {
                                        method: 'DELETE'
                                    });
                                    const data = await response.json();
                                    if (data.success) {
                                        row.remove();
                                        alert('User deleted successfully');
                                    } else {
                                        alert('Error: ' + data.error);
                                    }
                                } catch (error) {
                                    alert('An error occurred while deleting the user');
                                }
                            }
                        });
                    });
                }
                break;
        }
    } catch (error) {
        console.error('Error loading tab data:', error);
        alert('An error occurred while loading data. Please try again.');
    }
} 