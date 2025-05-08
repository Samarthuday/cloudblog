// js/ui/animations.js

export function fadeIn(element, duration = 600) {
    element.style.opacity = 0;
    element.style.display = "block";
    let opacity = 0;
    const step = 16 / duration;
  
    function animate() {
      opacity += step;
      if (opacity <= 1) {
        element.style.opacity = opacity;
        requestAnimationFrame(animate);
      }
    }
  
    animate();
  }
  
  export function fadeOut(element, duration = 600) {
    let opacity = 1;
    const step = 16 / duration;
  
    function animate() {
      opacity -= step;
      if (opacity >= 0) {
        element.style.opacity = opacity;
        requestAnimationFrame(animate);
      } else {
        element.style.display = "none";
      }
    }
  
    animate();
  }
  