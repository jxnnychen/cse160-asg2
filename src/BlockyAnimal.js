// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE = `
  attribute vec4 a_Position;
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_GlobalRotateMatrix;
  void main() {
    gl_Position = u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
  }`

// Fragment shader program
var FSHADER_SOURCE = `
  precision mediump float;
  uniform vec4 u_FragColor;
  void main() {
    gl_FragColor = u_FragColor;
  }`

// add global vars
let canvas;
let gl;
let a_Position;
let u_FragColor;
let u_ModelMatrix;
let u_GlobalRotateMatrix;

let g_globalAngle = 0;
let g_headAngle = 0;
let g_headAngleY = 0;
let g_headAngleX = 0;
let g_bodyAngle = 0;
let g_bodyHopOffset = 0;
let g_tailAngle = 0;
let g_tailSegment2Angle = 0;
let g_tailTipAngle = 0;
let g_tailYAngle = 0;
let g_frontLeftLegAngle = 0;
let g_frontRightLegAngle = 0;
let g_backLeftLegAngle = 0;
let g_backRightLegAngle = 0;


// let g_yellowAngle = 0;
// let g_magentaAngle = 0;

let g_headAnimation = false;
let g_bodyAnimation = false;
let g_tailAnimation = false;
let g_legsAnimation = false;
// let g_yellowAnimation = false;
// let g_magentaAnimation = false;

// mouse tracking 
let g_isDragging = false;
let g_lastX = -1;
let g_lastY = -1;
let g_xRotation = 0;
let g_yRotation = 0;

let g_isPoking = false;
let g_pokeStartTime = 0;
let g_pokeDuration = 1.5; 

function setupWebGL() {
  // Retrieve <canvas> element
  canvas = document.getElementById('webgl');

  // Get the rendering context for WebGL
  // gl = getWebGLContext(canvas);
  gl = canvas.getContext("webgl", {preserveDrawingBuffer: true});
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }

  gl.enable(gl.DEPTH_TEST);
}

function connectVariablesToGLSL(){
  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }

  // Get the storage location of a_Position
  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return;
  }

  // Get the storage location of u_FragColor
  u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  if (!u_FragColor) {
    console.log('Failed to get the storage location of u_FragColor');
    return;
  }

  // Get the storage location of u_ModelMatrix
  u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  if (!u_ModelMatrix) {
    console.log('Failed to get the storage location of u_ModelMatrix');
    return;
  }

  u_GlobalRotateMatrix = gl.getUniformLocation(gl.program, 'u_GlobalRotateMatrix');
  if (!u_GlobalRotateMatrix) {
    console.log('Failed to get the storage location of u_GlobalRotateMatrix');
    return;
  }

  var identityM = new Matrix4();
  gl.uniformMatrix4fv(u_ModelMatrix, false, identityM.elements);

}

function setupControls() {

  document.getElementById('angleSlide').addEventListener('mousemove', function() {g_globalAngle = this.value; renderAllShapes();});
  document.getElementById('headSlide').addEventListener('mousemove', function() {g_headAngle = this.value; renderAllShapes();});
  document.getElementById('headYSlide').addEventListener('mousemove', function() {g_headAngleY = this.value; renderAllShapes();});
  document.getElementById('headXSlide').addEventListener('mousemove', function() {g_headAngleX = this.value; renderAllShapes();});
  document.getElementById('bodySlide').addEventListener('mousemove', function() {g_bodyAngle = this.value; renderAllShapes();});
  document.getElementById('tailSlide').addEventListener('mousemove', function() {g_tailAngle = this.value; renderAllShapes();});
  document.getElementById('tail2Slide').addEventListener('mousemove', function() {g_tailSegment2Angle = this.value; renderAllShapes();});
  document.getElementById('tail3Slide').addEventListener('mousemove', function() {g_tailTipAngle = this.value; renderAllShapes();});
  document.getElementById('tailYSlide').addEventListener('mousemove', function() {g_tailYAngle = this.value; renderAllShapes();});
  document.getElementById('frontLeftLegSlide').addEventListener('mousemove', function() {g_frontLeftLegAngle = this.value; renderAllShapes();});
  document.getElementById('frontRightLegSlide').addEventListener('mousemove', function() {g_frontRightLegAngle = this.value; renderAllShapes();});
  document.getElementById('backLeftLegSlide').addEventListener('mousemove', function() {g_backLeftLegAngle = this.value; renderAllShapes();});
  document.getElementById('backRightLegSlide').addEventListener('mousemove', function() {g_backRightLegAngle = this.value; renderAllShapes();});

  // document.getElementById('yellowSlide').addEventListener('mousemove', function() {g_yellowAngle = this.value; renderAllShapes();})
  // document.getElementById('magentaSlide').addEventListener('mousemove', function() {g_magentaAngle = this.value; renderAllShapes();})

  document.getElementById('animationHeadOffButton').onclick = function() {g_headAnimation = false;};
  document.getElementById('animationHeadOnButton').onclick = function() {g_headAnimation = true;};
  document.getElementById('animationBodyOffButton').onclick = function() {g_bodyAnimation = false;};
  document.getElementById('animationBodyOnButton').onclick = function() {g_bodyAnimation = true;};
  document.getElementById('animationTailOffButton').onclick = function() {g_tailAnimation = false;};
  document.getElementById('animationTailOnButton').onclick = function() {g_tailAnimation = true;};  
  document.getElementById('animationLegsOffButton').onclick = function() {g_legsAnimation = false;};
  document.getElementById('animationLegsOnButton').onclick = function() {g_legsAnimation = true;};
  // document.getElementById('animationYellowOffButton').onclick = function() {g_yellowAnimation = false;};
  // document.getElementById('animationYellowOnButton').onclick = function() {g_yellowAnimation = true;};
  // document.getElementById('animationMagentaOffButton').onclick = function() {g_magentaAnimation = false;};
  // document.getElementById('animationMagentaOnButton').onclick = function() {g_magentaAnimation = true;};

}

function main() {

  setupWebGL();
  connectVariablesToGLSL();
  setupControls();

  // Register function (event handler) to be called on a mouse press
  canvas.onmousedown = function(ev) {
    g_isDragging = true;
    g_lastX = ev.clientX;
    g_lastY = ev.clientY;
  };
  canvas.onmouseup = function(ev) {
    g_isDragging = false;
  };

  canvas.onmouseleave = function(ev) {
    g_isDragging = false;
  };
  
  canvas.onmousemove = function(ev) {
    if (!g_isDragging) return;

    const dx = ev.clientX - g_lastX;
    const dy = ev.clientY - g_lastY;
    g_lastX = ev.clientX;
    g_lastY = ev.clientY;

    g_yRotation -= dx / 1;
    g_xRotation -= dy / 1;

    renderAllShapes();
  };

  canvas.onclick = function(ev) {
    if (ev.shiftKey) {
      g_isPoking = true;
      g_pokeStartTime = g_seconds;
      console.log("poke animation");
    }
  };

  // Specify the color for clearing <canvas>
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  requestAnimationFrame(tick);
}

var g_startTime=performance.now()/1000.0;
var g_seconds=performance.now()/1000.0-g_startTime;

function tick() {
  g_seconds=performance.now()/1000.0-g_startTime;
  updateAnimationAngles();
  renderAllShapes();
  requestAnimationFrame(tick);
}
 
function convertCoordinatesEventToGL(ev){
  var x = ev.clientX; // x coordinate of a mouse pointer
  var y = ev.clientY; // y coordinate of a mouse pointer
  var rect = ev.target.getBoundingClientRect();

  x = ((x - rect.left) - canvas.width/2)/(canvas.width/2);
  y = (canvas.height/2 - (y - rect.top))/(canvas.height/2);

  return([x,y]);
}

function updateAnimationAngles() {
  // if (g_yellowAnimation) {
  //   g_yellowAngle = (45*Math.sin(g_seconds));
  // }
  // if (g_magentaAnimation) {
  //   g_magentaAngle = (45*Math.sin(3*g_seconds));
  // }
  if (g_isPoking) {
    const pokeElapsed = g_seconds - g_pokeStartTime;
    if (pokeElapsed > g_pokeDuration) {
      // complete
      g_isPoking = false;
    } else {
      const progress = pokeElapsed / g_pokeDuration;
      if (progress < 0.3) {
        const curlProgress = progress / 0.3;
        g_bodyAngle = 90 * curlProgress;
        g_frontLegsAngle = 30 * curlProgress;
        g_backLegsAngle = 30 * curlProgress;
        g_headAngleX = -60 * curlProgress;
        g_tailAngle = 45 * curlProgress;
        g_tailSegment2Angle = 30 * curlProgress;
        g_tailTipAngle = 20 * curlProgress;
        g_bodyHopOffset = -0.1;
      }
    }
  }

  if (g_headAnimation) {
    g_headAngle = (20*Math.sin(2*g_seconds));
  }
  if (g_bodyAnimation) {
    g_bodyAngle = (15*Math.sin(g_seconds));
  }
  if (g_tailAnimation) {
    g_tailAngle = (5*Math.sin(3*g_seconds));
    g_tailSegment2Angle = (10*Math.sin(3*g_seconds + 0.5));
    g_tailTipAngle = (5*Math.sin(3*g_seconds + 1.0));

    g_tailYAngle = (10*Math.sin(2*g_seconds + 0.7));
  }
  if (g_legsAnimation) {
    g_frontLeftLegAngle = (25*Math.sin(3*g_seconds));
    g_frontRightLegAngle = (25*Math.sin(3*g_seconds + Math.PI));
    g_backLeftLegAngle = (25*Math.sin(3*g_seconds));
    g_backRightLegAngle = (25*Math.sin(3*g_seconds + Math.PI));
    
  }
}

function renderAllShapes() {
  var startTime = performance.now()

  var globalRotMat = new Matrix4()
    .rotate(g_globalAngle, 0, 1, 0)
    .rotate(g_xRotation, 1, 0, 0)
    .rotate(g_yRotation, 0, 1, 0);
  gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);


  const blockSize = 0.0533;

  // body dimension
  const bodyWidth = 8 * blockSize;
  const bodyLength = 11 * blockSize;
  const bodyHeight = 6 * blockSize;

  // head dimension
  const headWidth = 10 * blockSize;
  const headLength = 6 * blockSize;
  const headHeight = 6 * blockSize;

  // ears dimension
  const earWidth = 2 * blockSize;
  const earLength = 1 * blockSize;
  const earHeight = 2 * blockSize;

  // snout dimension
  const snoutWidth = 4 * blockSize;
  const snoutLength = 3 * blockSize;
  const snoutHeight = 2 * blockSize;

  // leg dimension
  const legWidth = 2 * blockSize;
  const legLength = 2 * blockSize;
  const legHeight = 5 * blockSize;

  // tail dimension
  const tailWidth = 4 * blockSize;
  const tailLength = 10 * blockSize;
  const tailHeight = 5 * blockSize;

  // body
  var body = new Cube();
  body.color = [1.0, 0.6, 0.2, 1.0];
  body.matrix.translate(0, g_bodyHopOffset, 0);
  body.matrix.rotate(g_bodyAngle, 0, 1, 0);
  var bodyMatrix = new Matrix4(body.matrix);
  body.matrix.translate(-bodyWidth/2, -bodyHeight/2, -bodyLength/2);
  body.matrix.scale(bodyWidth, bodyHeight, bodyLength);
  body.render();

  // head
  var head = new Cube();
  head.color = [1.0, 0.6, 0.2, 1.0];
  head.matrix = new Matrix4(bodyMatrix);
  head.matrix.translate(-.26, -.20, -.6);

  var headCenterX = headWidth / 2;
  var headCenterY = headHeight / 2;
  var headCenterZ = headLength / 2;
  head.matrix.translate(headCenterX, headCenterY, headCenterZ);
  head.matrix.rotate(g_headAngle, 0, 0, 1);
  head.matrix.rotate(g_headAngleY, 1, 0, 0);
  head.matrix.rotate(g_headAngleX, 0, 1, 0);
  head.matrix.translate(-headCenterX, -headCenterY, -headCenterZ);

  var headMatrix = new Matrix4(head.matrix);

  head.matrix.scale(headWidth, headHeight, headLength);
  head.render();
 
  // left ear
  var leftEar = new Cube();
  leftEar.color = [0.9, 0.5, 0.1, 1.0];
  leftEar.matrix = new Matrix4(headMatrix);
  leftEar.matrix.translate(0, headHeight, headLength * 0.2);
  leftEar.matrix.scale(earWidth, earHeight, earLength);
  leftEar.render();

  // right ear
  var rightEar = new Cube();
  rightEar.color = [0.9, 0.5, 0.1, 1.0];
  rightEar.matrix = new Matrix4(headMatrix);
  rightEar.matrix.translate(headWidth-earWidth, headHeight, headLength * 0.2);
  rightEar.matrix.scale(earWidth, earHeight, earLength);
  rightEar.render();

  // snout
  var snout = new Cube();
  snout.color = [0.85, 0.45, 0.1, 1.0];
  snout.matrix = new Matrix4(headMatrix);
  snout.matrix.translate(headWidth * 0.3, 0, -snoutLength);
  snout.matrix.scale(snoutWidth, snoutHeight, snoutLength);
  snout.render();

  // right front leg
  var frontRightLeg = new Cube();
  frontRightLeg.color = [0.9, 0.5, 0.1, 1.0];
  frontRightLeg.matrix = new Matrix4(bodyMatrix);
  frontRightLeg.matrix.translate(0.08, -legHeight/2-bodyHeight/2+0.05, -.26);
  frontRightLeg.matrix.rotate(g_frontRightLegAngle, 1, 0, 0);
  frontRightLeg.matrix.translate(0, -legHeight/2, 0);
  frontRightLeg.matrix.scale(legWidth, legHeight, legLength);
  frontRightLeg.render();

  // left front leg
  var frontLeftLeg = new Cube();
  frontLeftLeg.color = [0.9, 0.5, 0.1, 1.0];
  frontLeftLeg.matrix = new Matrix4(bodyMatrix);
  frontLeftLeg.matrix.translate(-.17, -legHeight/2-bodyHeight/2+0.05, -.26);
  frontLeftLeg.matrix.rotate(g_frontLeftLegAngle, 1, 0, 0);
  frontLeftLeg.matrix.translate(0, -legHeight/2, 0);
  frontLeftLeg.matrix.scale(legWidth, legHeight, legLength);
  frontLeftLeg.render();

  // right back leg
  var backRightLeg = new Cube();
  backRightLeg.color = [0.9, 0.5, 0.1, 1.0];
  backRightLeg.matrix = new Matrix4(bodyMatrix);
  backRightLeg.matrix.translate(0.08, -legHeight/2-bodyHeight/2+0.05, .14);
  backRightLeg.matrix.rotate(g_backRightLegAngle, 1,0 ,0);
  backRightLeg.matrix.translate(0, -legHeight/2, 0);
  backRightLeg.matrix.scale(legWidth, legHeight, legLength);
  backRightLeg.render();

  // left back leg
  var backLeftLeg = new Cube();
  backLeftLeg.color = [0.9, 0.5, 0.1, 1.0];
  backLeftLeg.matrix = new Matrix4(bodyMatrix);
  backLeftLeg.matrix.translate(-.17, -legHeight/2-bodyHeight/2+0.05, .14);
  backLeftLeg.matrix.rotate(g_backLeftLegAngle, 1,0 ,0);
  backLeftLeg.matrix.translate(0, -legHeight/2, 0);
  backLeftLeg.matrix.scale(legWidth, legHeight, legLength);
  backLeftLeg.render();

  // tail
  // var tail = new Cube();
  // tail.color = [0.95, 0.55, 0.15, 1.0];
  // tail.matrix = new Matrix4(bodyMatrix);
  // tail.matrix.rotate(g_tailAngle, 0, 1, 1);
  // tail.matrix.translate(-tailWidth/2, -0.5*tailHeight, bodyLength/2);
  // tail.matrix.scale(tailWidth, tailHeight, tailLength);
  // tail.render();

  // tail segment 1
  var tailBase = new Cube();
  tailBase.color = [0.95, 0.55, 0.15, 1.0];
  tailBase.matrix = new Matrix4(bodyMatrix);
  tailBase.matrix.translate(-tailWidth/2, -0.5*tailHeight, bodyLength/2);
  tailBase.matrix.rotate(g_tailAngle, 0, 1, 0);
  tailBase.matrix.rotate(g_tailYAngle, 1, 0, 0);

  var tailSegment1Matrix = new Matrix4(tailBase.matrix);
  tailBase.matrix.scale(tailWidth, tailHeight, tailLength/3);
  tailBase.render();

  // tail segment 2
  var tailMiddle = new Cube();
  tailMiddle.color = [0.95, 0.55, 0.15, 1.0];
  tailMiddle.matrix = new Matrix4(tailSegment1Matrix);
  // Position at the end of the first segment
  tailMiddle.matrix.translate(0.02, 0, tailLength/3);
  tailMiddle.matrix.rotate(g_tailSegment2Angle, 0, 1, 0);  
  // Store this transformation for the cone tip
  var tailSegment2Matrix = new Matrix4(tailMiddle.matrix);
  // Complete the transformation for this segment (slightly smaller)
  tailMiddle.matrix.scale(tailWidth * 0.8, tailHeight * 0.8, tailLength/3);
  tailMiddle.render();

  // tail segment 3
  var tailTip = new Cone();
  tailTip.color = [1, .95, .9, 1.0];
  tailTip.segments = 16; // Higher segment count for smoother cone
  tailTip.matrix = new Matrix4(tailSegment2Matrix);
  tailTip.matrix.translate(tailWidth * 0.4, tailHeight * 0.4, tailLength/3);
  tailTip.matrix.rotate(g_tailTipAngle, 0, 1, 0);
  tailTip.matrix.rotate(90, 1, 0, 0); // Rotate to point the cone in the right direction
  
  // Scale to appropriate size
  tailTip.matrix.scale(tailWidth * 0.4, tailLength/4, tailHeight * 0.4);
  tailTip.render();


  // var body = new Cube();
  // body.color = [1.0, 0.0, 0.0, 1.0];
  // body.matrix.translate(-.25,-0.75, 0.0);
  // body.matrix.rotate(-5,1,0,0);
  // body.matrix.scale(0.5, .3, 0.5);
  // body.render();

  // var leftArm = new Cube();
  // leftArm.color = [1.0, 1, 0.0, 1.0];
  // leftArm.matrix.setTranslate(0,-.5, 0.0);
  // leftArm.matrix.rotate(-5, 1, 0, 0);

  // leftArm.matrix.rotate(-g_yellowAngle, 0, 0, 1);

  // var yellowCoordinatesMat = new Matrix4(leftArm.matrix);
  // leftArm.matrix.scale(0.25, .7, 0.5);
  // leftArm.matrix.translate(-0.5, 0, 0);
  // leftArm.render();
  
  // var box = new Cube();
  // box.color = [1.0, 0, 1, 1.0];
  // box.matrix = yellowCoordinatesMat;
  // box.matrix.translate(0, 0.65, 0);
  // box.matrix.rotate(g_magentaAngle, 0, 0, 1);
  // box.matrix.scale(0.3, .3, 0.3);
  // box.matrix.translate(-.5,0,-0.001);
  // box.render();

  // var K = 10;
  // for (var i = 1; i < K; i++) {
  //   var c = new Cube();
  //   c.matrix.translate(-.8,1.9 * i/K-1.0, 0);
  //   c.matrix.rotate(g_seconds*100,1,1,1);
  //   c.matrix.scale(.1, 0.5/K, 1.0/K);
  //   c.render();
  // }

 

  var duration = performance.now() - startTime;
  sendTextToHTML(" ms: " + Math.floor(duration) + " fps: " + Math.floor(10000/duration)/10, "numdot")
}

function sendTextToHTML(text, htmlID) {
  var htmlElm = document.getElementById(htmlID);
  if (!htmlElm) {
    console.log("Failed to get " + htmlID + " from HTML");
    return;
  }
  htmlElm.innerHTML = text;
}
