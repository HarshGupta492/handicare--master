document.addEventListener('DOMContentLoaded', async function() {
    // Load user information
    try {
        const response = await fetch('/api/user/info');
        const data = await response.json();

        if (data.success) {
            const user = data.user;
            
            // Update user name in header
            document.getElementById('volunteer-name').textContent = user.name;
            
            // Update sidebar profile
            document.getElementById('sidebar-volunteer-name').textContent = user.name;
            document.getElementById('volunteer-email').textContent = user.email;
            
            // Update rating if available
            if (user.rating) {
                const ratingContainer = document.querySelector('.volunteer-rating');
                const ratingValue = parseFloat(user.rating);
                const fullStars = Math.floor(ratingValue);
                const hasHalfStar = ratingValue % 1 >= 0.5;
                
                let starsHTML = '';
                
                // Add full stars
                for (let i = 0; i < fullStars; i++) {
                    starsHTML += '<i class="fas fa-star"></i>';
                }
                
                // Add half star if needed
                if (hasHalfStar) {
                    starsHTML += '<i class="fas fa-star-half-alt"></i>';
                }
                
                // Add empty stars
                const emptyStars = 5 - Math.ceil(ratingValue);
                for (let i = 0; i < emptyStars; i++) {
                    starsHTML += '<i class="far fa-star"></i>';
                }
                
                starsHTML += `<span>${ratingValue.toFixed(1)}</span>`;
                ratingContainer.innerHTML = starsHTML;
            }

            // Update profile form if on profile tab
            const profileForm = document.getElementById('volunteer-profile-form');
            if (profileForm) {
                document.getElementById('volunteer-profile-name').value = user.name;
                document.getElementById('volunteer-profile-email').value = user.email;
                document.getElementById('volunteer-profile-phone').value = user.phone || '';
                document.getElementById('volunteer-profile-address').value = user.address || '';
                
                // Update skills
                if (user.skills) {
                    const skills = typeof user.skills === 'string' ? JSON.parse(user.skills) : user.skills;
                    const skillsSelect = document.getElementById('volunteer-profile-skills');
                    if (skillsSelect) {
                        Array.from(skillsSelect.options).forEach(option => {
                            option.selected = skills.includes(option.value);
                        });
                    }
                }
                
                // Update availability
                if (user.availability) {
                    const availability = typeof user.availability === 'string' ? 
                        JSON.parse(user.availability) : user.availability;
                    const availabilitySelect = document.getElementById('volunteer-profile-availability');
                    if (availabilitySelect) {
                        Array.from(availabilitySelect.options).forEach(option => {
                            option.selected = availability.includes(option.value);
                        });
                    }
                }
            }
        }
    } catch (error) {
        console.error('Error loading user information:', error);
    }

    // Handle profile form submission
    const profileForm = document.getElementById('volunteer-profile-form');
    if (profileForm) {
        profileForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = {
                name: document.getElementById('volunteer-profile-name').value,
                email: document.getElementById('volunteer-profile-email').value,
                phone: document.getElementById('volunteer-profile-phone').value,
                address: document.getElementById('volunteer-profile-address').value,
                skills: Array.from(document.getElementById('volunteer-profile-skills').selectedOptions)
                    .map(option => option.value),
                availability: Array.from(document.getElementById('volunteer-profile-availability').selectedOptions)
                    .map(option => option.value)
            };

            try {
                const response = await fetch('/api/volunteer/profile', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });

                const data = await response.json();
                if (data.success) {
                    alert('Profile updated successfully!');
                    location.reload();
                } else {
                    alert(data.error || 'Error updating profile');
                }
            } catch (error) {
                console.error('Error updating profile:', error);
                alert('An error occurred while updating your profile');
            }
        });
    }
}); 