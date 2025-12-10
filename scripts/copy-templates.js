const fs = require("fs");
const path = require("path");

function copyDirectory(source, destination) {
  if (!fs.existsSync(destination)) {
    fs.mkdirSync(destination, { recursive: true });
  }

  const items = fs.readdirSync(source);

  for (const item of items) {
    const sourcePath = path.join(source, item);
    const destPath = path.join(destination, item);
    const stat = fs.statSync(sourcePath);

    if (stat.isDirectory()) {
      copyDirectory(sourcePath, destPath);
    } else {
      fs.copyFileSync(sourcePath, destPath);
    }
  }
}

const generatorsDir = path.join(__dirname, "..", "src", "generators");
const distGeneratorsDir = path.join(__dirname, "..", "dist", "generators");

const generators = fs.readdirSync(generatorsDir);

for (const generator of generators) {
  const filesDir = path.join(generatorsDir, generator, "templates");

  if (fs.existsSync(filesDir) && fs.statSync(filesDir).isDirectory()) {
    if (fs.existsSync(path.join(distGeneratorsDir, generator, "templates"))) {
      fs.rmSync(path.join(distGeneratorsDir, generator, "templates"), {
        recursive: true,
      });
    }

    const destDir = path.join(distGeneratorsDir, generator, "templates");
    copyDirectory(filesDir, destDir);
    console.log(`Copied templates for: ${generator}`);
  }
}

console.log("All templates copied successfully");
