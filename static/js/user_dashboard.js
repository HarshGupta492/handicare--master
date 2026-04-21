// Load feedback data
function loadFeedback() {
    fetch('/api/feedback')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const tbody = document.getElementById('feedbackTableBody');
                tbody.innerHTML = '';
                
                data.feedback.forEach(feedback => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${feedback.volunteer_name}</td>
                        <td>
                            <div class="rating">
                                ${Array(5).fill().map((_, i) => 
                                    `<i class="fas fa-star${i < feedback.rating ? '' : '-o'}"></i>`
                                ).join('')}
                                <span>${feedback.rating.toFixed(1)}</span>
                            </div>
                        </td>
                        <td>${feedback.comment}</td>
                        <td>${new Date(feedback.created_at).toLocaleDateString()}</td>
                        <td>${feedback.is_public ? 'Public' : 'Private'}</td>
                        <td>
                            <button class="btn btn-secondary btn-sm" onclick="editFeedback(${feedback.id})">
                                <i class="fas fa-edit"></i> Edit
                            </button>
                            <button class="btn btn-danger btn-sm" onclick="deleteFeedback(${feedback.id})">
                                <i class="fas fa-trash"></i> Delete
                            </button>
                        </td>
                    `;
                    tbody.appendChild(row);
                });
            }
        })
        .catch(error => {
            console.error('Error loading feedback:', error);
            alert('Error loading feedback. Please try again.');
        });
}

// Edit feedback
function editFeedback(id) {
    window.location.href = `add_feedback.html?id=${id}`;
}

// Delete feedback
function deleteFeedback(id) {
    if (confirm('Are you sure you want to delete this feedback?')) {
        fetch(`/api/feedback/${id}`, {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                loadFeedback();
            } else {
                alert('Error deleting feedback: ' + data.error);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error deleting feedback. Please try again.');
        });
    }
}

// Load feedback when the feedback tab is clicked
document.querySelector('a[data-tab="feedback"]').addEventListener('click', function(e) {
    e.preventDefault();
    document.querySelectorAll('.dashboard-tab').forEach(tab => tab.classList.remove('active'));
    document.getElementById('feedback').classList.add('active');
    document.querySelectorAll('.dashboard-nav a').forEach(link => link.classList.remove('active'));
    this.classList.add('active');
    loadFeedback();
});

// Payment modal logic
function setupPaymentModal() {
    const modal = document.getElementById('payment-modal');
    const closeBtn = document.getElementById('close-payment-modal');
    const paymentForm = document.getElementById('payment-form');
    const paymentMessage = document.getElementById('payment-message');

    closeBtn.onclick = function() {
        modal.style.display = 'none';
        paymentMessage.textContent = '';
        paymentForm.reset();
    };
    window.onclick = function(event) {
        if (event.target === modal) {
            modal.style.display = 'none';
            paymentMessage.textContent = '';
            paymentForm.reset();
        }
    };
    paymentForm.onsubmit = async function(e) {
        e.preventDefault();
        const requestId = document.getElementById('payment-request-id').value;
        const amount = document.getElementById('payment-amount').value;
        const method = document.getElementById('payment-method').value;
        paymentMessage.textContent = '';
        try {
            const response = await fetch('/api/payments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ request_id: requestId, amount, method })
            });
            const result = await response.json();
            if (result.success) {
                paymentMessage.textContent = 'Payment successful!';
                paymentMessage.style.color = 'green';
                setTimeout(() => { modal.style.display = 'none'; location.reload(); }, 1200);
            } else {
                paymentMessage.textContent = result.error || 'Payment failed.';
                paymentMessage.style.color = 'red';
            }
        } catch (err) {
            paymentMessage.textContent = 'Payment failed. Please try again.';
            paymentMessage.style.color = 'red';
        }
    };
}

// Add Pay Now button to completed requests and set up modal
function addPayNowButtons() {
    document.querySelectorAll('.request-card[data-status="completed"]').forEach(card => {
        // Only add if not already present
        if (!card.querySelector('.pay-now-btn')) {
            const payBtn = document.createElement('button');
            payBtn.className = 'btn btn-success btn-sm pay-now-btn';
            payBtn.innerHTML = '<i class="fas fa-rupee-sign"></i> Pay Now';
            payBtn.onclick = function() {
                document.getElementById('payment-request-id').value = card.getAttribute('data-id');
                document.getElementById('payment-modal').style.display = 'block';
            };
            card.querySelector('.request-actions').appendChild(payBtn);
        }
    });
}

// Call these after loading requests
setupPaymentModal();
addPayNowButtons(); 