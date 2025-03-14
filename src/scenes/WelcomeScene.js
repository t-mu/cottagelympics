import Phaser from 'phaser';

class WelcomeScene extends Phaser.Scene {
    constructor() {
        super({ key: 'WelcomeScene' });
    }

    preload() {
        // Load assets for the welcome screen
        this.load.setBaseURL('./');
        
        // Load button
        this.load.image('button', 'https://labs.phaser.io/assets/sprites/button-green.png');
    }

    create() {
        // Set background color
        this.cameras.main.setBackgroundColor('#87CEEB');

        // Add title text
        const titleText = this.add.text(
            this.cameras.main.centerX, 
            this.cameras.main.centerY - 100, 
            'COTTAGE OLYMPICS', 
            { 
                fontFamily: 'Arial Black', 
                fontSize: 48, 
                color: '#8B4513',
                stroke: '#FFF',
                strokeThickness: 6
            }
        ).setOrigin(0.5);

        // Add subtitle
        const subtitleText = this.add.text(
            this.cameras.main.centerX, 
            this.cameras.main.centerY - 30, 
            'A not-so-serious sporting event', 
            { 
                fontFamily: 'Arial', 
                fontSize: 20,
                color: '#654321' 
            }
        ).setOrigin(0.5);

        // Add start button
        const startButton = this.add.image(
            this.cameras.main.centerX,
            this.cameras.main.centerY + 100,
            'button'
        ).setInteractive();

        // Add text on the button
        const startText = this.add.text(
            this.cameras.main.centerX, 
            this.cameras.main.centerY + 100, 
            'START', 
            { 
                fontFamily: 'Arial', 
                fontSize: 20,
                color: '#000' 
            }
        ).setOrigin(0.5);

        // Add hover effect
        startButton.on('pointerover', () => {
            startButton.setTint(0xDDDDDD);
        });
        
        startButton.on('pointerout', () => {
            startButton.clearTint();
        });

        // Add click event
        startButton.on('pointerdown', () => {
            this.scene.start('ItemSelectScene');
        });

        // Add some animation to the title
        this.tweens.add({
            targets: titleText,
            y: titleText.y - 10,
            duration: 1500,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1
        });
        
        // Add controls information
        this.addControlsInfo();
    }
    
    addControlsInfo() {
        // Create a background for the controls
        const controlsBg = this.add.graphics();
        controlsBg.fillStyle(0x000000, 0.7);
        controlsBg.fillRoundedRect(
            this.cameras.main.centerX - 150, 
            this.cameras.main.centerY + 150, 
            300, 
            130, 
            10
        );
        
        // Add title for controls
        this.add.text(
            this.cameras.main.centerX, 
            this.cameras.main.centerY + 165, 
            'CONTROLS', 
            { 
                fontFamily: 'Arial', 
                fontSize: 18,
                color: '#FFF',
                fontWeight: 'bold'
            }
        ).setOrigin(0.5);
        
        // Add controls text with updated instructions
        const controlsText = [
            '• SPACE: Start running & throw',
            '• UP/DOWN: Adjust aim while running',
            '• LEFT/RIGHT: Adjust throw power',
            '• R: Restart after throw'
        ];
        
        controlsText.forEach((text, index) => {
            this.add.text(
                this.cameras.main.centerX - 130, 
                this.cameras.main.centerY + 190 + (index * 20), 
                text, 
                { 
                    fontFamily: 'Arial', 
                    fontSize: 14,
                    color: '#FFF' 
                }
            ).setOrigin(0, 0.5);
        });
    }
}

export default WelcomeScene; 