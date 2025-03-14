import Phaser from 'phaser';
import WelcomeScene from './scenes/WelcomeScene';
import ItemSelectScene from './scenes/ItemSelectScene';
import GameScene from './scenes/GameScene';

// Game configuration
const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-container',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 300 },
            debug: false
        }
    },
    scene: [WelcomeScene, ItemSelectScene, GameScene]
};

// Initialize the game
const game = new Phaser.Game(config); 