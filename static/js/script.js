// Function to create labels
function createLabels(container, labels, position) {
    labels.forEach((label, index) => {
        const labelDiv = document.createElement('div');
        labelDiv.className = 'label';
        labelDiv.textContent = label;

        // Set position based on the type of labels
        switch (position) {
            case 'top':
                labelDiv.style.position = 'absolute';
                labelDiv.style.top = '-20px';
                labelDiv.style.left = `${(index + 0.5) / labels.length * 100}%`;
                labelDiv.style.transform = 'translateX(-50%)';
                break;
            case 'bottom':
                labelDiv.style.position = 'absolute';
                labelDiv.style.bottom = '-20px';
                labelDiv.style.left = `${(index + 0.5) / labels.length * 100}%`;
                labelDiv.style.transform = 'translateX(-50%)';
                break;
            case 'left':
                labelDiv.style.position = 'absolute';
                labelDiv.style.left = '-20px';
                labelDiv.style.top = `${(index + 0.5) / labels.length * 100}%`;
                labelDiv.style.transform = 'translateY(-50%)';
                break;
            case 'right':
                labelDiv.style.position = 'absolute';
                labelDiv.style.right = '-20px';
                labelDiv.style.top = `${(index + 0.5) / labels.length * 100}%`;
                labelDiv.style.transform = 'translateY(-50%)';
                break;
        }

        container.appendChild(labelDiv);
    });
}

// Function to initialize the labels
function initializeLabels() {
    const container = document.getElementById('canvas-container');
    const topLabels = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
    const leftLabels = ['a', 'b', 'c', 'd'];
    // const bottomLabels = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
    // const rightLabels = ['a', 'b', 'c', 'd'];

    // Clear any existing labels
    container.querySelectorAll('.label').forEach(label => label.remove());

    // Create new labels
    createLabels(container, topLabels, 'top');
    createLabels(container, leftLabels, 'left');
    // createLabels(container, bottomLabels, 'bottom');
    // createLabels(container, rightLabels, 'right');
}

// Initialize labels on window load
window.addEventListener('load', initializeLabels);

// Adjust labels on window resize
window.addEventListener('resize', initializeLabels);
