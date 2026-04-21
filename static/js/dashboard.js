document.addEventListener("DOMContentLoaded", () => {
  // Tab Switching
  const tabLinks = document.querySelectorAll(".dashboard-nav a");
  const tabContents = document.querySelectorAll(".dashboard-tab");

  if (tabLinks.length > 0) {
    tabLinks.forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        const target = link.getAttribute("data-tab");

        // Update active tab link
        tabLinks.forEach((l) => l.classList.remove("active"));
        link.classList.add("active");

        // Show target tab content
        tabContents.forEach((content) => {
          if (content.id === target) {
            content.classList.add("active");
          } else {
            content.classList.remove("active");
          }
        });

        // Load appropriate content based on tab
        if (target === "available-requests") {
          loadAvailableRequests();
        } else if (target === "my-assignments") {
          loadAssignedRequests();
        }
      });
    });
  }

  // Load user profile
  async function loadProfile() {
    try {
      const response = await fetch('/api/profile');
      const data = await response.json();

      if (data.success) {
        const user = data.user;
        document.getElementById('user-name').textContent = user.name;
        document.getElementById('sidebar-user-name').textContent = user.name;
        document.getElementById('user-email').textContent = user.email;

        // Fill profile form
        const profileForm = document.getElementById('profile-form');
        if (profileForm) {
          profileForm.querySelector('[name="name"]').value = user.name;
          profileForm.querySelector('[name="email"]').value = user.email;
          profileForm.querySelector('[name="phone"]').value = user.phone;
          profileForm.querySelector('[name="address"]').value = user.address;
          profileForm.querySelector('[name="disability"]').value = user.disability || '';
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  }

  // Load emergency contacts
  async function loadEmergencyContacts() {
    try {
      const response = await fetch('/api/emergency_contacts');
      const data = await response.json();

      if (data.success) {
        const contactsList = document.querySelector('#emergency-contacts .contacts-list');
        if (contactsList) {
          contactsList.innerHTML = data.contacts.map(contact => `
            <div class="contact-card" data-id="${contact.id}">
              <div class="contact-info">
                <h4>${contact.name}</h4>
                <p><i class="fas fa-user"></i> Relationship: <span>${contact.relationship}</span></p>
                <p><i class="fas fa-phone"></i> Phone: <span>${contact.phone}</span></p>
                ${contact.email ? `<p><i class="fas fa-envelope"></i> Email: <span>${contact.email}</span></p>` : ''}
              </div>
              <div class="contact-actions">
                <button class="btn btn-danger btn-sm"><i class="fas fa-trash"></i> Delete</button>
              </div>
            </div>
          `).join('');

          // Add event listeners for delete buttons
          const deleteButtons = contactsList.querySelectorAll('.btn-danger');
          deleteButtons.forEach(btn => {
            btn.addEventListener('click', async () => {
              const card = btn.closest('.contact-card');
              const contactId = card.getAttribute('data-id');

              if (confirm('Are you sure you want to delete this contact?')) {
                try {
                  const response = await fetch(`/api/emergency_contacts/${contactId}`, {
                    method: 'DELETE'
                  });
                  const result = await response.json();

                  if (result.success) {
                    card.remove();
                  } else {
                    alert('Error deleting contact: ' + result.error);
                  }
                } catch (error) {
                  console.error('Error:', error);
                  alert('An error occurred while deleting the contact');
                }
              }
            });
          });
        }
      }
    } catch (error) {
      console.error('Error loading emergency contacts:', error);
    }
  }

  // Load user feedback
  async function loadFeedback() {
    try {
      const response = await fetch('/api/feedback');
      const data = await response.json();

      if (data.success) {
        const feedbackList = document.querySelector('#feedback .feedback-list');
        if (feedbackList) {
          feedbackList.innerHTML = data.feedback.map(feedback => `
            <div class="feedback-card">
              <div class="feedback-header">
                <div class="volunteer-info">
                  <h4>${feedback.volunteer_name}</h4>
                  <div class="rating">
                    ${Array(feedback.rating).fill('<i class="fas fa-star"></i>').join('')}
                    ${Array(5 - feedback.rating).fill('<i class="far fa-star"></i>').join('')}
                  </div>
                </div>
                <div class="feedback-date">
                  ${new Date(feedback.created_at).toLocaleDateString()}
                </div>
              </div>
              <div class="feedback-comment">
                <p>${feedback.comment}</p>
              </div>
            </div>
          `).join('');
        }
      }
    } catch (error) {
      console.error('Error loading feedback:', error);
    }
  }

  // Load help requests
  async function loadHelpRequests() {
    try {
      const response = await fetch('/api/help_requests');
      const data = await response.json();

      if (data.success) {
        const requestsList = document.querySelector('#help-requests .requests-list');
        if (requestsList) {
          requestsList.innerHTML = data.requests.map(request => `
            <div class="request-card" data-id="${request.id}" data-status="${request.status}">
              <div class="request-header">
                <h4>${request.title}</h4>
                <span class="status-badge ${request.status}">${request.status}</span>
              </div>
              <div class="request-details">
                <p><i class="fas fa-calendar"></i> Date: ${new Date(request.date).toLocaleDateString()}</p>
                <p><i class="fas fa-clock"></i> Time: ${request.time}</p>
                <p><i class="fas fa-hourglass-half"></i> Duration: ${request.duration} hours</p>
                <p><i class="fas fa-map-marker-alt"></i> Location: ${request.location}</p>
                ${request.volunteer_name ? `<p><i class="fas fa-user"></i> Volunteer: ${request.volunteer_name}</p>` : ''}
              </div>
              <div class="request-description">
                <p>${request.description}</p>
              </div>
              <div class="request-actions">
                ${request.status === 'pending' ? `
                  <button class="btn btn-danger btn-sm cancel-request"><i class="fas fa-times"></i> Cancel Request</button>
                ` : ''}
              </div>
            </div>
          `).join('');

          // Add event listeners for cancel buttons
          const cancelButtons = requestsList.querySelectorAll('.cancel-request');
          cancelButtons.forEach(btn => {
            btn.addEventListener('click', async () => {
              const card = btn.closest('.request-card');
              const requestId = card.getAttribute('data-id');

              if (confirm('Are you sure you want to cancel this request?')) {
                try {
                  const response = await fetch(`/api/help_requests/${requestId}`, {
                    method: 'PUT',
                    headers: {
                      'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ status: 'cancelled' })
                  });
                  const result = await response.json();

                  if (result.success) {
                    card.querySelector('.status-badge').textContent = 'cancelled';
                    card.setAttribute('data-status', 'cancelled');
                    btn.remove();
                  } else {
                    alert('Error cancelling request: ' + result.error);
                  }
                } catch (error) {
                  console.error('Error:', error);
                  alert('An error occurred while cancelling the request');
                }
              }
            });
          });
          // Add Pay Now buttons for completed requests
          if (typeof addPayNowButtons === 'function') {
            addPayNowButtons();
          }
        }
      }
    } catch (error) {
      console.error('Error loading help requests:', error);
    }
  }

  // Load available help requests for volunteers
  async function loadAvailableRequests() {
    try {
      const response = await fetch('/api/volunteer/available-requests');
      const data = await response.json();

      const requestsList = document.querySelector('#available-requests .requests-list');
      if (data.success && requestsList) {
        requestsList.innerHTML = data.requests.map(request => `
          <div class="request-card" data-id="${request.id}">
            <div class="request-header">
              <h4>${request.title}</h4>
              <span class="status-badge pending">Pending</span>
            </div>
            <div class="request-details">
              <p><i class="fas fa-calendar"></i> Date: ${new Date(request.date).toLocaleDateString()}</p>
              <p><i class="fas fa-clock"></i> Time: ${request.time}</p>
              <p><i class="fas fa-hourglass-half"></i> Duration: ${request.duration} hours</p>
              <p><i class="fas fa-map-marker-alt"></i> Location: ${request.location}</p>
              <p><i class="fas fa-user"></i> Requester: ${request.requester.name}</p>
            </div>
            <div class="request-description">
              <p>${request.description}</p>
            </div>
            <div class="request-actions">
              <button class="btn btn-primary btn-sm accept-request">Accept Request</button>
              <button class="btn btn-success btn-sm mark-complete">Mark Complete</button>
            </div>
          </div>
        `).join('');

        // Add event listeners for accept buttons
        const acceptButtons = requestsList.querySelectorAll('.accept-request');
        acceptButtons.forEach(btn => {
          btn.addEventListener('click', async () => {
            const card = btn.closest('.request-card');
            const requestId = card.getAttribute('data-id');
            if (confirm('Are you sure you want to accept this request?')) {
              try {
                const response = await fetch(`/api/volunteer/accept-request/${requestId}`, {
                  method: 'POST'
                });
                const result = await response.json();
                if (result.success) {
                  alert('Request accepted successfully!');
                  loadAvailableRequests(); // Refresh the list
                } else {
                  alert('Error accepting request: ' + result.error);
                }
              } catch (error) {
                console.error('Error:', error);
                alert('An error occurred. Please try again.');
              }
            }
          });
        });

        // Add event listeners for mark complete buttons
        const markCompleteButtons = requestsList.querySelectorAll('.mark-complete');
        markCompleteButtons.forEach(btn => {
          btn.addEventListener('click', async () => {
            const card = btn.closest('.request-card');
            const requestId = card.getAttribute('data-id');
            if (confirm('Are you sure you want to mark this request as completed?')) {
              try {
                const response = await fetch(`/api/volunteer/help-requests/${requestId}`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ status: 'completed' })
                });
                const result = await response.json();
                if (result.success) {
                  alert('Request marked as completed!');
                  loadAvailableRequests();
                } else {
                  alert('Error: ' + result.error);
                }
              } catch (error) {
                console.error('Error:', error);
                alert('An error occurred. Please try again.');
              }
            }
          });
        });
      }
    } catch (error) {
      console.error('Error loading available requests:', error);
    }
  }

  // Load assigned help requests for volunteers
  async function loadAssignedRequests() {
    try {
      const response = await fetch('/api/volunteer/assigned-requests');
      const data = await response.json();

      const requestsList = document.querySelector('#my-assignments .requests-list');
      if (data.success && requestsList) {
        requestsList.innerHTML = data.requests.map(request => `
          <div class="request-card" data-id="${request.id}" data-status="${request.status}">
            <div class="request-header">
              <h4>${request.title}</h4>
              <span class="status-badge ${request.status}">${request.status}</span>
            </div>
            <div class="request-details">
              <p><i class="fas fa-calendar"></i> Date: ${new Date(request.date).toLocaleDateString()}</p>
              <p><i class="fas fa-clock"></i> Time: ${request.time}</p>
              <p><i class="fas fa-hourglass-half"></i> Duration: ${request.duration} hours</p>
              <p><i class="fas fa-map-marker-alt"></i> Location: ${request.location}</p>
              <p><i class="fas fa-user"></i> Requester: ${request.requester.name}</p>
              <p><i class="fas fa-phone"></i> Phone: ${request.requester.phone}</p>
              <p><i class="fas fa-envelope"></i> Email: ${request.requester.email}</p>
            </div>
            <div class="request-description">
              <p>${request.description}</p>
            </div>
            <div class="request-actions">
              ${request.status !== 'completed' ? `
                <button class="btn btn-success btn-sm mark-complete">Mark Complete</button>
              ` : ''}
            </div>
          </div>
        `).join('');

        // Add event listeners for mark complete buttons
        const markCompleteButtons = requestsList.querySelectorAll('.mark-complete');
        markCompleteButtons.forEach(btn => {
          btn.addEventListener('click', async () => {
            const card = btn.closest('.request-card');
            const requestId = card.getAttribute('data-id');
            if (confirm('Are you sure you want to mark this request as completed?')) {
              try {
                const response = await fetch(`/api/volunteer/help-requests/${requestId}`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ status: 'completed' })
                });
                const result = await response.json();
                if (result.success) {
                  alert('Request marked as completed!');
                  loadAssignedRequests();
                  if (typeof loadCompletedTasks === 'function') {
                    loadCompletedTasks();
                  } else {
                    window.location.reload();
                  }
                } else {
                  alert('Error: ' + result.error);
                }
              } catch (error) {
                console.error('Error:', error);
                alert('An error occurred. Please try again.');
              }
            }
          });
        });
      }
    } catch (error) {
      console.error('Error loading assigned requests:', error);
    }
  }

  // Profile form submission
  const profileForm = document.getElementById('profile-form');
  if (profileForm) {
    profileForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const formData = new FormData(profileForm);
      const data = {
        name: formData.get('name'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        address: formData.get('address'),
        disability: formData.get('disability'),
      };

      if (formData.get('new-password')) {
        data.currentPassword = formData.get('current-password');
        data.newPassword = formData.get('new-password');
      }

      try {
        const response = await fetch('/api/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
        });

        const result = await response.json();

        if (result.success) {
          alert('Profile updated successfully!');
          loadProfile();
        } else {
          alert('Error updating profile: ' + result.error);
        }
      } catch (error) {
        console.error('Error:', error);
        alert('An error occurred while updating the profile');
      }
    });
  }

  // New request form submission
  const newRequestForm = document.getElementById('new-request-form');
  if (newRequestForm) {
    newRequestForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const formData = new FormData(newRequestForm);
      const data = {
        title: formData.get('title'),
        type: formData.get('type'),
        date: formData.get('date'),
        time: formData.get('time'),
        duration: formData.get('duration'),
        location: formData.get('location'),
        description: formData.get('description'),
        is_urgent: formData.get('is_urgent') === 'on'
      };

      try {
        const response = await fetch('/api/help_requests', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
        });

        const result = await response.json();

        if (result.success) {
          alert('Help request created successfully!');
          newRequestForm.reset();
          loadHelpRequests();
          const modal = document.getElementById('request-modal');
          if (modal) {
            modal.classList.remove('active');
          }
        } else {
          alert('Error creating help request: ' + result.error);
        }
      } catch (error) {
        console.error('Error:', error);
        alert('An error occurred while creating the help request');
      }
    });
  }

  // Add emergency contact
  const addContactBtn = document.getElementById('add-contact-btn');
  if (addContactBtn) {
    addContactBtn.addEventListener('click', async () => {
      const name = prompt('Contact Name:');
      if (!name) return;

      const relationship = prompt('Relationship:');
      if (!relationship) return;

      const phone = prompt('Phone Number:');
      if (!phone) return;

      const email = prompt('Email (optional):');

      try {
        const response = await fetch('/api/emergency_contacts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name,
            relationship,
            phone,
            email
          })
        });

        const result = await response.json();

        if (result.success) {
          loadEmergencyContacts();
        } else {
          alert('Error adding contact: ' + result.error);
        }
      } catch (error) {
        console.error('Error:', error);
        alert('An error occurred while adding the contact');
      }
    });
  }

  // Load initial data
  loadProfile();
  loadEmergencyContacts();
  loadFeedback();
  loadHelpRequests();

  // Load assigned requests if my-assignments tab is active
  if (document.querySelector('#my-assignments.active')) {
    loadAssignedRequests();
  }

  // Request filtering
  const statusFilter = document.getElementById('status-filter');
  const dateFilter = document.getElementById('date-filter');

  function filterRequests() {
    const status = statusFilter ? statusFilter.value : 'all';
    const dateRange = dateFilter ? dateFilter.value : 'all';
    const cards = document.querySelectorAll('.request-card');

    cards.forEach(card => {
      let show = true;

      // Filter by status
      if (status !== 'all') {
        show = card.getAttribute('data-status') === status;
      }

      // Filter by date
      if (show && dateRange !== 'all') {
        const requestDate = new Date(card.querySelector('.request-details p:first-child').textContent.split(': ')[1]);
        const today = new Date();
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

        switch (dateRange) {
          case 'today':
            show = requestDate.toDateString() === today.toDateString();
            break;
          case 'week':
            show = requestDate >= weekAgo;
            break;
          case 'month':
            show = requestDate >= monthAgo;
            break;
        }
      }

      card.style.display = show ? 'block' : 'none';
    });
  }

  if (statusFilter) {
    statusFilter.addEventListener('change', filterRequests);
  }

  if (dateFilter) {
    dateFilter.addEventListener('change', filterRequests);
  }

  // Optionally, load available requests on page load if the tab is active
  if (document.querySelector('#available-requests .requests-list')) {
    loadAvailableRequests();
  }

  // Load completed tasks for volunteers
  async function loadCompletedTasks() {
    try {
      const response = await fetch('/api/volunteer/assigned-requests');
      const data = await response.json();

      const completedList = document.querySelector('#completed-tasks .requests-list');
      if (data.success && completedList) {
        completedList.innerHTML = data.requests
          .filter(request => request.status === 'completed')
          .map(request => `
            <div class="request-card" data-id="${request.id}" data-status="${request.status}">
              <div class="request-header">
                <h4>${request.title}</h4>
                <span class="status-badge completed">Completed</span>
              </div>
              <div class="request-details">
                <p><i class="fas fa-calendar"></i> Date: ${new Date(request.date).toLocaleDateString()}</p>
                <p><i class="fas fa-clock"></i> Time: ${request.time}</p>
                <p><i class="fas fa-hourglass-half"></i> Duration: ${request.duration} hours</p>
                <p><i class="fas fa-map-marker-alt"></i> Location: ${request.location}</p>
                <p><i class="fas fa-user"></i> Requester: ${request.requester.name}</p>
              </div>
              <div class="request-description">
                <p>${request.description}</p>
              </div>
            </div>
          `).join('');
      }
    } catch (error) {
      console.error('Error loading completed tasks:', error);
    }
  }

  // On page load, if completed-tasks tab is active, load completed tasks
  if (document.querySelector('#completed-tasks.active')) {
    loadCompletedTasks();
  }
}); 