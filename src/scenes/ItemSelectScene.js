import Phaser from 'phaser';
import { getAvailableItems, ITEMS } from '../items';

class ItemSelectScene extends Phaser.Scene {
    constructor() {
        super({ key: 'ItemSelectScene' });
        this.selectedItem = 'hammer'; // Default selected item
    }

    preload() {
        // Load button asset if not already loaded
        this.load.image('button', 'https://labs.phaser.io/assets/sprites/button-green.png');
        
        // Load SVG assets correctly
        // Setting path first makes the loading cleaner
        this.load.setPath('assets/');
        
        // Load SVGs using the proper SVG loader
        this.load.svg('hammer', 'hammer.svg');
        this.load.svg('rake', 'rake.svg');
        this.load.svg('shovel', 'shovel.svg');
        this.load.svg('axe', 'axe.svg');
        this.load.svg('flowerPot', 'flowerPot.svg');

        // Add error handling for asset loading
        this.load.on('loaderror', (file) => {
            console.error(`Failed to load asset: ${file.key}`);
            // Create a fallback texture for the failed asset
            this.createFallbackTexture(file.key);
        });
    }

    create() {
        // Set background color
        this.cameras.main.setBackgroundColor('#87CEEB');

        // Add title text
        const titleText = this.add.text(
            this.cameras.main.centerX, 
            50, 
            'SELECT YOUR ITEM', 
            { 
                fontFamily: 'Arial Black', 
                fontSize: 36, 
                color: '#8B4513',
                stroke: '#FFF',
                strokeThickness: 4
            }
        ).setOrigin(0.5);

        // Add instruction text
        this.add.text(
            this.cameras.main.centerX, 
            100, 
            'Click on an item to start playing', 
            { 
                fontFamily: 'Arial', 
                fontSize: 18,
                color: '#333',
                backgroundColor: '#FFFFFF80',
                padding: { x: 10, y: 5 }
            }
        ).setOrigin(0.5);

        // Get available items
        const availableItems = getAvailableItems();
        
        // Create item cards
        this.itemCards = [];
        const itemsPerRow = 3;
        const cardWidth = 200;
        const cardHeight = 220;
        const startX = this.cameras.main.centerX - ((Math.min(itemsPerRow, availableItems.length) - 1) * cardWidth / 2);
        const startY = 150;
        
        availableItems.forEach((item, index) => {
            const row = Math.floor(index / itemsPerRow);
            const col = index % itemsPerRow;
            const x = startX + (col * cardWidth);
            const y = startY + (row * cardHeight);
            
            // Create item card
            this.createItemCard(item, x, y);
        });
        
        // Create back button
        const backButton = this.add.image(
            this.cameras.main.centerX,
            this.cameras.main.height - 50,
            'button'
        ).setInteractive();

        // Add text on the button
        const backText = this.add.text(
            this.cameras.main.centerX, 
            this.cameras.main.height - 50, 
            'BACK', 
            { 
                fontFamily: 'Arial', 
                fontSize: 18,
                color: '#000' 
            }
        ).setOrigin(0.5);

        // Add hover effect
        backButton.on('pointerover', () => {
            backButton.setTint(0xDDDDDD);
        });
        
        backButton.on('pointerout', () => {
            backButton.clearTint();
        });

        // Add click event for back button
        backButton.on('pointerdown', () => {
            this.scene.start('WelcomeScene');
        });
        
        // Add keyboard input to return to welcome screen
        this.input.keyboard.on('keydown-R', () => {
            this.scene.start('WelcomeScene');
        });
    }
    
