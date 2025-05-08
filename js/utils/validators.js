// js/utils/validators.js

export function isEmailValid(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }
  
  export function isPasswordStrong(password) {
    return password.length >= 8 && /[A-Z]/.test(password) && /\d/.test(password);
  }
  
  export function areFieldsFilled(...fields) {
    return fields.every(field => field && field.trim().length > 0);
  }
  