import Phaser from 'phaser';
import { getItemPhysics, getAvailableItems, ITEMS } from '../items';

class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
        this.player = null;
        this.throwableItem = null;
        this.ground = null;
        this.gameState = 'READY'; // READY, RUNNING, FLYING, FINISH
        this.runSpeed = 200; // Constant run speed
        this.throwPower = 500; // Default throw power
        this.minThrowPower = 200;
        this.maxThrowPower = 800;
        this.powerStep = 50; // Amount to adjust power with each key press
        this.throwAngle = 45;
        this.throwText = null;
        this.distanceText = null;
        this.powerText = null;
        this.aimArrow = null;
        this.throwDistance = 0;
        this.currentItem = 'hammer'; // Default item
        this.controlsPanel = null;
        this.isRunning = false;
        this.cameraFollowing = false;
        this.fieldChunks = []; // Store field chunks
        this.currentRightEdge = 800; // Initial right edge of the field
        this.markerDistance = 5; // Distance in meters between markers
        this.chunkWidth = 800; // Width of each field chunk
        this.maxGeneratedChunks = 20; // Limit to prevent infinite memory usage
        this.playerStartX = 50; // Starting X position of player
        this.throwLine = 300; // X position of the throw line
    }

    init(data) {
        console.log('GameScene init method called with data:', data);
        
        // Get the selected item from the previous scene
        if (data && data.selectedItem) {
            this.currentItem = data.selectedItem;
            console.log('Selected item from data:', this.currentItem);
        } else {
            // Fallback to default item if not specified
            this.currentItem = 'hammer';
            console.log('No item selected, using default:', this.currentItem);
        }
        
        // Validate that the item exists in our ITEMS object
        if (!ITEMS[this.currentItem]) {
            console.warn(`Item "${this.currentItem}" not found in ITEMS, falling back to hammer`);
            this.currentItem = 'hammer';
        }
        
        console.log('Final selected item:', this.currentItem);
    }

    preload() {
        console.log('GameScene preload method started');
        // Load game assets
        this.load.image('background', 'https://labs.phaser.io/assets/skies/sky1.png');
        this.load.image('ground', 'https://labs.phaser.io/assets/sprites/platform.png');
        this.load.image('player', 'https://labs.phaser.io/assets/sprites/phaser-dude.png');
        this.load.image('arrow', 'https://labs.phaser.io/assets/sprites/arrow.png');
        
        console.log('Basic images loaded');
        
        // Create simple colored shapes for the items instead of loading SVGs
        this.load.on('complete', () => {
            console.log('Preload complete, creating item textures now');
            // Create colored rectangular alternatives for each item
            this.createItemTextures();
        });
        
        console.log('GameScene preload method completed');
    }

    create() {
        console.log('GameScene create method started');
        // Set world bounds to be very large for long throws
        this.physics.world.setBounds(0, 0, 100000, 600);
        
        // Set more realistic physics properties
        this.physics.world.gravity.y = 600; // Slightly higher gravity (default is 300)
        
        // Add background - create a larger sky (2x screen dimensions in all directions)
        const screenWidth = this.cameras.main.width;
        const screenHeight = this.cameras.main.height;
        
        console.log('Screen dimensions:', screenWidth, screenHeight);
        
        // Create sky that's 2x screen width and 2x height
        this.backgroundWidth = screenWidth * 4; // 2x in each horizontal direction
        this.backgroundHeight = screenHeight * 2; // 2x in vertical direction
        
        // Position the sky to extend beyond visible area
        this.backgroundSprite = this.add.tileSprite(
            screenWidth / 2, // Center x
            screenHeight / 2, // Center y
            this.backgroundWidth, 
            this.backgroundHeight, 
            'background'
        );
        
        // Set initial scroll factor for parallax effect
        this.backgroundSprite.setScrollFactor(0.8, 0.2); // Less y-scroll for sky
        
        console.log('Background created');
        
        // Start with 3 chunks to have 2 in advance
        this.createFieldChunk(0);
        this.createFieldChunk(this.chunkWidth);
        this.createFieldChunk(this.chunkWidth * 2);
        console.log('Field chunks created');

        // Create player at the start position
        this.player = this.physics.add.sprite(this.playerStartX, 520, 'player');
        this.player.setCollideWorldBounds(true);
        console.log('Player created at:', this.playerStartX, 520);
        
        // Create the throwable item with the selected item
        console.log('Creating throwable item with:', this.currentItem);
        
        // First ensure the texture exists - if not, create a fallback
        if (!this.textures.exists(this.currentItem)) {
            console.warn(`Texture for ${this.currentItem} does not exist, creating fallback`);
            this.createFallbackTexture(this.currentItem);
        }
        
        // Create the throwable item sprite now that we're sure the texture exists
        this.throwableItem = this.physics.add.sprite(this.player.x + 20, this.player.y - 10, this.currentItem);
        console.log('Throwable item created with dimensions:', this.throwableItem.width, this.throwableItem.height);
        
        // Setup the sprite
        this.throwableItem.setCollideWorldBounds(true);
        
        // Scale the item appropriately
        this.resizeItem(this.throwableItem);
        
        // Initially disable physics on the item until thrown
        this.throwableItem.body.enable = false;

        // Add throw line indicator
        this.throwLineGraphics = this.add.graphics();
        this.throwLineGraphics.lineStyle(2, 0xFF0000, 1);
        this.throwLineGraphics.lineBetween(this.throwLine, 500, this.throwLine, 570);
        this.add.text(this.throwLine, 490, 'THROW LINE', { 
            fontSize: '14px', 
            fill: '#FF0000',
            backgroundColor: '#000', 
            padding: { x: 5, y: 2 } 
        }).setOrigin(0.5);
        console.log('Throw line created');

        // Create aim arrow
        this.aimArrow = this.add.sprite(this.player.x, this.player.y, 'arrow');
        this.aimArrow.setVisible(true);
        this.aimArrow.setOrigin(0, 0.5); // Set origin to left center
        this.updateAimArrow();
        console.log('Aim arrow created');

        // Create UI container that stays with camera
        this.uiContainer = this.add.container(0, 0);
        this.uiContainer.setScrollFactor(0);

        // Add UI text
        this.throwText = this.add.text(400, 50, 'Press SPACE to start running!', { 
            fontSize: '24px', 
            fill: '#FFF',
            backgroundColor: '#000',
            padding: { x: 10, y: 5 }
        }).setOrigin(0.5);
        this.uiContainer.add(this.throwText);

        this.distanceText = this.add.text(400, 100, 'Distance: 0m', { 
            fontSize: '20px', 
            fill: '#FFF',
            backgroundColor: '#000',
            padding: { x: 10, y: 5 }
        }).setOrigin(0.5);
        this.distanceText.setVisible(false);
        this.uiContainer.add(this.distanceText);

        // Add power meter
        this.powerText = this.add.text(400, 150, `Power: ${Math.floor(this.throwPower / this.maxThrowPower * 100)}%`, { 
            fontSize: '18px', 
            fill: '#FFF',
            backgroundColor: '#000',
            padding: { x: 5, y: 3 }
        }).setOrigin(0.5);
        this.uiContainer.add(this.powerText);

        // Add item info
        const itemInfo = ITEMS[this.currentItem]; // Get the current item info
        this.itemText = this.add.text(150, 50, `Item: ${itemInfo.name}`, { 
            fontSize: '18px', 
            fill: '#FFF',
            backgroundColor: '#000',
            padding: { x: 5, y: 3 }
        }).setOrigin(0.5);
        this.uiContainer.add(this.itemText);
        console.log('UI elements created');

        // Create controls panel
        this.createControlsPanel();
        console.log('Controls panel created');

        // Add input handlers
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.rKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);
        
        // Arrow keys
        this.upKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP);
        this.downKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN);
        this.leftKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT);
        this.rightKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT);
        
        // Add click/touch for mobile
        this.input.on('pointerdown', () => {
            if (this.gameState === 'READY') {
                this.startRunning();
            } else if (this.gameState === 'RUNNING') {
                this.throwItem();
            }
        });
        
        // Update controls display for initial state
        this.updateControlsDisplay();
        console.log('GameScene create method completed');
    }
    
    resizeItem(itemSprite) {
        // Scale the item based on which item it is
        switch(this.currentItem) {
            case 'hammer':
                itemSprite.setScale(0.35);
                break;
            case 'rake':
                itemSprite.setScale(0.4);
                break;
            case 'shovel':
                itemSprite.setScale(0.4);
                break;
            case 'axe':
                itemSprite.setScale(0.4);
                break;
            case 'flowerPot':
                itemSprite.setScale(0.35);
                break;
            default:
                itemSprite.setScale(0.35);
        }
    }

    createFieldChunk(startX) {
        console.log(`Creating field chunk at x=${startX}`);
        // Create a new chunk of the playing field
        const chunk = {
            ground: this.physics.add.staticGroup(),
            markers: [],
            startX: startX,
            endX: startX + this.chunkWidth
        };
        
        // Add ground for this chunk
        const groundSprite = chunk.ground.create(startX + (this.chunkWidth / 2), 580, 'ground');
        groundSprite.setScale(this.chunkWidth / groundSprite.width, 1).refreshBody();
        console.log(`Ground sprite created at x=${startX + (this.chunkWidth / 2)}, y=580`);
        
        // Set physics material properties for the ground
        try {
            // Arcade Physics doesn't have setFriction, but we can use:
            if (groundSprite.body) {
                // For Arcade Physics, we can simulate friction using drag on collisions
                // This will be handled in collision callbacks
                console.log('Ground sprite body created successfully');
            } else {
                console.warn('Ground sprite body not available');
            }
        } catch (e) {
            console.error('Error with ground physics:', e);
        }
        
        // Add colliders for player and throwable with custom bounce settings
        if (this.player) {
            try {
                this.physics.add.collider(this.player, chunk.ground);
                console.log('Added player-ground collider');
            } catch (e) {
                console.error('Failed to add player-ground collider:', e);
            }
        }
        
        if (this.throwableItem) {
            try {
                // Add collider with custom bounce and friction callback
                const itemGroundCollider = this.physics.add.collider(this.throwableItem, chunk.ground, null, (item, ground) => {
                    // Calculate bounce based on material and impact velocity
                    const impactVelocity = Math.abs(item.body.velocity.y);
                    const bounceFactor = 0.3 * (impactVelocity / 500); // More impact = more bounce, up to a limit
                    
                    // Set bounce dynamically based on impact and item type
                    let itemBounciness = 0.2; // Default value
                    try {
                        if (ITEMS[this.currentItem] && ITEMS[this.currentItem].bounciness !== undefined) {
                            itemBounciness = ITEMS[this.currentItem].bounciness;
                        }
                    } catch (e) {
                        console.warn('Error accessing item bounciness:', e);
                    }
                    
                    item.body.setBounce(itemBounciness * (1 + bounceFactor), 0.4);
                    
                    // Apply friction to reduce horizontal velocity on contact
                    // This simulates ground friction
                    item.body.velocity.x *= 0.92;
                    
                    return true; // Continue with collision
                });
                console.log('Added throwable-ground collider with custom friction handling');
            } catch (e) {
                console.error('Failed to add throwable-ground collider:', e);
            }
        }
        
        // Add distance markers
        const markersToAdd = Math.ceil(this.chunkWidth / 100); // One marker every 100 pixels
        const startMarker = Math.floor(startX / 100);
        
        for (let i = 0; i < markersToAdd; i++) {
            const markerIndex = startMarker + i;
            const x = markerIndex * 100;
            
            // Only add markers if they're in this chunk
            if (x >= startX && x <= startX + this.chunkWidth) {
                const markerLine = this.add.graphics();
                markerLine.lineStyle(2, 0xFFFFFF, 1);
                markerLine.lineBetween(x, 550, x, 570);
                
                const distance = Math.floor((x - this.throwLine) / 20); // Convert pixels to meters from throw line
                if (x >= this.throwLine) { // Only show positive distances
                    const marker = this.add.text(x, 530, `${distance}m`, { 
                        fontSize: '16px', 
                        fill: '#FFF',
                        backgroundColor: '#000', 
                        padding: { x: 3, y: 2 } 
                    }).setOrigin(0.5);
                    chunk.markers.push({ line: markerLine, text: marker });
                } else {
                    chunk.markers.push({ line: markerLine, text: null });
                }
            }
        }
        
        // Add this chunk to our array
        this.fieldChunks.push(chunk);
        
        // Update current right edge
        this.currentRightEdge = Math.max(this.currentRightEdge, startX + this.chunkWidth);
        console.log(`Field chunk created. Current right edge: ${this.currentRightEdge}`);
        
        return chunk;
    }

    checkAndExpandField() {
        // Determine how many chunks ahead we need to generate
        const chunksToMaintainAhead = 2;
        const itemChunkPosition = Math.floor(this.throwableItem.x / this.chunkWidth);
        
        // Calculate the target right edge (how far we should have generated)
        const targetRightEdge = (itemChunkPosition + chunksToMaintainAhead + 1) * this.chunkWidth;
        
        // Create new chunks until we've generated far enough ahead
        while (this.currentRightEdge < targetRightEdge && this.fieldChunks.length < this.maxGeneratedChunks) {
            this.createFieldChunk(this.currentRightEdge);
        }
        
        // Expand the background if needed
        const screenWidth = this.cameras.main.width;
        const currentViewRightEdge = this.cameras.main.scrollX + screenWidth;
        
        // If we're approaching the edge of our background, expand it
        if (currentViewRightEdge > (this.backgroundSprite.x + this.backgroundWidth/2) - screenWidth) {
            // Expand background width by one screen width
            this.backgroundWidth += screenWidth;
            this.backgroundSprite.width = this.backgroundWidth;
        }
        
        // Update background position and tilePosition for seamless scrolling
        this.backgroundSprite.tilePositionX = this.cameras.main.scrollX * 0.8;
    }

    update() {
        // Check for 'R' key press at any time to restart
        if (Phaser.Input.Keyboard.JustDown(this.rKey)) {
            this.restartGame();
            return;
        }
        
        if (this.gameState === 'READY') {
            this.handleReadyState();
        } else if (this.gameState === 'RUNNING') {
            this.handleRunningState();
        } else if (this.gameState === 'FLYING') {
            this.handleFlyingState();
            // Check for field expansion
            this.checkAndExpandField();
        } else if (this.gameState === 'FINISH') {
            this.handleFinishState();
        }
        
        // Update background parallax
        if (this.cameraFollowing) {
            this.backgroundSprite.tilePositionX = this.cameras.main.scrollX * 0.8;
        }
    }

    handleReadyState() {
        // Wait for spacebar to start running
        if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
            this.startRunning();
        }
        
        // Allow adjusting power before starting
        this.handlePowerAdjustment();
    }

    handleRunningState() {
        // Move the player at constant speed
        this.player.setVelocityX(this.runSpeed);
        
        // Move the throwable item with the player
        this.throwableItem.x = this.player.x + 20;
        this.throwableItem.y = this.player.y - 10;
        
        // Update the aim arrow position
        this.aimArrow.setPosition(this.player.x, this.player.y - 10);
        
        // Check for aim adjustments
        if (this.upKey.isDown && this.throwAngle < 85) {
            this.throwAngle += 1;
            this.updateAimArrow();
        } else if (this.downKey.isDown && this.throwAngle > 5) {
            this.throwAngle -= 1;
            this.updateAimArrow();
        }
        
        // Allow adjusting power while running
        this.handlePowerAdjustment();
        
        // Check for spacebar press to throw
        if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
            this.throwItem();
        }
        
        // Check if player has reached the throw line
        if (this.player.x >= this.throwLine) {
            this.throwItem(); // Auto-throw if player reaches the throw line
        }
    }

    handlePowerAdjustment() {
        // Adjust power with left/right keys
        if (Phaser.Input.Keyboard.JustDown(this.leftKey) && this.throwPower > this.minThrowPower) {
            this.throwPower -= this.powerStep;
            this.updatePowerDisplay();
        } else if (Phaser.Input.Keyboard.JustDown(this.rightKey) && this.throwPower < this.maxThrowPower) {
            this.throwPower += this.powerStep;
            this.updatePowerDisplay();
        }
    }
    
    updatePowerDisplay() {
        // Update power text
        const powerPercent = Math.floor(this.throwPower / this.maxThrowPower * 100);
        this.powerText.setText(`Power: ${powerPercent}%`);
        
        // Update arrow scale to reflect power
        this.updateAimArrow();
    }

    handleFlyingState() {
        // Calculate distance in meters (1 meter = 20 pixels) from throw line
        const distanceFromThrowLine = Math.floor((this.throwableItem.x - this.throwLine) / 20);
        this.throwDistance = Math.max(this.throwDistance, distanceFromThrowLine);
        this.distanceText.setText(`Distance: ${this.throwDistance}m`);
        
        // Apply subtle wind effects when the item is in flight
        if (this.throwableItem.body.velocity.y < 0 || this.throwableItem.y < 400) {
            // Item is high in the air or rising - apply wind
            const windStrength = 0.15; // Subtle wind force
            const dragEffect = this.throwableItem.body.drag.x * 10; // More drag = more wind effect
            
            // Wind varies with altitude - stronger at higher altitudes
            const altitudeFactor = 1 - (this.throwableItem.y / 600); // 0 at ground, 1 at top
            
            // Create subtle wind variations over time using sine wave
            const time = this.time.now / 3000; // Slow oscillation
            const windVariation = Math.sin(time) * windStrength * altitudeFactor * dragEffect;
            
            // Apply the wind force as horizontal acceleration
            this.throwableItem.body.velocity.x += windVariation;
        }
        
        // Check if the object has crossed the mid-point of the screen
        const cameraMidPoint = this.cameras.main.scrollX + (this.cameras.main.width / 2);
        if (!this.cameraFollowing && this.throwableItem.x > cameraMidPoint) {
            // Start camera following
            this.cameraFollowing = true;
            this.cameras.main.startFollow(this.throwableItem, true, 0.9, 0.9);
            // Set follow offset to keep the item more to the left side of the screen
            this.cameras.main.followOffset.set(-200, 0);
        }
        
        // Check if item has stopped moving
        if (Math.abs(this.throwableItem.body.velocity.x) < 5 && 
            Math.abs(this.throwableItem.body.velocity.y) < 5 && 
            this.throwableItem.body.touching.down) {
            this.gameState = 'FINISH';
            this.throwText.setText('Press R to restart');
            // Update controls display for finish state
            this.updateControlsDisplay();
        }
    }

    handleFinishState() {
        // R key is now handled in the main update function
    }

    restartGame() {
        // Stop camera following
        this.cameras.main.stopFollow();
        
        // Reset camera position
        this.cameras.main.scrollX = 0;
        this.cameras.main.scrollY = 0;
        
        // Reset flags
        this.cameraFollowing = false;
        
        // Return to the item select scene
        this.scene.start('ItemSelectScene');
    }

    startRunning() {
        // Start the player running
        this.gameState = 'RUNNING';
        this.isRunning = true;
        this.throwText.setText('Aim with UP/DOWN, adjust power with LEFT/RIGHT, press SPACE to throw!');
        
        // Update controls for running state
        this.updateControlsDisplay();
    }

    updateAimArrow() {
        // Update the aim arrow rotation based on the throw angle
        this.aimArrow.setRotation(Phaser.Math.DegToRad(-this.throwAngle));
        
        // Scale the arrow based on throw power
        const powerScale = this.throwPower / this.maxThrowPower;
        this.aimArrow.setScale(powerScale * 2, 1);
    }

    throwItem() {
        console.log('throwItem method called');
        // Stop the player
        this.player.setVelocityX(0);
        
        // Get physics properties for the current item
        const physics = getItemPhysics(this.currentItem);
        console.log('Item physics:', physics);
        
        // Enable physics on the item
        this.throwableItem.body.enable = true;
        
        // Set physics properties based on the item
        try {
            if (physics) {
                // Apply mass affects gravity impact
                this.throwableItem.body.setMass(physics.mass);
                
                // Set drag (air resistance) for both axes
                this.throwableItem.body.setDrag(physics.drag, physics.drag * 0.5);
                
                // Apply gravity scale based on weight
                // Heavier objects are less affected by air resistance relatively
                const gravityScale = 1 + (physics.mass * 0.1);
                this.throwableItem.body.setGravityY(this.physics.world.gravity.y * gravityScale);
                
                // Apply center of mass (for Arcade physics we simulate this with offset)
                const offsetX = (physics.centerOfMass.x - 0.5) * this.throwableItem.width;
                const offsetY = (physics.centerOfMass.y - 0.5) * this.throwableItem.height;
                this.throwableItem.body.setOffset(offsetX, offsetY);
                
                // Set bounce based on the material (0.2 default if not specified)
                const bounciness = ITEMS[this.currentItem]?.bounciness || 0.2;
                this.throwableItem.body.setBounce(bounciness);
                
                console.log('Applied physics properties to throwable item');
            } else {
                console.warn('No physics properties found for item:', this.currentItem);
                // Set default values
                this.throwableItem.body.setBounce(0.2);
            }
        } catch (error) {
            console.error('Error applying physics properties:', error);
        }
        
        // Calculate velocity components based on angle and power
        const angleRad = Phaser.Math.DegToRad(this.throwAngle);
        
        // Apply a more realistic initial velocity calculation
        // Add slight random variation for realism
        const powerVariation = Phaser.Math.FloatBetween(0.98, 1.02);
        const velocityX = Math.cos(angleRad) * this.throwPower * powerVariation;
        const velocityY = -Math.sin(angleRad) * this.throwPower * powerVariation;
        
        console.log('Throwing with velocity:', velocityX, velocityY);
        
        // Apply velocity to throw the item
        this.throwableItem.setVelocity(velocityX, velocityY);
        
        // Apply rotation based on the item's properties with some randomness
        let rotationSpeed = 300; // Default rotation speed
        if (physics) {
            rotationSpeed = physics.angularVelocity;
        }
        const rotationVariation = Phaser.Math.FloatBetween(0.95, 1.05);
        this.throwableItem.setAngularVelocity(rotationSpeed * rotationVariation);
        
        // Hide aim arrow
        this.aimArrow.setVisible(false);
        
        // Update game state
        this.gameState = 'FLYING';
        this.throwText.setText('Watch it fly!');
        this.distanceText.setVisible(true);
        
        // Update controls display for flying state
        this.updateControlsDisplay();
        console.log('Item thrown, game state set to FLYING');
    }

    createControlsPanel() {
        // Create a container for controls panel
        this.controlsPanel = this.add.container(680, 150);
        this.controlsPanel.setScrollFactor(0); // Stay with camera
        
        // Create background for controls panel
        const panelBg = this.add.graphics();
        panelBg.fillStyle(0x000000, 0.7);
        panelBg.fillRoundedRect(-100, -15, 200, 120, 10);
        this.controlsPanel.add(panelBg);

        // Add title
        const titleText = this.add.text(0, -5, 'CONTROLS', { 
            fontFamily: 'Arial', 
            fontSize: 16,
            color: '#FFF',
            fontWeight: 'bold'
        }).setOrigin(0.5);
        this.controlsPanel.add(titleText);

        // Create empty text objects for controls
        this.controlLines = [];
        for (let i = 0; i < 4; i++) {
            const controlText = this.add.text(-90, 15 + (i * 20), '', { 
                fontFamily: 'Arial', 
                fontSize: 14,
                color: '#FFF'
            }).setOrigin(0, 0.5);
            this.controlsPanel.add(controlText);
            this.controlLines.push(controlText);
        }
    }

    updateControlsDisplay() {
        // Update control instructions based on current game state
        let controls = [];

        switch (this.gameState) {
            case 'READY':
                controls = [
                    '• SPACE: Start running',
                    '• LEFT/RIGHT: Adjust power',
                    '• Power: ' + Math.floor(this.throwPower / this.maxThrowPower * 100) + '%',
                    '• R: Restart game anytime'
                ];
                break;
            case 'RUNNING':
                controls = [
                    '• UP/DOWN: Adjust angle',
                    '• LEFT/RIGHT: Adjust power',
                    '• SPACE: Stop and throw',
                    '• R: Restart game anytime'
                ];
                break;
            case 'FLYING':
                controls = [
                    '• Watch your item fly!',
                    '• Physics affects trajectory',
                    '• Camera follows the throw',
                    '• R: Restart game anytime'
                ];
                break;
            case 'FINISH':
                controls = [
                    '• R: Restart game',
                    `• Your score: ${this.throwDistance}m`,
                    '• Can you do better?',
                    '• Try another item!'
                ];
                break;
        }

        // Update the control text objects
        this.controlLines.forEach((line, index) => {
            if (index < controls.length) {
                line.setText(controls[index]);
            } else {
                line.setText('');
            }
        });
    }

    getColorForItem(itemKey) {
        // Return a different color for each item
        switch(itemKey) {
            case 'hammer': return 0x888888; // Gray
            case 'rake': return 0xA0522D; // Brown
            case 'shovel': return 0x708090; // Slate gray
            case 'axe': return 0x8B4513; // Saddle brown
            case 'flowerPot': return 0xCD5C5C; // Indian red
            default: return 0xFFFFFF; // White
        }
    }

    createFallbackTexture(itemKey) {
        // Check if the fallback texture already exists
        if (this.textures.exists(`${itemKey}Fallback`) || this.textures.exists(itemKey)) {
            console.log(`Texture for ${itemKey} already exists, using it`);
            return;
        }
        
        console.log(`Creating fallback texture for ${itemKey}`);
        
        // Create a new sprite with a specific color based on the item
        const color = this.getColorForItem(itemKey);
        const graphics = this.add.graphics();
        
        // Size of our texture
        const width = 100;
        const height = 100;
        
        // Create appropriate shape based on the item
        switch(itemKey) {
            case 'hammer':
                // Create a more distinct hammer
                graphics.fillStyle(0x8B4513, 1); // Brown handle
                graphics.fillRect(40, 20, 50, 15); // Handle
                graphics.fillStyle(0x888888, 1); // Gray head
                graphics.fillRect(10, 10, 40, 35); // Head
                break;
                
            case 'rake':
                // Create a more distinct rake
                graphics.fillStyle(0x8B4513, 1); // Brown handle
                graphics.fillRect(45, 20, 15, 70); // Handle
                graphics.fillStyle(0x8B4513, 1); // Brown head
                graphics.fillRect(20, 15, 65, 10); // Head
                // Teeth
                for (let i = 0; i < 5; i++) {
                    graphics.fillRect(25 + i * 12, 25, 6, 20);
                }
                break;
                
            case 'shovel':
                // Create a more distinct shovel
                graphics.fillStyle(0x8B4513, 1); // Brown handle
                graphics.fillRect(45, 10, 10, 50); // Handle
                graphics.fillStyle(0x999999, 1); // Gray blade
                graphics.beginPath();
                graphics.moveTo(30, 60);
                graphics.lineTo(70, 60);
                graphics.lineTo(60, 90);
                graphics.lineTo(40, 90);
                graphics.closePath();
                graphics.fill();
                break;
                
            case 'axe':
                // Create a more distinct axe
                graphics.fillStyle(0x8B4513, 1); // Brown handle
                graphics.fillRect(45, 30, 10, 60); // Handle
                graphics.fillStyle(0x999999, 1); // Gray blade
                graphics.beginPath();
                graphics.moveTo(45, 30);
                graphics.lineTo(20, 15);
                graphics.lineTo(15, 30);
                graphics.lineTo(40, 45);
                graphics.closePath();
                graphics.fill();
                break;
                
            case 'flowerPot':
                // Create a more distinct flower pot
                graphics.fillStyle(0xCD5C5C, 1); // Pot color
                graphics.beginPath();
                graphics.moveTo(35, 50);
                graphics.lineTo(65, 50);
                graphics.lineTo(60, 90);
                graphics.lineTo(40, 90);
                graphics.closePath();
                graphics.fill();
                // Flower
                graphics.fillStyle(0xFFD700, 1); // Yellow center
                graphics.fillCircle(50, 30, 10);
                graphics.fillStyle(0xFF8C00, 1); // Orange petals
                graphics.fillCircle(40, 20, 8);
                graphics.fillCircle(60, 20, 8);
                graphics.fillCircle(40, 40, 8);
                graphics.fillCircle(60, 40, 8);
                // Stem
                graphics.fillStyle(0x228B22, 1); // Green stem
                graphics.fillRect(48, 45, 4, 15);
                break;
                
            default:
                // Default square with item color
                graphics.fillStyle(color, 1);
                graphics.fillRect(20, 20, 60, 60);
        }
        
        // Add a border to make item stand out more
        graphics.lineStyle(2, 0x000000, 0.8);
        if (itemKey === 'hammer') {
            graphics.strokeRect(10, 10, 40, 35); // Head border
            graphics.strokeRect(40, 20, 50, 15); // Handle border
        } else if (itemKey === 'rake') {
            graphics.strokeRect(45, 20, 15, 70); // Handle border
            graphics.strokeRect(20, 15, 65, 10); // Head border
            // Teeth borders
            for (let i = 0; i < 5; i++) {
                graphics.strokeRect(25 + i * 12, 25, 6, 20);
            }
        }
        
        // Generate a texture from the graphics - use the regular item key
        // so we don't need special fallback handling
        graphics.generateTexture(itemKey, width, height);
        graphics.destroy();
        
        console.log(`Created fallback texture for ${itemKey}`);
    }

    // Create simple colored shapes for each item
    createItemTextures() {
        const items = ['hammer', 'rake', 'shovel', 'axe', 'flowerPot'];
        
        items.forEach(item => {
            if (!this.textures.exists(item)) {
                this.createFallbackTexture(item);
            }
        });
        
        console.log('Created all item textures');
    }
}

export default GameScene; 