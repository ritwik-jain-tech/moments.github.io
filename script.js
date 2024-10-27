// Select all accordion buttons
const accordionButtons = document.querySelectorAll('.accordion-button');

accordionButtons.forEach(button => {
    button.addEventListener('click', () => {
        // Toggle active class on the clicked button
        button.classList.toggle('active');
        
        // Get the content section next to the clicked button
        const accordionContent = button.nextElementSibling;
        
        // If the content section is open, close it, otherwise open it
        if (accordionContent.style.display === 'block') {
            accordionContent.style.display = 'none';
        } else {
            accordionContent.style.display = 'block';
        }
    });

function sendOTP() {
    const phoneInput = document.getElementById('phone');
    const phone = phoneInput.value;

    // Check if the phone number is exactly 10 digits and numeric
    const isValidPhone = /^\d{10}$/.test(phone);
    if (!isValidPhone) {
        alert("Invalid phone number. Please enter a valid 10-digit phone number.");
        return;
    }

    // Show OTP section and display an alert confirming OTP sent
    document.getElementById('otp-section').style.display = 'block';
    alert("OTP has been sent to " + phone + ".");
}

function verifyOTP() {
    const otpInput = document.getElementById('otp').value;
    const phoneInput = document.getElementById('phone').value;

    // Check if OTP matches the required "123456"
    if (otpInput === "123456") {
        // Display confirmation modal
        const confirmationModal = document.getElementById('confirmation-modal');
        const confirmationMessage = document.getElementById('confirmation-message');
        
        confirmationMessage.textContent = "Your account associated with " + phoneInput + " has been deleted.";
        confirmationModal.style.display = "flex";
    } else {
        alert("Invalid OTP. Please try again.");
    }
}

function closeModal() {
    document.getElementById('confirmation-modal').style.display = "none";
}

