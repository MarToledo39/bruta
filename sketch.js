// ===== Canvas 1: piedra 3D que se parte (p5.js 2.3.2, modo instancia) =====
// El canvas está fijo detrás de toda la página. Según la sección que se ve,
// la piedra cambia de lugar, de tamaño y de estado (entera, abierta, dispersa o en piezas).

let sketchPiedra = function (p) {
  // --- Archivos ---
  let letras = ["A", "B", "C", "D", "E", "F", "G"]; // nombres de los pedazos
  let pedazos = []; // modelo 3D de cada pedazo
  let textura; // imagen de color de la piedra

  // --- Datos de la piedra (se calculan una vez, en setup) ---
  let centro; // centro de la piedra entera
  let tamanoPiedra; // medida más grande de la piedra (en unidades del OBJ)
  let tamanoPiezaMax; // medida más grande entre los pedazos sueltos
  let centrosPedazos = []; // centro de cada pedazo
  let direcciones = []; // hacia dónde se aleja cada pedazo

  // --- Animación de los pedazos ---
  let desplazamientos = []; // cuánto está alejado cada pedazo en este frame
  let factores = []; // cada pedazo se aleja un poco más o un poco menos
  let giros = []; // cuánto gira cada pedazo (en X, Y y Z) al separarse
  let separacion; // distancia que se alejan los pedazos al abrirse
  let separacionLados = 1.7; // cuánto más se separan hacia los lados que hacia arriba y abajo
  let partida = false; // partida por el cursor (solo en la portada)
  let scrollAnterior = 0; // window.scrollY del frame anterior (celular: para saber si se está deslizando)
  let ultimoToque = -1000; // millis() de la última vez que el dedo tocó o la página se movió
  let celY = 0; // celular: lugar actual de la piedra (se acerca a su objetivo con lerp)
  let celZ = 0;
  let enPortadaCelular = true; // celular: la piedra está en su lugar de la portada
  let aperturaExtra = 3; // al dispersarse, los pedazos se alejan 3 separaciones más

  // --- Levitación ---
  let amplitudLevitacion; // cuánto sube y baja (se calcula en setup)
  let fases = []; // en qué punto de la onda arranca cada pedazo
  let velocidades = []; // qué tan rápido levita cada pedazo

  // --- Entrada girando ---
  let tiempoInicio; // momento en que empieza a dibujarse (en milisegundos)
  let duracionEntrada = 2500; // cuánto dura la entrada (en milisegundos)
  let anguloGiro = 0; // ángulo acumulado del giro de la piedra

  // --- Atracción hacia el cursor ---
  let atraccionX = 0; // cuánto está corrida la piedra hacia el cursor en este frame
  let atraccionY = 0;

  // --- Secciones de la página que mueven a la piedra ---
  let seccionTexto, seccionTitulares, seccionHorizontal, seccionPiezas, seccionContacto;
  let texturas = []; // fondos con textura que aparecen al llegar a su sección
  let titulares = []; // los cuatro titulares (crece el que corresponde al scroll)

  // --- Bloque de piezas: arrastrar y soltar etiquetas HTML (clase 10) ---
  let bloques = []; // los div arrastrables, uno por pedazo (su id coincide con la posición)
  let destino; // el halo de la piedra completa: donde se sueltan las piezas
  let detalle; // el bloque de la derecha, que cambia según la pieza
  let dragueando = null; // el bloque que se está arrastrando (o null)
  let difX, difY; // distancia entre el mouse y la esquina del bloque al empezar a arrastrar
  let posXactual, posYactual; // dónde estaba el bloque al empezar a arrastrar
  let colocada = []; // true cuando la pieza ya está en su lugar de la piedra
  let colocadaAnim = []; // de 0 a 1: suaviza el viaje de la pieza hasta la piedra
  let escalaSuelta; // tamaño de los pedazos sueltos
  let casilleroX = []; // posición del casillero de cada bloque (su lugar a la izquierda)
  let casilleroY = [];
  let piezaEnPiedra = -1; // número de la pieza que está en la piedra (-1 = ninguna)
  // arrays paralelos con el contenido de cada pieza (clase 06)
  // los 7 pasos del proceso: cada pedazo de la piedra es uno
  let nombres = ["IDEA", "BOCETO", "MATRIZ", "COLADO", "FRAGUADO", "DESMOLDE", "PRESENTACIÓN"];
  let info = [
    "Todo arranca en la calle: un muro, una reja, una forma que se repite.",
    "Se dibuja a mano. Medidas, uniones y qué parte va en metal.",
    "Cada pieza parte de un molde propio. Lo que tiene el molde, lo tiene la pieza.",
    "El concreto entra al molde y se vibra para sacar el aire.",
    "El material endurece a su tiempo. No se apura.",
    "Se abre el molde. La pieza sale con todas sus marcas.",
    "Se fotografía, se embala y sale lista para ocupar su lugar.",
  ];

  // --- Luz que sigue al mouse ---
  let luzX = 0; // posición actual de la luz (se acerca al mouse de a poco)
  let luzY = 0;

  // --- Posición y tamaño ---
  let zCostado = -500; // profundidad en la sección de texto y titulares (más lejos = más chica)
  let zContacto = -700; // profundidad en la sección de contacto (más chica que en la portada)
  let esCelular = false; // true si la ventana mide 700 px de ancho o menos (mismo corte que el CSS)
  let camaraZ = 800; // la cámara por defecto está en z = 800 (clase 13)
  let escala; // cuánto se agranda la piedra en pantalla
  let radioPantalla; // radio de la piedra en píxeles, cuando está en z = 0

  p.setup = async function () {
    p.createCanvas(p.windowWidth, p.windowHeight, p.WEBGL);

    // 0. Menú de celular: va antes de cargar los modelos para que funcione enseguida
    prepararMenu();

    // 1. Carga de archivos: en la 2.x no hay preload(), se espera cada carga con await
    textura = await p.loadImage("texturas/piedra_basecolor_1024.jpg");
    for (let i = 0; i < letras.length; i++) {
      // sin normalize: cada pedazo mantiene su posición original y encajan entre sí
      pedazos[i] = await p.loadModel("modelos/Parte_" + letras[i] + ".obj");
      // aristas de los triángulos: se usan para dibujar el halo con líneas
      pedazos[i].makeEdgesFromFaces();
    }

    // 2. Caja que envuelve a la piedra entera, centro y tamaño de cada pedazo
    let minimo = pedazos[0].vertices[0].copy();
    let maximo = pedazos[0].vertices[0].copy();
    tamanoPiezaMax = 0;
    for (let i = 0; i < pedazos.length; i++) {
      let vertices = pedazos[i].vertices;
      let suma = p.createVector(0, 0, 0);
      let minPieza = vertices[0].copy(); // caja de este pedazo solo
      let maxPieza = vertices[0].copy();
      for (let j = 0; j < vertices.length; j++) {
        let v = vertices[j];
        minimo.x = p.min(minimo.x, v.x);
        minimo.y = p.min(minimo.y, v.y);
        minimo.z = p.min(minimo.z, v.z);
        maximo.x = p.max(maximo.x, v.x);
        maximo.y = p.max(maximo.y, v.y);
        maximo.z = p.max(maximo.z, v.z);
        minPieza.x = p.min(minPieza.x, v.x);
        minPieza.y = p.min(minPieza.y, v.y);
        minPieza.z = p.min(minPieza.z, v.z);
        maxPieza.x = p.max(maxPieza.x, v.x);
        maxPieza.y = p.max(maxPieza.y, v.y);
        maxPieza.z = p.max(maxPieza.z, v.z);
        suma.add(v);
      }
      // el promedio de los vértices es el centro del pedazo
      centrosPedazos[i] = suma.div(vertices.length);
      let tamanoPieza = p.max(maxPieza.x - minPieza.x, maxPieza.y - minPieza.y, maxPieza.z - minPieza.z);
      tamanoPiezaMax = p.max(tamanoPiezaMax, tamanoPieza);
    }
    // el centro de la caja es el centro de la piedra
    centro = p5.Vector.add(minimo, maximo).div(2);
    tamanoPiedra = p.max(maximo.x - minimo.x, maximo.y - minimo.y, maximo.z - minimo.z);
    separacion = tamanoPiedra * 0.25;
    amplitudLevitacion = tamanoPiedra * 0.025;

    // 3. Datos de animación de cada pedazo
    for (let i = 0; i < pedazos.length; i++) {
      // dirección: desde el centro de la piedra hacia el centro del pedazo
      direcciones[i] = p5.Vector.sub(centrosPedazos[i], centro).normalize();
      // en el OBJ la Y es la vertical: se agrandan X y Z, que son los lados
      direcciones[i].x *= separacionLados;
      direcciones[i].z *= separacionLados;
      desplazamientos[i] = 0;
      factores[i] = p.random(0.85, 1.25);
      giros[i] = p.createVector(p.random(-0.6, 0.6), p.random(-0.6, 0.6), p.random(-0.6, 0.6));
      // cada pedazo levita con su propio punto de partida y su propia velocidad
      fases[i] = p.random(p.TWO_PI);
      velocidades[i] = p.random(0.015, 0.03);
    }

    // 4. Secciones del HTML que se usan para saber dónde está el scroll
    seccionTexto = p.select("#texto");
    seccionTitulares = p.select("#titulares");
    seccionHorizontal = p.select("#horizontal");
    seccionPiezas = p.select("#piezas");
    seccionContacto = p.select("#contacto");
    texturas = p.selectAll(".textura"); // todos los elementos con clase "textura"
    titulares = p.selectAll(".titular");

    // 5. Arrastrar y soltar (clase 10): cada bloque recibe sus eventos con una función anónima
    destino = p.select("#halo");
    detalle = p.select("#detalle-pieza");
    for (let i = 0; i < letras.length; i++) {
      let bloque = p.select("#bloque" + i);
      bloque.mousePressed(function () {
        inicioDrag(bloque);
      });
      bloque.mouseReleased(function () {
        finDrag(bloque);
      });
      bloques[i] = bloque;
      colocada[i] = false;
      colocadaAnim[i] = 0;
    }

    calcularMedidas();
    ubicarBloques();
    celY = -p.height * 0.1; // celular: arranca en su lugar de la portada
    tiempoInicio = p.millis(); // la entrada empieza cuando ya está todo cargado
  };

  p.draw = function () {
    p.clear(); // fondo transparente: se ve el gris de la página

    // --- Arrastre (clase 10): el bloque que se arrastra sigue al mouse ---
    if (dragueando) {
      dragueando.position(p.mouseX - difX, p.mouseY - difY);
    }

    // --- Entrada: en los primeros segundos la piedra llega desde el fondo girando ---
    let entrada = p.constrain((p.millis() - tiempoInicio) / duracionEntrada, 0, 1); // de 0 a 1
    let entradaSuave = 1 - p.pow(1 - entrada, 3); // arranca rápido y frena al final
    let entradaZ = p.lerp(-2500, 0, entradaSuave); // viene desde el fondo hasta su lugar
    anguloGiro += p.lerp(0.2, 0.0025, entradaSuave); // gira rápido y frena hasta el giro lento

    // --- Dónde está cada sección respecto de la ventana (top = distancia al borde superior) ---
    let alto = p.height;
    let rTexto = seccionTexto.elt.getBoundingClientRect();
    let rTitulares = seccionTitulares.elt.getBoundingClientRect();
    let rHorizontal = seccionHorizontal.elt.getBoundingClientRect();
    let rPiezas = seccionPiezas.elt.getBoundingClientRect();
    let rContacto = seccionContacto.elt.getBoundingClientRect();

    // cada avance va de 0 a 1 mientras la sección sube desde abajo de la ventana hasta arriba
    let avanceTexto = p.constrain(p.map(rTexto.top, alto, 0, 0, 1), 0, 1);
    let avanceDispersion = p.constrain(p.map(rHorizontal.top, alto, 0, 0, 1), 0, 1);
    let avancePiezas = p.constrain(p.map(rPiezas.top, alto, alto * 0.15, 0, 1), 0, 1);
    let avanceContacto = p.constrain(p.map(rContacto.top, alto, alto * 0.25, 0, 1), 0, 1);
    let enPiezas = avancePiezas > 0;

    // --- Texturas y titulares: clases que activan las animaciones del CSS ---
    mostrarTexturas();
    marcarTitular(rTitulares);

    // --- Lugar de la piedra: posX y posY en píxeles desde el centro de la ventana ---
    let posX, posY, posZ;
    if (enPiezas) {
      // piezas: en el centro del halo · contacto: más chica, a la derecha
      let rHalo = destino.elt.getBoundingClientRect();
      let piezasX = rHalo.left + rHalo.width / 2 - p.width / 2;
      let piezasY = rHalo.top + rHalo.height / 2 - alto / 2;
      let contactoX = p.width * 0.2;
      let contactoY = rContacto.top + rContacto.height / 2 - alto / 2;
      if (esCelular) {
        // celular: centrada, en el tercio de arriba de la sección (el texto va abajo)
        contactoX = 0;
        contactoY = rContacto.top + rContacto.height * 0.32 - alto / 2;
      }
      posX = p.lerp(piezasX, contactoX, avanceContacto);
      posY = p.lerp(piezasY, contactoY, avanceContacto);
      posZ = p.lerp(0, zContacto, avanceContacto);
    } else {
      // portada → texto: se va a la izquierda y se aleja
      posX = p.lerp(0, -p.width / 4, avanceTexto);
      posY = 0;
      posZ = p.lerp(0, zCostado, avanceTexto);
      if (esCelular) {
        // celular: la piedra no acompaña el deslizamiento. Tiene tres lugares fijos en la pantalla
        // y salta al siguiente cuando la sección nueva ocupa la mitad de la pantalla
        let objetivoY, objetivoZ;
        if (rTitulares.top < alto * 0.5) {
          // 3) titulares: mismo lugar que en el texto, pero abierta (la apertura está más abajo)
          objetivoY = -alto * 0.22;
          objetivoZ = zCostado;
          enPortadaCelular = false;
        } else if (rTexto.top < alto * 0.5) {
          // 2) texto: arriba y más chica, deja la mitad de abajo para el texto
          objetivoY = -alto * 0.22;
          objetivoZ = zCostado;
          enPortadaCelular = false;
        } else {
          // 1) portada: en el medio, grande
          objetivoY = -alto * 0.1;
          objetivoZ = 0;
          enPortadaCelular = true;
        }
        // lerp rápido (clase 15): el salto dura unas décimas de segundo
        celY = p.lerp(celY, objetivoY, 0.18);
        celZ = p.lerp(celZ, objetivoZ, 0.18);
        posX = 0;
        posY = celY;
        posZ = celZ;
      }
    }

    // perspectiva: cuanto más lejos (z negativa), más chico se ve todo
    let zTotal = posZ + entradaZ;
    let perspectiva = camaraZ / (camaraZ - zTotal); // 1 en z = 0, menos de 1 más lejos
    let radioActual = radioPantalla * perspectiva; // radio de la piedra en pantalla
    let centroX = p.width / 2 + posX; // centro de la piedra en pantalla
    let centroY = alto / 2 + posY;
    let distancia = p.dist(p.mouseX, p.mouseY, centroX, centroY);

    if (esCelular) {
      // --- Celular: no hay cursor que pase por arriba ---
      // se abre mientras el dedo toca la pantalla o mientras la página se desplaza.
      // Al deslizar, el navegador toma el gesto como scroll y mouseIsPressed vuelve a false:
      // por eso también se mira si window.scrollY (clase 15) cambió desde el frame anterior
      if (p.mouseIsPressed || window.scrollY != scrollAnterior) {
        ultimoToque = p.millis(); // millis(): clase 05
      }
      scrollAnterior = window.scrollY;
      // solo mientras la piedra está en su lugar de la portada
      let enPortada = entrada == 1 && enPortadaCelular;
      // sigue abierta 0,3 s después del último movimiento, para que no parpadee
      partida = enPortada && p.millis() - ultimoToque < 300;
    } else {
      // --- Computadora: hover con histéresis, solo en la portada y cuando terminó la entrada ---
      let hoverActivo = entrada == 1 && avanceTexto < 0.01;
      if (hoverActivo == false) {
        partida = false;
      } else if (partida == false && distancia < radioActual * 0.86) {
        partida = true;
      } else if (partida == true && distancia > radioActual * 1.12) {
        partida = false;
      }
    }

    // --- Cuánto se separan los pedazos antes del bloque de piezas, en "separaciones" ---
    // 0 = entera · 1 = abierta · 1 + aperturaExtra = dispersa (los pedazos ya no se ven)
    let separado = 0;
    if (rTitulares.top < alto * 0.5) {
      separado = 1 + avanceDispersion * aperturaExtra; // titulares: abierta; después se dispersa
    } else if (partida) {
      separado = 1; // abierta por el cursor (o por el dedo, en celular)
    }

    // --- Atracción hacia el cursor (apagada mientras se arman las piezas) ---
    // fuerza: 0 con el cursor lejos (a más de 3 radios), 1 al llegar al borde de la piedra
    let fuerza = p.map(distancia, radioActual * 3, radioActual, 0, 1);
    fuerza = p.constrain(fuerza, 0, 1);
    fuerza = fuerza * (1 - avancePiezas * (1 - avanceContacto));
    if (entrada < 1) {
      fuerza = 0; // durante la entrada no se mueve hacia el cursor
    }
    // la piedra se corre hasta un 15 % de la distancia que la separa del cursor
    let objetivoX = (p.mouseX - centroX) * fuerza * 0.15;
    let objetivoY = (p.mouseY - centroY) * fuerza * 0.15;
    atraccionX = p.lerp(atraccionX, objetivoX, 0.05);
    atraccionY = p.lerp(atraccionY, objetivoY, 0.05);

    // --- Luces (van en draw) ---
    // luz puntual que sigue al mouse, por delante de la piedra (z = 300)
    // mouseX y mouseY se pasan a coordenadas WEBGL restando la mitad del canvas
    luzX = p.lerp(luzX, p.mouseX - p.width / 2, 0.15);
    luzY = p.lerp(luzY, p.mouseY - alto / 2, 0.15);
    p.ambientLight(80); // luz ambiental suave: el lado en sombra no queda negro
    // la textura de la piedra es muy oscura y cada luz llega como máximo a 255:
    // se suman tres luces puntuales en el mismo punto (color: blanco del sistema)
    for (let i = 0; i < 3; i++) {
      p.pointLight(246, 245, 242, luzX, luzY, 300);
    }

    // --- Levitación de la piedra entera (todos los pedazos con la misma onda) ---
    let anguloJunto = p.frameCount * 0.02;
    let flotarJuntoX = p.cos(anguloJunto) * amplitudLevitacion * 0.3; // leve vaivén al costado
    let flotarJuntoY = p.sin(anguloJunto) * amplitudLevitacion; // sube y baja

    // --- Centro de la piedra en coordenadas WEBGL ---
    // los píxeles de pantalla se dividen por la perspectiva para que, aunque esté lejos,
    // la piedra quede en ese lugar de la ventana
    let piedraX = (posX + atraccionX) / perspectiva;
    let piedraY = (posY + atraccionY) / perspectiva;
    let piedraZ = zTotal;

    // --- Dibujo de los pedazos ---
    p.noStroke();
    p.texture(textura);

    for (let i = 0; i < pedazos.length; i++) {
      // objetivo del desplazamiento: cuánto se aleja el pedazo de su lugar en la piedra
      let objetivo;
      if (enPiezas) {
        // colocado: en su lugar · suelto: se acerca desde la dispersión mientras entra la sección
        if (colocada[i]) {
          objetivo = 0;
        } else {
          objetivo = separacion * factores[i] * (1 + aperturaExtra) * (1 - avancePiezas);
        }
      } else {
        objetivo = separacion * factores[i] * separado;
      }
      // el desplazamiento se acerca de a poco al objetivo (movimiento suave)
      desplazamientos[i] = p.lerp(desplazamientos[i], objetivo, 0.1);
      let d = desplazamientos[i];
      // 0 = en su lugar, 1 = abierto, más de 1 = dispersándose
      let t = d / (separacion * factores[i]);

      // suelta: 1 = el pedazo está en su casillero de la izquierda, 0 = está en la piedra
      // al soltarlo en el halo, colocadaAnim pasa de 0 a 1 de a poco y el pedazo viaja
      if (colocada[i]) {
        colocadaAnim[i] = p.lerp(colocadaAnim[i], 1, 0.08);
      } else {
        colocadaAnim[i] = p.lerp(colocadaAnim[i], 0, 0.08);
      }
      let suelta = avancePiezas * (1 - colocadaAnim[i]) * (1 - avanceContacto);

      // levitación propia del pedazo: misma fórmula, con su fase y su velocidad
      let anguloPropio = p.frameCount * velocidades[i] + fases[i];
      let flotarPropioX = p.cos(anguloPropio) * amplitudLevitacion * 0.3;
      let flotarPropioY = p.sin(anguloPropio) * amplitudLevitacion;
      // entera: todos usan la onda común; abierta o suelta: cada uno la suya
      let mezcla = p.max(p.min(t, 1), suelta);
      let flotarX = p.lerp(flotarJuntoX, flotarPropioX, mezcla);
      let flotarY = p.lerp(flotarJuntoY, flotarPropioY, mezcla);

      // tamaño: a partir de 2 separaciones se achica, y a las 3,5 desaparece
      let tamano = p.map(t, 2, 3.5, 1, 0);
      tamano = p.constrain(tamano, 0, 1);
      tamano = p.lerp(tamano, 1, suelta); // suelto, se ve entero

      // A. Lugar del pedazo dentro de la piedra: su centro, alejado y levitando,
      //    girado y escalado como la piedra, y sumado al centro de la piedra
      let local = p.createVector(
        centrosPedazos[i].x - centro.x + direcciones[i].x * d + flotarX,
        centrosPedazos[i].y - centro.y + direcciones[i].y * d + flotarY,
        centrosPedazos[i].z - centro.z + direcciones[i].z * d
      );
      local.mult(escala);
      let enPiedra = girarComoPiedra(local, anguloGiro);
      enPiedra.add(piedraX, piedraY, piedraZ);

      // B. Lugar del pedazo suelto: el centro de su bloque HTML en pantalla
      let r = bloques[i].elt.getBoundingClientRect();
      let sueltoX = r.left + r.width / 2 - p.width / 2 + flotarPropioX * escalaSuelta;
      let sueltoY = r.top + r.height / 2 - alto / 2 + flotarPropioY * escalaSuelta;

      // mezcla entre los dos lugares y los dos tamaños
      let x = p.lerp(enPiedra.x, sueltoX, suelta);
      let y = p.lerp(enPiedra.y, sueltoY, suelta);
      let z = p.lerp(enPiedra.z, 0, suelta);
      let s = p.lerp(escala, escalaSuelta, suelta) * tamano;

      if (s > 0.001) {
        p.push();
        p.translate(x, y, z);
        p.rotateY(anguloGiro); // giro (rápido en la entrada, lento después)
        p.rotateX(p.PI); // el OBJ tiene la Y hacia arriba; en p5.js la Y va hacia abajo
        p.scale(s);
        // gira sobre su propio centro, más cuanto más separado está
        p.rotateX(giros[i].x * t);
        p.rotateY(giros[i].y * t);
        p.rotateZ(giros[i].z * t);
        p.translate(-centrosPedazos[i].x, -centrosPedazos[i].y, -centrosPedazos[i].z);
        p.model(pedazos[i]);
        p.pop();
      }
    }

    // --- Halo: la piedra completa en líneas, donde faltan pedazos ---
    let alfaHalo = avancePiezas * (1 - avanceContacto);
    if (alfaHalo > 0.01) {
      p.push();
      p.translate(piedraX, piedraY, piedraZ);
      p.rotateY(anguloGiro);
      p.rotateX(p.PI);
      p.scale(escala);
      p.translate(-centro.x, -centro.y, -centro.z);
      p.noFill();
      p.stroke(17, 17, 17, 70 * alfaHalo); // negro del sistema, transparente
      p.strokeWeight(1);
      for (let i = 0; i < pedazos.length; i++) {
        if (colocada[i] == false) {
          p.model(pedazos[i]);
        }
      }
      p.pop();
    }
  };

  // Gira un punto igual que la piedra: rotateY(angulo) y después rotateX(PI)
  // (las transformaciones se aplican al punto en orden inverso: primero rotateX)
  function girarComoPiedra(v, angulo) {
    // rotateX(PI): la Y y la Z cambian de signo
    let x = v.x;
    let y = -v.y;
    let z = -v.z;
    // rotateY(angulo)
    let c = p.cos(angulo);
    let s = p.sin(angulo);
    return p.createVector(x * c + z * s, y, -x * s + z * c);
  }

  // --- Arrastrar y soltar (clase 10) ---
  function inicioDrag(bloque) {
    dragueando = bloque;
    difX = p.mouseX - bloque.position().x;
    difY = p.mouseY - bloque.position().y;
    posXactual = bloque.position().x;
    posYactual = bloque.position().y;
  }

  function finDrag(bloque) {
    dragueando = null;
    // posición del bloque y del destino, relativas a la sección
    let bx = bloque.position().x;
    let by = bloque.position().y;
    let dx = destino.position().x;
    let dy = destino.position().y;
    if (bx + bloque.width > dx && bx < dx + destino.width && by + bloque.height > dy && by < dy + destino.height) {
      let indice = p.int(bloque.attribute("data-info"));
      // si ya había otra pieza en la piedra, vuelve a su casillero: una sola pieza por vez
      if (piezaEnPiedra != -1) {
        let anterior = bloques[piezaEnPiedra];
        colocada[piezaEnPiedra] = false; // el pedazo 3D viaja de la piedra al casillero
        anterior.position(casilleroX[piezaEnPiedra], casilleroY[piezaEnPiedra]);
        anterior.style("visibility", "visible");
      }
      // colisión: la pieza pasa a la piedra y el bloque se oculta
      colocada[indice] = true;
      piezaEnPiedra = indice;
      bloque.style("visibility", "hidden");
      detalle.html(
        "<span class='numero-rojo'>0" + (indice + 1) + "</span>" +
          "<h2 class='titular-l'>" + nombres[indice] + "</h2>" +
          "<p class='texto-l'>" + info[indice] + "</p>"
      );
    } else {
      // sin colisión: vuelve a donde estaba
      bloque.position(posXactual, posYactual);
    }
  }

  // Ubica los bloques sueltos en una grilla:
  // computadora: 2 columnas a la izquierda de la sección · celular: 4 columnas abajo, centradas
  function ubicarBloques() {
    let altoSeccion = seccionPiezas.elt.offsetHeight;
    let columnas, espacio, lado, inicioX, inicioY;
    if (esCelular) {
      columnas = 4;
      espacio = 10;
      lado = p.min(80, (p.width - 2 * 20 - 3 * espacio) / 4);
      let filas = p.ceil(bloques.length / columnas); // 7 piezas en 4 columnas = 2 filas
      inicioX = (p.width - (columnas * lado + (columnas - 1) * espacio)) / 2;
      inicioY = altoSeccion - 24 - (filas * lado + (filas - 1) * espacio);
    } else {
      let altoHeader = 72;
      columnas = 2;
      espacio = 16;
      // lado de cada casillero: 150 px, o menos si la ventana es baja
      lado = p.min(150, (altoSeccion - altoHeader - 80 - 3 * espacio) / 4);
      inicioX = 72;
      inicioY = altoHeader + (altoSeccion - altoHeader - (4 * lado + 3 * espacio)) / 2;
    }
    for (let i = 0; i < bloques.length; i++) {
      let columna = i % columnas;
      let fila = p.floor(i / columnas);
      bloques[i].size(lado, lado);
      // se guarda el casillero para poder devolver el bloque a su lugar
      casilleroX[i] = inicioX + columna * (lado + espacio);
      casilleroY[i] = inicioY + fila * (lado + espacio);
      if (colocada[i] == false) {
        bloques[i].position(casilleroX[i], casilleroY[i]);
      }
    }
    // el pedazo más grande ocupa el 80 % del casillero
    escalaSuelta = (lado * 0.8) / tamanoPiezaMax;
  }

  // Menú de celular: el botón abre y cierra el panel; tocar un enlace lo cierra.
  // Solo funciones vistas: elemento.mouseClicked() (clase 09), class() (clase 08),
  // html() (clase 10) y attribute() (clase 09)
  let menuAbierto = false;

  function prepararMenu() {
    let menu = p.select("#menu");
    let botonMenu = p.select("#boton-menu");
    botonMenu.mouseClicked(function () {
      if (menuAbierto == false) {
        menuAbierto = true;
        menu.class("nav-lista abierto"); // class() reemplaza las clases del elemento
        botonMenu.html("CERRAR");
        botonMenu.attribute("aria-expanded", "true");
      } else {
        cerrarMenu(menu, botonMenu);
      }
    });
    let enlaces = p.selectAll("#menu a");
    for (let i = 0; i < enlaces.length; i++) {
      enlaces[i].mouseClicked(function () {
        cerrarMenu(menu, botonMenu);
      });
    }
  }

  function cerrarMenu(menu, botonMenu) {
    menuAbierto = false;
    menu.class("nav-lista");
    botonMenu.html("MENÚ");
    botonMenu.attribute("aria-expanded", "false");
  }

  // Agrega o saca la clase "visible" de cada textura: la animación la hace el CSS
  function mostrarTexturas() {
    for (let i = 0; i < texturas.length; i++) {
      let r = texturas[i].elt.getBoundingClientRect();
      // se considera en pantalla si cubre la franja central de la ventana
      if (r.top < p.height * 0.7 && r.bottom > p.height * 0.3) {
        texturas[i].addClass("visible");
      } else {
        texturas[i].removeClass("visible");
      }
    }
  }

  // Marca como "activo" el titular que corresponde al scroll: el CSS lo agranda
  function marcarTitular(r) {
    let recorrido = r.height - p.height; // cuánto se scrollea con la lista fija
    let progreso = p.constrain(-r.top / recorrido, 0, 0.999);
    let activo = p.floor(progreso * titulares.length); // 0, 1, 2 o 3
    for (let i = 0; i < titulares.length; i++) {
      if (i == activo) {
        titulares[i].addClass("activo");
      } else {
        titulares[i].removeClass("activo");
      }
    }
  }

  // Medidas que dependen del tamaño de la ventana
  function calcularMedidas() {
    // en la portada, la piedra ocupa el 45 % del lado más corto de la ventana
    esCelular = p.width <= 700;
    // en celular la piedra es más grande: 60 % (el halo del CSS también pasa a 60vmin)
    let proporcion = 0.45;
    if (esCelular) {
      proporcion = 0.6;
    }
    escala = (p.min(p.width, p.height) * proporcion) / tamanoPiedra;
    radioPantalla = (tamanoPiedra / 2) * escala;
  }

  p.windowResized = function () {
    p.resizeCanvas(p.windowWidth, p.windowHeight);
    if (bloques.length > 0) {
      calcularMedidas();
      ubicarBloques();
      destino = p.select("#halo"); // vuelve a leer el ancho y el alto del halo
    }
  };
};

// crea el sketch adentro del div con id "lienzo-piedra"
new p5(sketchPiedra, "lienzo-piedra");
