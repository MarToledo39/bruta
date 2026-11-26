// ===== Canvas 2: sección horizontal con cubos (p5.js 2.3.2, modo instancia) =====
// Mientras se scrollea hacia abajo, los paneles se deslizan de costado.
// Por ahora cada panel tiene un cubo; más adelante va el espacio 3D.

let sketchCubos = function (p) {
  let cantidadPaneles = 4; // tiene que coincidir con los <article class="panel"> del HTML
  // colores de los cubos: grises y blanco del sistema BRUTA (el fondo ahora es negro)
  let colores = ["#3d3c39", "#e6e4df", "#cdcac3", "#f6f5f2"];
  let luzX = 0; // posición de la luz que sigue al mouse
  let luzY = 0;
  let seccion; // la sección horizontal completa
  let interior; // la parte que queda fija arriba
  let pista; // la fila de paneles

  p.setup = function () {
    p.createCanvas(p.windowWidth, p.windowHeight, p.WEBGL);
    seccion = p.select("#horizontal");
    interior = p.select("#horizontal-interior");
    pista = p.select("#pista");
  };

  p.draw = function () {
    p.clear(); // fondo transparente: se ve el gris de la página

    // posición de la sección respecto de la ventana
    let r = seccion.elt.getBoundingClientRect();

    // 1. Aparece por opacidad mientras la sección sube hasta arriba
    let opacidad = p.constrain(p.map(r.top, p.height, 0, 0, 1), 0, 1);
    interior.style("opacity", opacidad);

    // 2. Avance horizontal: 0 cuando la sección llega arriba, 1 cuando termina
    let recorrido = r.height - p.height; // cuánto se scrollea con la sección fija
    let progreso = p.constrain(-r.top / recorrido, 0, 1);
    let corrimiento = progreso * (cantidadPaneles - 1); // en paneles: de 0 a 3

    // la fila de paneles se corre hacia la izquierda (100vw por panel)
    pista.style("transform", "translateX(" + -corrimiento * 100 + "vw)");

    // si la sección no está a la vista, no se dibujan los cubos
    if (r.bottom < 0 || r.top > p.height) {
      return;
    }

    // 3. Grilla del piso: el espacio 3D por donde se mueven los cubos
    dibujarGrilla(corrimiento);

    // 4. Luces: una puntual sigue al mouse por delante de los cubos
    luzX = p.lerp(luzX, p.mouseX - p.width / 2, 0.15);
    luzY = p.lerp(luzY, p.mouseY - p.height / 2, 0.15);
    p.ambientLight(70); // luz ambiental suave
    p.directionalLight(50, 50, 50, -0.5, 0.5, -1);
    p.pointLight(246, 245, 242, luzX, luzY, 400); // con una alcanza: los cubos son claros

    // 5. Un cubo en el centro de cada panel, que se corre junto con los paneles
    // aristas en negro: la construcción a la vista
    p.stroke("#111111");
    p.strokeWeight(1);
    let lado = p.min(p.width, p.height) * 0.3;

    for (let i = 0; i < cantidadPaneles; i++) {
      p.push();
      p.translate((i - corrimiento) * p.width, 0, 0);
      p.rotateX(p.frameCount * 0.01 + i);
      p.rotateY(p.frameCount * 0.013 + i);
      p.fill(colores[i]); // cada cubo con un color de la paleta
      p.box(lado);
      p.pop();
    }
  };

  // Grilla de líneas en el piso, en perspectiva. Se corre junto con los paneles.
  function dibujarGrilla(corrimiento) {
    let paso = 80; // distancia entre líneas
    let piso = p.height * 0.3; // altura del piso, por debajo de los cubos
    let xInicio = -p.width;
    let xFin = cantidadPaneles * p.width;
    let zFondo = -1600;
    let zFrente = 400;

    p.push();
    p.translate(-corrimiento * p.width, 0, 0);
    p.stroke(205, 202, 195, 70); // gris cemento, tenue sobre el negro
    p.strokeWeight(1);
    // líneas que van hacia el fondo
    for (let x = xInicio; x <= xFin; x += paso) {
      p.line(x, piso, zFondo, x, piso, zFrente);
    }
    // líneas de lado a lado
    for (let z = zFondo; z <= zFrente; z += paso) {
      p.line(xInicio, piso, z, xFin, piso, z);
    }
    p.pop();
  }

  p.windowResized = function () {
    p.resizeCanvas(p.windowWidth, p.windowHeight);
  };
};

// crea el sketch adentro del div con id "lienzo-cubos"
new p5(sketchCubos, "lienzo-cubos");
