import fs from 'fs';
import path from 'path';

const brainDir = 'C:\\Users\\kulbhushan\\.gemini\\antigravity-ide\\brain\\2c781930-ce49-46d0-8190-60f9530aec13';
const publicImagesDir = 'C:\\Users\\kulbhushan\\.gemini\\antigravity-ide\\scratch\\eureka-blog\\public\\images';

const copies = [
  { src: 'rome_hero_empire_1789845087734.jpg', dest: 'rome-hero-empire.jpg' },
  { src: 'roman_roads_infrastructure_1789845103930.jpg', dest: 'roman-roads-infrastructure.jpg' },
  { src: 'fall_of_rome_legacy_1789845119985.jpg', dest: 'fall-of-rome-legacy.jpg' }
];

copies.forEach(({ src, dest }) => {
  const srcPath = path.join(brainDir, src);
  const destPath = path.join(publicImagesDir, dest);
  fs.copyFileSync(srcPath, destPath);
  console.log(`Copied ${src} -> ${dest}`);
});
