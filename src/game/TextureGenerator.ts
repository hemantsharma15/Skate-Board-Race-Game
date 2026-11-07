import * as THREE from 'three';

export class TextureGenerator {
  // 1. Procedural Cracked Asphalt Texture
  public static createAsphaltTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d')!;

    // Base dark asphalt
    ctx.fillStyle = '#262930';
    ctx.fillRect(0, 0, 1024, 1024);

    // Fine aggregate noise
    const imgData = ctx.getImageData(0, 0, 1024, 1024);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      const noise = (Math.random() - 0.5) * 35;
      data[i] = Math.max(0, Math.min(255, data[i] + noise));
      data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise));
      data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise));
    }
    ctx.putImageData(imgData, 0, 0);

    // Realistic surface cracks
    ctx.strokeStyle = '#181a1f';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    for (let c = 0; c < 12; c++) {
      let cx = Math.random() * 1024;
      let cy = Math.random() * 1024;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      for (let s = 0; s < 4; s++) {
        cx += (Math.random() - 0.5) * 90;
        cy += (Math.random() - 0.5) * 90;
        ctx.lineTo(cx, cy);
      }
      ctx.stroke();
    }

    // Outer Solid White Road Shoulder Stripes
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 26;
    ctx.beginPath();
    ctx.moveTo(40, 0);
    ctx.lineTo(40, 1024);
    ctx.moveTo(1024 - 40, 0);
    ctx.lineTo(1024 - 40, 1024);
    ctx.stroke();

    // Center Dashed White Line
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 16;
    ctx.setLineDash([120, 80]);
    ctx.beginPath();
    ctx.moveTo(512, 0);
    ctx.lineTo(512, 1024);
    ctx.stroke();

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(1, 4);
    return tex;
  }

  // 2. Off-Road Dirt Track Texture (for Section 5 in video)
  public static createDirtRoadTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d')!;

    // Golden-brown soil base
    ctx.fillStyle = '#b4783c';
    ctx.fillRect(0, 0, 1024, 1024);

    // Soil & clay noise
    const imgData = ctx.getImageData(0, 0, 1024, 1024);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      const noise = (Math.random() - 0.5) * 45;
      data[i] = Math.max(0, Math.min(255, data[i] + noise));
      data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise * 0.8));
      data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise * 0.5));
    }
    ctx.putImageData(imgData, 0, 0);

    // Tyre ruts / track lines in dirt
    ctx.strokeStyle = 'rgba(120, 70, 30, 0.4)';
    ctx.lineWidth = 32;
    ctx.beginPath();
    ctx.moveTo(320, 0); ctx.lineTo(320, 1024);
    ctx.moveTo(704, 0); ctx.lineTo(704, 1024);
    ctx.stroke();

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(1, 4);
    return tex;
  }

  // 3. Red & White Curbs (matching video corners!)
  public static createRedWhiteCurbTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;

    for (let i = 0; i < 4; i++) {
      ctx.fillStyle = i % 2 === 0 ? '#dc2626' : '#ffffff';
      ctx.fillRect(i * 64, 0, 64, 64);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(8, 1);
    return tex;
  }

  // 4. Yellow Curve Chevron Warning Sign (matching video: ❯ ❯ ❯)
  public static createChevronSignTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    // Yellow background with black border
    ctx.fillStyle = '#facc15';
    ctx.fillRect(0, 0, 256, 256);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 12;
    ctx.strokeRect(6, 6, 244, 244);

    // Thick Black Chevron ❯
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.moveTo(70, 40);
    ctx.lineTo(165, 128);
    ctx.lineTo(70, 216);
    ctx.lineTo(115, 216);
    ctx.lineTo(210, 128);
    ctx.lineTo(115, 40);
    ctx.closePath();
    ctx.fill();

    return new THREE.CanvasTexture(canvas);
  }

  // 5. Graffiti Tunnel Wall Texture (matching Section 2 in video!)
  public static createGraffitiTunnelTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // Dark concrete base
    ctx.fillStyle = '#374151';
    ctx.fillRect(0, 0, 1024, 512);

    // Concrete texture grain
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    for (let i = 0; i < 2000; i++) {
      ctx.fillRect(Math.random() * 1024, Math.random() * 512, 3, 3);
    }

    // Street Graffiti tags & vibrant colorful spray art
    const graffitiColors = ['#f43f5e', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4'];
    for (let g = 0; g < 18; g++) {
      const gx = (g * 110 + 40) % 980;
      const gy = 100 + Math.random() * 280;

      ctx.save();
      ctx.translate(gx, gy);
      ctx.rotate((Math.random() - 0.5) * 0.4);

      ctx.fillStyle = graffitiColors[g % graffitiColors.length];
      ctx.font = 'bold 52px Arial, sans-serif';
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 10;
      const tags = ['SKATE', 'WILD', 'CREW', 'ZONE', 'BURN', 'RIDER', 'SPEED'];
      ctx.fillText(tags[g % tags.length], 0, 0);

      // Spray splatters
      for (let s = 0; s < 12; s++) {
        ctx.beginPath();
        ctx.arc((Math.random() - 0.5) * 120, (Math.random() - 0.5) * 60, 2 + Math.random() * 4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // Lower brick/stone curb border
    ctx.fillStyle = '#1f2937';
    ctx.fillRect(0, 430, 1024, 82);
    ctx.strokeStyle = '#4b5563';
    ctx.lineWidth = 3;
    for (let bx = 0; bx < 1024; bx += 48) {
      ctx.strokeRect(bx, 430, 48, 82);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(2, 1);
    return tex;
  }

  // 6. Autumn Leaf Canopy (Yellow & Fiery Orange)
  public static createAutumnLeavesTexture(isOrange = false): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, 512, 512);

    const colors = isOrange
      ? ['#ea580c', '#f97316', '#fb923c', '#c2410c', '#e11d48']
      : ['#eab308', '#facc15', '#fde047', '#ca8a04', '#d97706'];

    for (let i = 0; i < 380; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.pow(Math.random(), 0.6) * 220;
      const x = 256 + Math.cos(angle) * dist;
      const y = 256 + Math.sin(angle) * dist;

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(Math.random() * Math.PI);
      ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
      ctx.beginPath();
      ctx.ellipse(0, 0, 16 + Math.random() * 12, 9 + Math.random() * 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    return new THREE.CanvasTexture(canvas);
  }

  // 7. Roadside Grass & Soil Embankment
  public static createGrassBankTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    const grad = ctx.createLinearGradient(0, 0, 512, 512);
    grad.addColorStop(0, '#65a30d');
    grad.addColorStop(0.5, '#4d7c0f');
    grad.addColorStop(1, '#3f6212');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);

    for (let i = 0; i < 600; i++) {
      ctx.fillStyle = Math.random() > 0.4 ? '#84cc16' : '#365314';
      ctx.fillRect(Math.random() * 512, Math.random() * 512, 3 + Math.random() * 5, 2 + Math.random() * 4);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(4, 4);
    return tex;
  }

  // 8. Purple Roadside Wildflower
  public static createPurpleFlowerTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, 256, 256);

    ctx.strokeStyle = '#4d7c0f';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(128, 256);
    ctx.quadraticCurveTo(120, 180, 128, 110);
    ctx.stroke();

    const petalColors = ['#a855f7', '#c084fc', '#9333ea', '#7e22ce'];
    for (let p = 0; p < 9; p++) {
      const angle = (p / 9) * Math.PI * 2;
      const px = 128 + Math.cos(angle) * 36;
      const py = 100 + Math.sin(angle) * 36;
      ctx.fillStyle = petalColors[p % petalColors.length];
      ctx.beginPath();
      ctx.arc(px, py, 22, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = '#fde047';
    ctx.beginPath();
    ctx.arc(128, 100, 16, 0, Math.PI * 2);
    ctx.fill();

    return new THREE.CanvasTexture(canvas);
  }

  // 9. Sunny Sky & Cloud Dome
  public static createSunnySkyTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d')!;

    const skyGrad = ctx.createLinearGradient(0, 1024, 0, 0);
    skyGrad.addColorStop(0, '#bae6fd');
    skyGrad.addColorStop(0.35, '#38bdf8');
    skyGrad.addColorStop(1, '#0284c7');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, 1024, 1024);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    for (let c = 0; c < 12; c++) {
      const cx = (c * 180 + Math.random() * 80) % 1024;
      const cy = 200 + Math.random() * 320;
      const cloudRadius = 60 + Math.random() * 50;

      for (let p = 0; p < 7; p++) {
        const px = cx + (Math.random() - 0.5) * cloudRadius * 1.6;
        const py = cy + (Math.random() - 0.5) * cloudRadius * 0.6;
        ctx.beginPath();
        ctx.arc(px, py, cloudRadius * (0.5 + Math.random() * 0.5), 0, Math.PI * 2);
        ctx.fill();
      }
    }

    return new THREE.CanvasTexture(canvas);
  }
}
