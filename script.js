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
    const phone = document.getElementById('phone').value;

    // Check if the phone number is exactly 10 digits and numeric
    const isValidPhone = /^\d{10}$/.test(phone);
    if (!isValidPhone) {
        alert("Please enter a valid 10-digit phone number.");
        return;
    }

    // Simulate sending the OTP
    alert("OTP has been sent to " + phone + ".");
}
