/**
 * Defines the throwable items available in the game
 * with their various physics properties.
 */
export const ITEMS = {
    hammer: {
        name: 'Hammer',
        sprite: 'hammer',
        weight: 5, // kg
        drag: 0.1,
        centerOfMass: { x: 0.7, y: 0.5 }, // normalized position (0-1)
        description: 'Medium weight with good aerodynamics',
        rotationSpeed: 300,
        bounciness: 0.15 // Low bounce due to metal head
    },
    
    rake: {
        name: 'Rake',
        sprite: 'rake',
        weight: 3,
        drag: 0.25,
        centerOfMass: { x: 0.3, y: 0.5 },
        description: 'Lighter but with high air resistance',
        rotationSpeed: 200,
        bounciness: 0.25 // Moderate bounce due to flexibility
    },
    
    shovel: {
        name: 'Shovel',
        sprite: 'shovel',
        weight: 4,
        drag: 0.15,
        centerOfMass: { x: 0.4, y: 0.5 },
        description: 'Balanced weight and aerodynamics',
        rotationSpeed: 250,
        bounciness: 0.2 // Medium bounce
    },
    
    axe: {
        name: 'Axe',
        sprite: 'axe',
        weight: 6,
        drag: 0.05,
        centerOfMass: { x: 0.8, y: 0.5 },
        description: 'Heavy with excellent aerodynamics',
        rotationSpeed: 350,
        bounciness: 0.1 // Very low bounce due to heavy metal head
    },
    
    flowerPot: {
        name: 'Flower Pot',
        sprite: 'flowerPot',
        weight: 2,
        drag: 0.3,
        centerOfMass: { x: 0.5, y: 0.7 },
        description: 'Light but fragile - might break on landing!',
        rotationSpeed: 400,
        bounciness: 0.4 // High bounce, lightweight ceramic
    }
};

/**
 * Get the physics properties of an item adjusted for the game engine.
 * @param {string} itemKey - The key of the item in the ITEMS object
 * @returns {Object} - Adjusted physics properties
 */
export function getItemPhysics(itemKey) {
    const item = ITEMS[itemKey];
    if (!item) return null;
    
    // Convert real-world properties to game physics properties
    return {
        // Apply weight to affect gravity and momentum
        mass: item.weight * 0.2,
        
        // Apply drag coefficient
        drag: item.drag * 0.5,
        
        // Calculate angular damping based on shape
        angularDrag: 0.1 + (item.drag * 0.2),
        
        // Rotation speed for the item when thrown
        angularVelocity: item.rotationSpeed,
        
        // Center of mass affects rotation behavior
        centerOfMass: item.centerOfMass
    };
}

/**
 * Get all available items for selection
 * @returns {Array} - Array of item keys and names
 */
export function getAvailableItems() {
    // Return all implemented items
    return Object.keys(ITEMS).map(key => ({
        key: key,
        name: ITEMS[key].name,
        description: ITEMS[key].description
    }));
} 