    createItemCard(item, x, y) {
        // Create card background with hover functionality
        const cardBg = this.add.rectangle(x, y, 160, 160, 0xFFFFFF, 0.8)
            .setInteractive()
            .setOrigin(0.5);
        
        // Create selection border
        const selectionBorder = this.add.graphics();
        selectionBorder.lineStyle(4, 0x00FF00, 1);
        selectionBorder.strokeRoundedRect(x - 83, y - 83, 166, 166, 12);
        selectionBorder.visible = false;
        
        // Create item sprite
        const itemSprite = this.add.image(x, y - 30, item.key);
        
        // If the image fails to load, create a fallback graphic
        if (itemSprite.width === 0 || itemSprite.height === 0) {
            console.warn(`Image for ${item.key} didn't load properly. Creating fallback.`);
            
            // Create a fallback using graphics
            const color = this.getColorForItem(item.key);
            const graphics = this.add.graphics();
            graphics.fillStyle(color, 1);
            
            // Create appropriate shape based on the item
            switch(item.key) {
                case 'hammer':
                    graphics.fillRect(-30, -10, 60, 20); // Handle
                    graphics.fillCircle(-20, -10, 20); // Head
                    break;
                case 'rake':
                    graphics.fillRect(-5, -30, 10, 60); // Handle
                    graphics.fillRect(-20, -30, 40, 10); // Head
                    break;
                case 'shovel':
                    graphics.fillRect(-5, -30, 10, 50); // Handle
                    graphics.fillEllipse(-5, 15, 30, 15); // Blade
                    break;
                case 'axe':
                    graphics.fillRect(-5, -30, 10, 60); // Handle
                    graphics.fillTriangle(-5, -20, 25, -10, -5, 0); // Head
                    break;
                case 'flowerPot':
                    graphics.fillRect(-20, 0, 40, 30); // Pot
                    graphics.fillCircle(0, -15, 15); // Flower
                    break;
                default:
                    graphics.fillRect(-20, -20, 40, 40); // Default square
            }
            
            // Position the graphics at the item's position
            graphics.x = x;
            graphics.y = y - 30;
            
            // Hide the original sprite
            itemSprite.visible = false;
        } else {
            // Scale the sprite appropriately
            switch(item.key) {
                case 'hammer':
                    itemSprite.setScale(0.35);
                    break;
                case 'rake':
                    itemSprite.setScale(0.35);
                    break;
                case 'shovel':
                    itemSprite.setScale(0.35);
                    break;
                case 'axe':
                    itemSprite.setScale(0.35);
                    break;
                case 'flowerPot':
                    itemSprite.setScale(0.3);
                    break;
                default:
                    itemSprite.setScale(0.35);
            }
        }
        
        // Add item name
        const nameText = this.add.text(
            x, 
            y + 30, 
            item.name, 
            { 
                fontFamily: 'Arial', 
                fontSize: 18,
                color: '#000',
                fontWeight: 'bold'
            }
        ).setOrigin(0.5);
        
        // Add item description with word wrap
        const descText = this.add.text(
            x, 
            y + 55, 
            item.description, 
            { 
                fontFamily: 'Arial', 
                fontSize: 12,
                color: '#333',
                align: 'center',
                wordWrap: { width: 150 }
            }
        ).setOrigin(0.5);
        
        // Make the entire card clickable
        cardBg.on('pointerdown', () => {
            // Immediately start the game with this item
            this.scene.start('GameScene', { selectedItem: item.key });
        });
        
        // Also make item, name and description clickable
        itemSprite.setInteractive().on('pointerdown', () => {
            this.scene.start('GameScene', { selectedItem: item.key });
        });
        
        nameText.setInteractive().on('pointerdown', () => {
            this.scene.start('GameScene', { selectedItem: item.key });
        });
        
        descText.setInteractive().on('pointerdown', () => {
            this.scene.start('GameScene', { selectedItem: item.key });
        });
        
        // Add hover effects
        cardBg.on('pointerover', () => {
            cardBg.fillColor = 0xEEEEEE;
            selectionBorder.visible = true;
        });
        
        cardBg.on('pointerout', () => {
            cardBg.fillColor = 0xFFFFFF;
            selectionBorder.visible = false;
        });
    }
    
    getColorForItem(itemKey) {
        // Return a different color for each item as a fallback
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
        if (this.textures.exists(itemKey)) {
            console.log(`Texture for ${itemKey} already exists`);
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
        
        // Generate a texture from the graphics
        graphics.generateTexture(itemKey, width, height);
        graphics.destroy();
        
        console.log(`Created fallback texture for ${itemKey}`);
    }
}

export default ItemSelectScene; 