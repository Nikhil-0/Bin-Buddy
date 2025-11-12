function validatePassword(password) {
    const minLength = 6;
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*]/.test(password);

    return {
        isValid: password.length >= minLength && hasNumbers && hasSpecialChar,
        errors: {
            length: password.length < minLength,
            numbers: !hasNumbers,
            specialChar: !hasSpecialChar
        }
    };
}

document.addEventListener('DOMContentLoaded', function() {
    const passwordInput = document.querySelector('input[name="password"]');
    const requirementsList = document.getElementById('password-requirements');

    if (passwordInput && requirementsList) {
        passwordInput.addEventListener('input', function() {
            const passwordValue = this.value.trim();
            
            if (passwordValue.length > 0) {
                const validation = validatePassword(passwordValue);
                const requirements = [
                    { id: 'length', text: 'At least 6 characters long' },
                    { id: 'numbers', text: 'At least one number' },
                    { id: 'specialChar', text: 'At least one special character' }
                ];

                requirements.forEach(req => {
                    const li = requirementsList.querySelector(`#req-${req.id}`);
                    if (li) {
                        li.className = validation.errors[req.id] ? 'text-danger' : 'text-success';
                    }
                });

                this.setCustomValidity(validation.isValid ? '' : 'Please meet all password requirements');
            } else {
                this.setCustomValidity('');
            }
        });
    }
    const form = document.querySelector('form');
    if (form) {
        form.addEventListener('submit', function(e) {
            const passwordInput = this.querySelector('input[name="password"]');
            if (passwordInput) {
                const passwordValue = passwordInput.value.trim();
                if (passwordValue.length > 0) {
                    const validation = validatePassword(passwordValue);
                    if (!validation.isValid) {
                        e.preventDefault();
                        alert('Please meet all password requirements before submitting.');
                    }
                }
            }
        });
    }
});