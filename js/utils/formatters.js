// js/utils/formatters.js

export function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }
  
  export function truncateText(text, maxLength = 150) {
    return text.length > maxLength ? text.slice(0, maxLength) + "..." : text;
  }
  