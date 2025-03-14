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
}

export default ItemSelectScene; 