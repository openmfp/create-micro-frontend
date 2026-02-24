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
  const generatorSourceDir = path.join(generatorsDir, generator);
  const filesDir = path.join(generatorSourceDir, "templates");
  const generatorDistDir = path.join(distGeneratorsDir, generator);
  const manifestPath = path.join(generatorSourceDir, "package.json");

  if (fs.existsSync(filesDir) && fs.statSync(filesDir).isDirectory()) {
    if (fs.existsSync(path.join(generatorDistDir, "templates"))) {
      fs.rmSync(path.join(generatorDistDir, "templates"), {
        recursive: true,
      });
    }

    const destDir = path.join(generatorDistDir, "templates");
    copyDirectory(filesDir, destDir);
    console.log(`Copied templates for: ${generator}`);
  }

  if (fs.existsSync(manifestPath)) {
    if (!fs.existsSync(generatorDistDir)) {
      fs.mkdirSync(generatorDistDir, { recursive: true });
    }
    fs.copyFileSync(manifestPath, path.join(generatorDistDir, "package.json"));
    console.log(`Copied manifest for: ${generator}`);
  }
}

console.log("All templates copied successfully");
