// ============================================================================
// MANDELBROT SET VISUALIZER
// ============================================================================
// Implementing iterative equation: z_{n+1} = z_n^2 + c
// where z starts at 0 and c is a complex number representing each point.

// ============================================================================
// CANVAS SETUP
// ============================================================================

// Get the canvas element and its 2D rendering context
const canvas = document.getElementById('mandelbrotCanvas');
const ctx = canvas.getContext('2d');

// Set canvas dimensions (500+ segments per axis)
const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 600;

canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

// ============================================================================
// MANDELBROT SET PARAMETERS
// ============================================================================

// View parameters for the complex plane
let viewCenterX = 0;        // Center of view on real axis
let viewCenterY = 0;        // Center of view on imaginary axis  
let viewScale = 4;          // Width of view in complex plane units

// This creates a view spanning (-2, -2) to (2, 2) in the complex plane
// Left edge:  0 - 4/2 = -2
// Right edge: 0 + 4/2 = +2
// Top edge:   0 + 4/2 = +2
// Bottom edge: 0 - 4/2 = -2

// initial iteration value
let maxIterations = 100;

// ============================================================================
// COLOR MAPPING
// ============================================================================

/**
 * Maps iteration count to RGB color values
 * @param {number} iteration - Number of iterations before escape
 * @param {number} maxIter - Maximum iterations allowed
 * @returns {Array} RGB color values [r, g, b]
 */
function getColorForIteration(iteration, maxIter) {
  // If we reached max iterations, the point is bounded (inside Mandelbrot set)
  if (iteration === maxIter) {
    return [255, 255, 255]; // LIGHT color (white) for bounded points
  } else {
    // DARK gradient color for unbounded points (outside Mandelbrot set)
    const normalizedIteration = iteration / maxIter; // Normalize to 0-1 range
    
    // Create a smooth color gradient based on how quickly the point escaped
    const red = Math.floor(9 * (1 - normalizedIteration) * Math.pow(normalizedIteration, 3) * 255);
    const green = Math.floor(15 * Math.pow(1 - normalizedIteration, 2) * Math.pow(normalizedIteration, 2) * 255);
    const blue = Math.floor(8.5 * Math.pow(1 - normalizedIteration, 3) * normalizedIteration * 255);
    
    return [red, green, blue];
  }
}

// ============================================================================
// MANDELBROT SET CALCULATION
// ============================================================================

/**
 * Checks if a complex number c is in the Mandelbrot set
 * @param {number} realPart - Real part of complex number c
 * @param {number} imaginaryPart - Imaginary part of complex number c
 * @returns {number} Number of iterations before escape, or maxIterations if bounded
 */
function calculateMandelbrotPoint(realPart, imaginaryPart) {
  // Start with z = 0
  let zReal = 0;
  let zImaginary = 0;
  let iteration = 0;

  // Iterate the equation: z_{n+1} = z_n^2 + c
  // Stop when |z| > 2 (definitely escaped) or max iterations reached
  while (zReal * zReal + zImaginary * zImaginary <= 4 && iteration < maxIterations) {
    // Calculate z^2 = (a + bi)^2 = (a^2 - b^2) + (2ab)i
    const zSquaredReal = zReal * zReal - zImaginary * zImaginary;
    const zSquaredImaginary = 2 * zReal * zImaginary;
    
    // Add c: z^2 + c
    zReal = zSquaredReal + realPart;
    zImaginary = zSquaredImaginary + imaginaryPart;
    
    iteration++;
  }

  return iteration;
}

// ============================================================================
// RENDERING LOGIC
// ============================================================================

/**
 * Renders the entire Mandelbrot set to the canvas
 */
function renderMandelbrotSet() {
  // Create a pixel buffer for efficient rendering
  const imageData = ctx.createImageData(CANVAS_WIDTH, CANVAS_HEIGHT);
  const pixelData = imageData.data;

  // Iterate through each pixel
  for (let pixelY = 0; pixelY < CANVAS_HEIGHT; pixelY++) {
    // Convert pixel Y coordinate to complex plane Y coordinate
    // Formula: Complex Coordinate = Center + (Pixel Position - Half Canvas Size) × Scale Factor
    const complexY = viewCenterY + (pixelY - CANVAS_HEIGHT / 2) * (viewScale / CANVAS_HEIGHT);

    for (let pixelX = 0; pixelX < CANVAS_WIDTH; pixelX++) {
      // Convert pixel X coordinate to complex plane X coordinate
      const complexX = viewCenterX + (pixelX - CANVAS_WIDTH / 2) * (viewScale / CANVAS_WIDTH);

      // Calculate how many iterations this point takes to escape
      const iterations = calculateMandelbrotPoint(complexX, complexY);

      // Get color for this iteration count
      const [red, green, blue] = getColorForIteration(iterations, maxIterations);

      // Set pixel color in the buffer
      const pixelIndex = 4 * (pixelY * CANVAS_WIDTH + pixelX);
      pixelData[pixelIndex + 0] = red;     // Red channel
      pixelData[pixelIndex + 1] = green;   // Green channel
      pixelData[pixelIndex + 2] = blue;    // Blue channel
      pixelData[pixelIndex + 3] = 255;     // Alpha channel (opaque)
    }
  }

  // Draw the pixel buffer to the canvas
  ctx.putImageData(imageData, 0, 0);
}

