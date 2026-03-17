// Shared API Configuration (can be used by both Node.js scripts and React)
const API_BASE_URL = 'http://127.0.0.1:8080'
// CommonJS export for Node.js scripts
module.exports = {
  API_BASE_URL
};

// ES6 export for React (if using bundler that supports it)
if (typeof module !== 'undefined' && module.exports) {
  // Already exported via CommonJS
}

