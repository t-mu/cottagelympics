const ghpages = require('gh-pages');
const path = require('path');

// Define the build directory - where Parcel will output the build files
const buildDir = path.join(__dirname, 'dist');

console.log('Publishing to GitHub Pages...');

ghpages.publish(
  buildDir,
  {
    branch: 'gh-pages',
    message: 'Auto-deploy from deploy script',
    repo: process.env.GITHUB_REPO || undefined, // Use GITHUB_REPO env variable if available, otherwise use current repo
    user: {
      name: 'GitHub Actions',
      email: 'actions@github.com',
    },
    dotfiles: true, // Include dotfiles
    history: false // Don't include commit history
  },
  (err) => {
    if (err) {
      console.error('Deployment error:', err);
      return;
    }
    console.log('Successfully deployed to GitHub Pages!');
  }
); 