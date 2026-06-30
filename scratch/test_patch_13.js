const fs = require('fs');

let code = fs.readFileSync('web/semantic-13.js', 'utf8');
code = code.replace(/\r\n/g, '\n');

// Replace the hierarchy traversal logic in semantic-13.js
code = code.replace(
  `    let rotorGroup = refreshPath;
    while (rotorGroup && rotorGroup.parentNode !== scene) {
      rotorGroup = rotorGroup.parentNode;
    }
    let containerGroup = innerContainerPath;
    while (containerGroup && containerGroup.parentNode !== scene) {
      containerGroup = containerGroup.parentNode;
    }
    
    if (rotorGroup && containerGroup) {
      const g = svg.ownerDocument.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.setAttribute('data-motion-id', '1:4181:@root/container[0]');
      
      // Move them into the new group
      // We want the background circle to be behind the refresh arrows,
      // so append innerContainerPath first, then rotorGroup
      if (innerContainerPath.parentNode === containerGroup && containerGroup !== innerContainerPath) {
        g.appendChild(innerContainerPath);
        containerGroup.remove();
      } else {
        g.appendChild(containerGroup);
      }
      
      g.appendChild(rotorGroup);
      scene.appendChild(g);`,
  `    let containerGroup = innerContainerPath;
    while (containerGroup && containerGroup.parentNode !== scene && !(containerGroup.getAttribute('data-motion-id') || '').includes('container[0]')) {
      containerGroup = containerGroup.parentNode;
    }
    const commonParent = containerGroup ? containerGroup.parentNode : scene;
    let rotorGroup = refreshPath;
    while (rotorGroup && rotorGroup.parentNode !== commonParent) {
      rotorGroup = rotorGroup.parentNode;
    }
    
    if (rotorGroup && containerGroup) {
      const g = svg.ownerDocument.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.setAttribute('data-motion-id', '1:4181:@root/container[0]');
      
      // Move them into the new group
      // We want the background circle to be behind the refresh arrows,
      // so append innerContainerPath first, then rotorGroup
      if (innerContainerPath.parentNode === containerGroup && containerGroup !== innerContainerPath) {
        g.appendChild(innerContainerPath);
        containerGroup.remove();
      } else {
        g.appendChild(containerGroup);
      }
      
      g.appendChild(rotorGroup);
      commonParent.appendChild(g);`
);

fs.writeFileSync('scratch/semantic-13.js', code, 'utf8');
console.log('Patched semantic-13.js written to scratch/semantic-13.js');
