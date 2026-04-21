document.addEventListener('DOMContentLoaded', function() {
    const feedbackForm = document.getElementById('feedback-form');
    const feedbackType = document.getElementById('feedback-type');
    const volunteerSelect = document.querySelector('.volunteer-select');
    const ratingGroup = document.querySelector('.rating-group');
    const feedbackList = document.querySelector('.feedback-list');
    const feedbackSort = document.getElementById('feedback-sort');
    const starRating = document.querySelector('.star-rating');
    const pagination = document.querySelector('.pagination');
    const submitButton = document.querySelector('.btn-primary');
    const feedbackCards = document.querySelectorAll('.feedback-card');
    const itemsPerPage = 4;
    let currentPage = 1;
    let totalPages = Math.ceil(feedbackCards.length / itemsPerPage);

    // Initialize star rating
    if (starRating) {
        const stars = starRating.querySelectorAll('input[type="radio"]');
        const labels = starRating.querySelectorAll('label');
        
        // Handle star hover
        labels.forEach((label, index) => {
            label.addEventListener('mouseover', () => {
                // Reset all stars
                labels.forEach(l => l.querySelector('i').className = 'far fa-star');
                // Fill stars up to hovered star
                for (let i = 0; i <= index; i++) {
                    labels[i].querySelector('i').className = 'fas fa-star';
                }
            });

            label.addEventListener('mouseout', () => {
                const checkedStar = starRating.querySelector('input[type="radio"]:checked');
                if (checkedStar) {
                    const checkedIndex = Array.from(stars).indexOf(checkedStar);
                    // Reset all stars
                    labels.forEach(l => l.querySelector('i').className = 'far fa-star');
                    // Fill stars up to checked star
                    for (let i = 0; i <= checkedIndex; i++) {
                        labels[i].querySelector('i').className = 'fas fa-star';
                    }
                } else {
                    // Reset all stars to empty
                    labels.forEach(l => l.querySelector('i').className = 'far fa-star');
                }
            });
        });

        // Handle star click
        stars.forEach((star, index) => {
            star.addEventListener('change', () => {
                // Reset all stars
                labels.forEach(l => l.querySelector('i').className = 'far fa-star');
                // Fill stars up to clicked star
                for (let i = 0; i <= index; i++) {
                    labels[i].querySelector('i').className = 'fas fa-star';
                }
            });
        });
    }

    // Show/hide volunteer selection and rating based on feedback type
    feedbackType.addEventListener('change', function() {
        if (this.value === 'volunteer') {
            volunteerSelect.style.display = 'block';
            ratingGroup.style.display = 'block';
        } else {
            volunteerSelect.style.display = 'none';
            ratingGroup.style.display = 'none';
        }
    });

    // Handle form submission
    feedbackForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Validate form
        if (!validateForm()) {
            return;
        }

        const formData = {
            name: document.getElementById('feedback-name').value,
            email: document.getElementById('feedback-email').value,
            type: feedbackType.value,
            volunteer: document.getElementById('feedback-volunteer').value,
            rating: document.querySelector('input[name="rating"]:checked')?.value || null,
            comments: document.getElementById('feedback-comments').value,
            public: document.getElementById('feedback-public').checked,
            date: new Date().toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            })
        };

        // Add new feedback to the list
        addFeedbackToDOM(formData);
        
        // Reset form
        feedbackForm.reset();
        volunteerSelect.style.display = 'none';
        ratingGroup.style.display = 'none';
        
        // Reset star rating
        if (starRating) {
            const labels = starRating.querySelectorAll('label');
            labels.forEach(l => l.querySelector('i').className = 'far fa-star');
        }

        // Update pagination
        updatePagination();
        
        // Show success message
        showMessage('Feedback submitted successfully!', 'success');
    });

    // Handle sorting
    feedbackSort.addEventListener('change', function() {
        const feedbackCards = Array.from(document.querySelectorAll('.feedback-card'));
        
        feedbackCards.sort((a, b) => {
            const ratingA = parseFloat(a.querySelector('.rating span')?.textContent || 0);
            const ratingB = parseFloat(b.querySelector('.rating span')?.textContent || 0);
            
            switch(this.value) {
                case 'highest':
                    return ratingB - ratingA;
                case 'lowest':
                    return ratingA - ratingB;
                default:
                    return 0; // Keep original order for 'recent'
            }
        });

        feedbackList.innerHTML = '';
        feedbackCards.forEach(card => feedbackList.appendChild(card));
        
        // Reset to first page after sorting
        currentPage = 1;
        updatePagination();
        showPage(currentPage);
    });

    // Handle pagination
    if (pagination) {
        pagination.addEventListener('click', function(e) {
            const button = e.target.closest('.pagination-btn');
            if (!button) return;

            if (button.classList.contains('active')) return;

            if (button.querySelector('i.fa-chevron-left')) {
                if (currentPage > 1) {
                    currentPage--;
                    showPage(currentPage);
                }
            } else if (button.querySelector('i.fa-chevron-right')) {
                if (currentPage < totalPages) {
                    currentPage++;
                    showPage(currentPage);
                }
            } else {
                const page = parseInt(button.textContent);
                if (page && page !== currentPage) {
                    currentPage = page;
                    showPage(currentPage);
                }
            }

            updatePagination();
        });
    }

    // Function to show a specific page
    function showPage(page) {
        const feedbackCards = document.querySelectorAll('.feedback-card');
        const start = (page - 1) * itemsPerPage;
        const end = start + itemsPerPage;

        feedbackCards.forEach((card, index) => {
            if (index >= start && index < end) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    }

    // Function to update pagination buttons
    function updatePagination() {
        const feedbackCards = document.querySelectorAll('.feedback-card');
        totalPages = Math.ceil(feedbackCards.length / itemsPerPage);
        
        const paginationButtons = pagination.querySelectorAll('.pagination-btn');
        paginationButtons.forEach(button => {
            if (button.querySelector('i.fa-chevron-left')) {
                button.disabled = currentPage === 1;
            } else if (button.querySelector('i.fa-chevron-right')) {
                button.disabled = currentPage === totalPages;
            } else {
                const page = parseInt(button.textContent);
                button.classList.toggle('active', page === currentPage);
            }
        });
    }

    // Function to validate form
    function validateForm() {
        const name = document.getElementById('feedback-name').value.trim();
        const email = document.getElementById('feedback-email').value.trim();
        const type = feedbackType.value;
        const comments = document.getElementById('feedback-comments').value.trim();
        const volunteer = document.getElementById('feedback-volunteer').value;
        const rating = document.querySelector('input[name="rating"]:checked')?.value;

        if (!name) {
            showMessage('Please enter your name', 'error');
            return false;
        }

        if (!email) {
            showMessage('Please enter your email', 'error');
            return false;
        }

        if (!isValidEmail(email)) {
            showMessage('Please enter a valid email address', 'error');
            return false;
        }

        if (!type) {
            showMessage('Please select a feedback type', 'error');
            return false;
        }

        if (type === 'volunteer' && !volunteer) {
            showMessage('Please select a volunteer', 'error');
            return false;
        }

        if (type === 'volunteer' && !rating) {
            showMessage('Please provide a rating', 'error');
            return false;
        }

        if (!comments) {
            showMessage('Please enter your feedback comments', 'error');
            return false;
        }

        return true;
    }

    // Function to show messages
    function showMessage(message, type) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        messageDiv.textContent = message;

        const container = document.querySelector('.feedback-section .container');
        container.insertBefore(messageDiv, container.firstChild);

        setTimeout(() => {
            messageDiv.remove();
        }, 3000);
    }

    // Function to validate email
    function isValidEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    // Function to add new feedback to DOM
    function addFeedbackToDOM(feedback) {
        const feedbackCard = document.createElement('div');
        feedbackCard.className = 'feedback-card';
        
        const stars = feedback.rating ? generateStars(feedback.rating) : '';
        
        feedbackCard.innerHTML = `
            <div class="feedback-header">
                <div class="volunteer-info">
                    <div class="volunteer-avatar">
                        <i class="fas fa-user-circle"></i>
                    </div>
                    <div class="volunteer-data">
                        <p class="volunteer-name">${feedback.volunteer ? getVolunteerName(feedback.volunteer) : 'General Feedback'}</p>
                    </div>
                </div>
                ${feedback.rating ? `
                <div class="rating">
                    ${stars}
                    <span>${feedback.rating}</span>
                </div>
                ` : ''}
            </div>
            <div class="feedback-comment">
                <p>"${feedback.comments}"</p>
            </div>
            <div class="feedback-footer">
                <p class="feedback-author">- ${feedback.public ? feedback.name : 'Anonymous'}</p>
                <p class="feedback-date">${feedback.date}</p>
            </div>
        `;

        feedbackList.insertBefore(feedbackCard, feedbackList.firstChild);
    }

    // Helper function to generate star icons
    function generateStars(rating) {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 !== 0;
        let stars = '';
        
        for (let i = 0; i < 5; i++) {
            if (i < fullStars) {
                stars += '<i class="fas fa-star"></i>';
            } else if (i === fullStars && hasHalfStar) {
                stars += '<i class="fas fa-star-half-alt"></i>';
            } else {
                stars += '<i class="far fa-star"></i>';
            }
        }
        
        return stars;
    }

    // Helper function to get volunteer name
    function getVolunteerName(id) {
        const volunteers = {
            '1': 'Sarah Johnson',
            '2': 'Michael Brown',
            '3': 'Emily Davis',
            '4': 'David Wilson'
        };
        return volunteers[id] || 'Unknown Volunteer';
    }

    // Initialize pagination
    updatePagination();
    showPage(currentPage);

    // Testimonials Slider
    const testimonials = document.querySelectorAll('.testimonial');
    const dots = document.querySelectorAll('.dot');
    const prevBtn = document.querySelector('.prev-btn');
    const nextBtn = document.querySelector('.next-btn');
    let currentSlide = 0;
    let slideInterval;

    // Initialize first slide
    testimonials[0].classList.add('active');
    dots[0].classList.add('active');

    function showSlide(index) {
        testimonials.forEach((testimonial, i) => {
            testimonial.classList.remove('active', 'prev');
            if (i === index) {
                testimonial.classList.add('active');
            } else if (i === (index - 1 + testimonials.length) % testimonials.length) {
                testimonial.classList.add('prev');
            }
        });

        dots.forEach((dot, i) => {
            dot.classList.toggle('active', i === index);
        });

        currentSlide = index;
    }

    function nextSlide() {
        showSlide((currentSlide + 1) % testimonials.length);
    }

    function prevSlide() {
        showSlide((currentSlide - 1 + testimonials.length) % testimonials.length);
    }

    function startAutoSlide() {
        slideInterval = setInterval(nextSlide, 5000);
    }

    function stopAutoSlide() {
        clearInterval(slideInterval);
    }

    // Event Listeners
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            stopAutoSlide();
            nextSlide();
            startAutoSlide();
        });
    }

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            stopAutoSlide();
            prevSlide();
            startAutoSlide();
        });
    }

    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            stopAutoSlide();
            showSlide(index);
            startAutoSlide();
        });
    });

    // Touch events for mobile
    let touchStartX = 0;
    let touchEndX = 0;

    const testimonialsContainer = document.querySelector('.testimonials-container');
    if (testimonialsContainer) {
        testimonialsContainer.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        });

        testimonialsContainer.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            handleSwipe();
        });
    }

    function handleSwipe() {
        const swipeThreshold = 50;
        const diff = touchStartX - touchEndX;

        if (Math.abs(diff) > swipeThreshold) {
            stopAutoSlide();
            if (diff > 0) {
                nextSlide();
            } else {
                prevSlide();
            }
            startAutoSlide();
        }
    }

    // Start auto-sliding
    startAutoSlide();

    // Pause on hover
    const testimonialsSlider = document.querySelector('.testimonials-slider');
    if (testimonialsSlider) {
        testimonialsSlider.addEventListener('mouseenter', stopAutoSlide);
        testimonialsSlider.addEventListener('mouseleave', startAutoSlide);
    }
}); 