// ============================================================================
// CONTROL PANEL EVENT HANDLERS
// ============================================================================

// Get control panel elements
const resetButton = document.getElementById('resetBtn');
const maxIterationsSelect = document.getElementById('maxIterations');

// Set initial dropdown value
maxIterationsSelect.value = maxIterations;

// Reset button event listener
resetButton.addEventListener('click', () => {
  resetView();
});

// Max iterations dropdown event listener
maxIterationsSelect.addEventListener('change', (event) => {
  maxIterations = parseInt(event.target.value);
  renderMandelbrotSet();
});

// ============================================================================
// ZOOM FUNCTIONALITY
// ============================================================================

canvas.addEventListener('wheel', (event) => {
  event.preventDefault(); // Prevent page scrolling

  // Determine zoom direction and factor
  const zoomIn = event.deltaY < 0; // Negative deltaY means scroll up (zoom in)
  const zoomFactor = zoomIn ? 0.9 : 1.1; // Zoom in = scale down, Zoom out = scale up
  
  // Apply zoom
  viewScale *= zoomFactor;

  // Get mouse position relative to canvas
  const canvasRect = canvas.getBoundingClientRect();
  const mouseX = event.clientX - canvasRect.left;
  const mouseY = event.clientY - canvasRect.top;

  // Convert mouse position to complex plane coordinates
  const mouseComplexX = viewCenterX + (mouseX - CANVAS_WIDTH / 2) * (viewScale / CANVAS_WIDTH);
  const mouseComplexY = viewCenterY + (mouseY - CANVAS_HEIGHT / 2) * (viewScale / CANVAS_HEIGHT);

  // Adjust center to keep mouse position fixed during zoom
  viewCenterX = mouseComplexX + (viewCenterX - mouseComplexX) * zoomFactor;
  viewCenterY = mouseComplexY + (viewCenterY - mouseComplexY) * zoomFactor;

  // Re-render with new view parameters
  renderMandelbrotSet();
});

// ============================================================================
// PAN FUNCTIONALITY
// ============================================================================

let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;

canvas.addEventListener('mousedown', (event) => {
  isDragging = true;
  dragStartX = event.offsetX;
  dragStartY = event.offsetY;
  canvas.style.cursor = 'grabbing'; // Visual feedback
});

canvas.addEventListener('mouseup', () => {
  isDragging = false;
  canvas.style.cursor = 'grab';
});

canvas.addEventListener('mousemove', (event) => {
  if (!isDragging) return;

  // Calculate how far the mouse has moved
  const deltaX = event.offsetX - dragStartX;
  const deltaY = event.offsetY - dragStartY;

  // Convert pixel movement to complex plane movement
  const complexDeltaX = deltaX * (viewScale / CANVAS_WIDTH);
  const complexDeltaY = deltaY * (viewScale / CANVAS_HEIGHT);

  // Move the view center in the opposite direction of mouse movement
  viewCenterX -= complexDeltaX;
  viewCenterY -= complexDeltaY;

  // Update drag reference point for smooth continuous dragging
  dragStartX = event.offsetX;
  dragStartY = event.offsetY;

  // Re-render with new view parameters
  renderMandelbrotSet();
});

// ============================================================================
// KEYBOARD CONTROLS
// ============================================================================

/**
 * Resets the view to show the full (-2, -2) to (2, 2) range
 */
function resetView() {
  viewCenterX = 0;
  viewCenterY = 0;
  viewScale = 4;
  renderMandelbrotSet();
}

document.addEventListener('keydown', (event) => {
  // Reset view when 'R' key is pressed
  if (event.key.toLowerCase() === 'r') {
    resetView();
  }
});

// ============================================================================
// INITIALIZATION
// ============================================================================

// Start the visualization
renderMandelbrotSet(); 