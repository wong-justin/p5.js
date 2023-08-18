import p5 from '../core/main';
import * as constants from '../core/constants';
import GeometryBuilder from './GeometryBuilder';
import libtess from 'libtess';
import './p5.Shader';
import './p5.Camera';
import '../core/p5.Renderer';
import './p5.Matrix';
import './p5.Framebuffer';
import { readFileSync } from 'fs';
import { join } from 'path';

const STROKE_CAP_ENUM = {};
const STROKE_JOIN_ENUM = {};
let lineDefs = '';
const defineStrokeCapEnum = function (key, val) {
  lineDefs += `#define STROKE_CAP_${key} ${val}\n`;
  STROKE_CAP_ENUM[constants[key]] = val;
};
const defineStrokeJoinEnum = function (key, val) {
  lineDefs += `#define STROKE_JOIN_${key} ${val}\n`;
  STROKE_JOIN_ENUM[constants[key]] = val;
};

// Define constants in line shaders for each type of cap/join, and also record
// the values in JS objects
defineStrokeCapEnum('ROUND', 0);
defineStrokeCapEnum('PROJECT', 1);
defineStrokeCapEnum('SQUARE', 2);
defineStrokeJoinEnum('ROUND', 0);
defineStrokeJoinEnum('MITER', 1);
defineStrokeJoinEnum('BEVEL', 2);

const lightingShader = readFileSync(
  join(__dirname, '/shaders/lighting.glsl'),
  'utf-8'
);
const webgl2CompatibilityShader = readFileSync(
  join(__dirname, '/shaders/webgl2Compatibility.glsl'),
  'utf-8'
);

const defaultShaders = {
  immediateVert: readFileSync(
    join(__dirname, '/shaders/immediate.vert'),
    'utf-8'
  ),
  vertexColorVert: readFileSync(
    join(__dirname, '/shaders/vertexColor.vert'),
    'utf-8'
  ),
  vertexColorFrag: readFileSync(
    join(__dirname, '/shaders/vertexColor.frag'),
    'utf-8'
  ),
  normalVert: readFileSync(join(__dirname, '/shaders/normal.vert'), 'utf-8'),
  normalFrag: readFileSync(join(__dirname, '/shaders/normal.frag'), 'utf-8'),
  basicFrag: readFileSync(join(__dirname, '/shaders/basic.frag'), 'utf-8'),
  lightVert:
    lightingShader +
    readFileSync(join(__dirname, '/shaders/light.vert'), 'utf-8'),
  lightTextureFrag: readFileSync(
    join(__dirname, '/shaders/light_texture.frag'),
    'utf-8'
  ),
  phongVert: readFileSync(join(__dirname, '/shaders/phong.vert'), 'utf-8'),
  phongFrag:
    lightingShader +
    readFileSync(join(__dirname, '/shaders/phong.frag'), 'utf-8'),
  fontVert: webgl2CompatibilityShader +
    readFileSync(join(__dirname, '/shaders/font.vert'), 'utf-8'),
  fontFrag: webgl2CompatibilityShader +
    readFileSync(join(__dirname, '/shaders/font.frag'), 'utf-8'),
  lineVert:
    lineDefs + readFileSync(join(__dirname, '/shaders/line.vert'), 'utf-8'),
  lineFrag:
    lineDefs + readFileSync(join(__dirname, '/shaders/line.frag'), 'utf-8'),
  pointVert: readFileSync(join(__dirname, '/shaders/point.vert'), 'utf-8'),
  pointFrag: readFileSync(join(__dirname, '/shaders/point.frag'), 'utf-8')
};

const filterShaderFrags = {
  [constants.GRAY]:
    readFileSync(join(__dirname, '/shaders/filters/gray.frag'), 'utf-8'),
  [constants.ERODE]:
    readFileSync(join(__dirname, '/shaders/filters/erode.frag'), 'utf-8'),
  [constants.DILATE]:
    readFileSync(join(__dirname, '/shaders/filters/dilate.frag'), 'utf-8'),
  [constants.BLUR]:
    readFileSync(join(__dirname, '/shaders/filters/blur.frag'), 'utf-8'),
  [constants.POSTERIZE]:
    readFileSync(join(__dirname, '/shaders/filters/posterize.frag'), 'utf-8'),
  [constants.OPAQUE]:
    readFileSync(join(__dirname, '/shaders/filters/opaque.frag'), 'utf-8'),
  [constants.INVERT]:
    readFileSync(join(__dirname, '/shaders/filters/invert.frag'), 'utf-8'),
  [constants.THRESHOLD]:
    readFileSync(join(__dirname, '/shaders/filters/threshold.frag'), 'utf-8')
};
const filterShaderVert = readFileSync(join(__dirname, '/shaders/filters/default.vert'), 'utf-8');

/**
 * @module Rendering
 * @submodule Rendering
 * @for p5
 */
/**
 * Set attributes for the WebGL Drawing context.
 * This is a way of adjusting how the WebGL
 * renderer works to fine-tune the display and performance.
 *
 * Note that this will reinitialize the drawing context
 * if called after the WebGL canvas is made.
 *
 * If an object is passed as the parameter, all attributes
 * not declared in the object will be set to defaults.
 *
 * The available attributes are:
 * <br>
 * alpha - indicates if the canvas contains an alpha buffer
 * default is true
 *
 * depth - indicates whether the drawing buffer has a depth buffer
 * of at least 16 bits - default is true
 *
 * stencil - indicates whether the drawing buffer has a stencil buffer
 * of at least 8 bits
 *
 * antialias - indicates whether or not to perform anti-aliasing
 * default is false (true in Safari)
 *
 * premultipliedAlpha - indicates that the page compositor will assume
 * the drawing buffer contains colors with pre-multiplied alpha
 * default is true
 *
 * preserveDrawingBuffer - if true the buffers will not be cleared and
 * and will preserve their values until cleared or overwritten by author
 * (note that p5 clears automatically on draw loop)
 * default is true
 *
 * perPixelLighting - if true, per-pixel lighting will be used in the
 * lighting shader otherwise per-vertex lighting is used.
 * default is true.
 *
 * version - either 1 or 2, to specify which WebGL version to ask for. By
 * default, WebGL 2 will be requested. If WebGL2 is not available, it will
 * fall back to WebGL 1. You can check what version is used with by looking at
 * the global `webglVersion` property.
 *
 * @method setAttributes
 * @for p5
 * @param  {String}  key Name of attribute
 * @param  {Boolean}        value New value of named attribute
 * @example
 * <div>
 * <code>
 * function setup() {
 *   createCanvas(100, 100, WEBGL);
 * }
 *
 * function draw() {
 *   background(255);
 *   push();
 *   rotateZ(frameCount * 0.02);
 *   rotateX(frameCount * 0.02);
 *   rotateY(frameCount * 0.02);
 *   fill(0, 0, 0);
 *   box(50);
 *   pop();
 * }
 * </code>
 * </div>
 * <br>
 * Now with the antialias attribute set to true.
 * <br>
 * <div>
 * <code>
 * function setup() {
 *   setAttributes('antialias', true);
 *   createCanvas(100, 100, WEBGL);
 * }
 *
 * function draw() {
 *   background(255);
 *   push();
 *   rotateZ(frameCount * 0.02);
 *   rotateX(frameCount * 0.02);
 *   rotateY(frameCount * 0.02);
 *   fill(0, 0, 0);
 *   box(50);
 *   pop();
 * }
 * </code>
 * </div>
 *
 * <div>
 * <code>
 * // press the mouse button to disable perPixelLighting
 * function setup() {
 *   createCanvas(100, 100, WEBGL);
 *   noStroke();
 *   fill(255);
 * }
 *
 * let lights = [
 *   { c: '#f00', t: 1.12, p: 1.91, r: 0.2 },
 *   { c: '#0f0', t: 1.21, p: 1.31, r: 0.2 },
 *   { c: '#00f', t: 1.37, p: 1.57, r: 0.2 },
 *   { c: '#ff0', t: 1.12, p: 1.91, r: 0.7 },
 *   { c: '#0ff', t: 1.21, p: 1.31, r: 0.7 },
 *   { c: '#f0f', t: 1.37, p: 1.57, r: 0.7 }
 * ];
 *
 * function draw() {
 *   let t = millis() / 1000 + 1000;
 *   background(0);
 *   directionalLight(color('#222'), 1, 1, 1);
 *
 *   for (let i = 0; i < lights.length; i++) {
 *     let light = lights[i];
 *     pointLight(
 *       color(light.c),
 *       p5.Vector.fromAngles(t * light.t, t * light.p, width * light.r)
 *     );
 *   }
 *
 *   specularMaterial(255);
 *   sphere(width * 0.1);
 *
 *   rotateX(t * 0.77);
 *   rotateY(t * 0.83);
 *   rotateZ(t * 0.91);
 *   torus(width * 0.3, width * 0.07, 24, 10);
 * }
 *
 * function mousePressed() {
 *   setAttributes('perPixelLighting', false);
 *   noStroke();
 *   fill(255);
 * }
 * function mouseReleased() {
 *   setAttributes('perPixelLighting', true);
 *   noStroke();
 *   fill(255);
 * }
 * </code>
 * </div>
 *
 * @alt a rotating cube with smoother edges
 */
/**
 * @method setAttributes
 * @for p5
 * @param  {Object}  obj object with key-value pairs
 */
p5.prototype.setAttributes = function (key, value) {
  if (typeof this._glAttributes === 'undefined') {
    console.log(
      'You are trying to use setAttributes on a p5.Graphics object ' +
      'that does not use a WEBGL renderer.'
    );
    return;
  }
  let unchanged = true;
  if (typeof value !== 'undefined') {
    //first time modifying the attributes
    if (this._glAttributes === null) {
      this._glAttributes = {};
    }
    if (this._glAttributes[key] !== value) {
      //changing value of previously altered attribute
      this._glAttributes[key] = value;
      unchanged = false;
    }
    //setting all attributes with some change
  } else if (key instanceof Object) {
    if (this._glAttributes !== key) {
      this._glAttributes = key;
      unchanged = false;
    }
  }
  //@todo_FES
  if (!this._renderer.isP3D || unchanged) {
    return;
  }

  if (!this._setupDone) {
    for (const x in this._renderer.retainedMode.geometry) {
      if (this._renderer.retainedMode.geometry.hasOwnProperty(x)) {
        p5._friendlyError(
          'Sorry, Could not set the attributes, you need to call setAttributes() ' +
          'before calling the other drawing methods in setup()'
        );
        return;
      }
    }
  }

  this.push();
  this._renderer._resetContext();
  this.pop();

  if (this._renderer._curCamera) {
    this._renderer._curCamera._renderer = this._renderer;
  }
};
/**
 * @private
 * @param {Uint8Array|Float32Array|undefined} pixels An existing pixels array to reuse if the size is the same
 * @param {WebGLRenderingContext} gl The WebGL context
 * @param {WebGLFramebuffer|null} framebuffer The Framebuffer to read
 * @param {Number} x The x coordiante to read, premultiplied by pixel density
 * @param {Number} y The y coordiante to read, premultiplied by pixel density
 * @param {Number} width The width in pixels to be read (factoring in pixel density)
 * @param {Number} height The height in pixels to be read (factoring in pixel density)
 * @param {GLEnum} format Either RGB or RGBA depending on how many channels to read
 * @param {GLEnum} type The datatype of each channel, e.g. UNSIGNED_BYTE or FLOAT
 * @param {Number|undefined} flipY If provided, the total height with which to flip the y axis about
 * @returns {Uint8Array|Float32Array} pixels A pixels array with the current state of the
 * WebGL context read into it
 */
export function readPixelsWebGL(
  pixels,
  gl,
  framebuffer,
  x,
  y,
  width,
  height,
  format,
  type,
  flipY
) {
  // Record the currently bound framebuffer so we can go back to it after, and
  // bind the framebuffer we want to read from
  const prevFramebuffer = gl.getParameter(gl.FRAMEBUFFER_BINDING);
  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);

  const channels = format === gl.RGBA ? 4 : 3;

  // Make a pixels buffer if it doesn't already exist
  const len = width * height * channels;
  const TypedArrayClass = type === gl.UNSIGNED_BYTE ? Uint8Array : Float32Array;
  if (!(pixels instanceof TypedArrayClass) || pixels.length !== len) {
    pixels = new TypedArrayClass(len);
  }

  gl.readPixels(
    x,
    flipY ? (flipY - y - height) : y,
    width,
    height,
    format,
    type,
    pixels
  );

  // Re-bind whatever was previously bound
  gl.bindFramebuffer(gl.FRAMEBUFFER, prevFramebuffer);

  if (flipY) {
    // WebGL pixels are inverted compared to 2D pixels, so we have to flip
    // the resulting rows. Adapted from https://stackoverflow.com/a/41973289
    const halfHeight = Math.floor(height / 2);
    const tmpRow = new TypedArrayClass(width * channels);
    for (let y = 0; y < halfHeight; y++) {
      const topOffset = y * width * 4;
      const bottomOffset = (height - y - 1) * width * 4;
      tmpRow.set(pixels.subarray(topOffset, topOffset + width * 4));
      pixels.copyWithin(topOffset, bottomOffset, bottomOffset + width * 4);
      pixels.set(tmpRow, bottomOffset);
    }
  }

  return pixels;
}

/**
 * @private
 * @param {WebGLRenderingContext} gl The WebGL context
 * @param {WebGLFramebuffer|null} framebuffer The Framebuffer to read
 * @param {Number} x The x coordinate to read, premultiplied by pixel density
 * @param {Number} y The y coordinate to read, premultiplied by pixel density
 * @param {GLEnum} format Either RGB or RGBA depending on how many channels to read
 * @param {GLEnum} type The datatype of each channel, e.g. UNSIGNED_BYTE or FLOAT
 * @param {Number|undefined} flipY If provided, the total height with which to flip the y axis about
 * @returns {Number[]} pixels The channel data for the pixel at that location
 */
export function readPixelWebGL(
  gl,
  framebuffer,
  x,
  y,
  format,
  type,
  flipY
) {
  // Record the currently bound framebuffer so we can go back to it after, and
  // bind the framebuffer we want to read from
  const prevFramebuffer = gl.getParameter(gl.FRAMEBUFFER_BINDING);
  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);

  const channels = format === gl.RGBA ? 4 : 3;
  const TypedArrayClass = type === gl.UNSIGNED_BYTE ? Uint8Array : Float32Array;
  const pixels = new TypedArrayClass(channels);

  gl.readPixels(
    x, flipY ? (flipY - y - 1) : y, 1, 1,
    format, type,
    pixels
  );

  // Re-bind whatever was previously bound
  gl.bindFramebuffer(gl.FRAMEBUFFER, prevFramebuffer);

  return Array.from(pixels);
}
/**
 * 3D graphics class
 * @private
 * @class p5.RendererGL
 * @constructor
 * @extends p5.Renderer
 * @todo extend class to include public method for offscreen
 * rendering (FBO).
 */
p5.RendererGL = class RendererGL extends p5.Renderer {
  constructor(elt, pInst, isMainCanvas, attr) {
    super(elt, pInst, isMainCanvas);
    this._setAttributeDefaults(pInst);
    this._initContext();
    this.isP3D = true; //lets us know we're in 3d mode

    // When constructing a new p5.Geometry, this will represent the builder
    this.geometryBuilder = undefined;

    // This redundant property is useful in reminding you that you are
    // interacting with WebGLRenderingContext, still worth considering future removal
    this.GL = this.drawingContext;
    this._pInst._setProperty('drawingContext', this.drawingContext);

    // erasing
    this._isErasing = false;

    // clipping
    this._clipDepth = null;

    // lights
    this._enableLighting = false;

    this.ambientLightColors = [];
    this.specularColors = [1, 1, 1];

    this.directionalLightDirections = [];
    this.directionalLightDiffuseColors = [];
    this.directionalLightSpecularColors = [];

    this.pointLightPositions = [];
    this.pointLightDiffuseColors = [];
    this.pointLightSpecularColors = [];

    this.spotLightPositions = [];
    this.spotLightDirections = [];
    this.spotLightDiffuseColors = [];
    this.spotLightSpecularColors = [];
    this.spotLightAngle = [];
    this.spotLightConc = [];

    this.drawMode = constants.FILL;

    this.curFillColor = this._cachedFillStyle = [1, 1, 1, 1];
    this.curAmbientColor = this._cachedFillStyle = [1, 1, 1, 1];
    this.curSpecularColor = this._cachedFillStyle = [0, 0, 0, 0];
    this.curEmissiveColor = this._cachedFillStyle = [0, 0, 0, 0];
    this.curStrokeColor = this._cachedStrokeStyle = [0, 0, 0, 1];

    this.curBlendMode = constants.BLEND;
    this._cachedBlendMode = undefined;
    if (this.webglVersion === constants.WEBGL2) {
      this.blendExt = this.GL;
    } else {
      this.blendExt = this.GL.getExtension('EXT_blend_minmax');
    }
    this._isBlending = false;


    this._hasSetAmbient = false;
    this._useSpecularMaterial = false;
    this._useEmissiveMaterial = false;
    this._useNormalMaterial = false;
    this._useShininess = 1;

    this._useLineColor = false;
    this._useVertexColor = false;

    this.registerEnabled = new Set();

    this._tint = [255, 255, 255, 255];

    // lightFalloff variables
    this.constantAttenuation = 1;
    this.linearAttenuation = 0;
    this.quadraticAttenuation = 0;

    /**
 * model view, projection, & normal
 * matrices
 */
    this.uMVMatrix = new p5.Matrix();
    this.uPMatrix = new p5.Matrix();
    this.uNMatrix = new p5.Matrix('mat3');

    // Current vertex normal
    this._currentNormal = new p5.Vector(0, 0, 1);

    // Camera
    this._curCamera = new p5.Camera(this);
    this._curCamera._computeCameraDefaultSettings();
    this._curCamera._setDefaultCamera();

    // Information about the previous frame's touch object
    // for executing orbitControl()
    this.prevTouches = [];
    // Velocity variable for use with orbitControl()
    this.zoomVelocity = 0;
    this.rotateVelocity = new p5.Vector(0, 0);
    this.moveVelocity = new p5.Vector(0, 0);
    // Flags for recording the state of zooming, rotation and moving
    this.executeZoom = false;
    this.executeRotateAndMove = false;

    this._defaultLightShader = undefined;
    this._defaultImmediateModeShader = undefined;
    this._defaultNormalShader = undefined;
    this._defaultColorShader = undefined;
    this._defaultPointShader = undefined;

    this.userFillShader = undefined;
    this.userStrokeShader = undefined;
    this.userPointShader = undefined;

    // Default drawing is done in Retained Mode
    // Geometry and Material hashes stored here
    this.retainedMode = {
      geometry: {},
      buffers: {
        stroke: [
          new p5.RenderBuffer(4, 'lineVertexColors', 'lineColorBuffer', 'aVertexColor', this),
          new p5.RenderBuffer(3, 'lineVertices', 'lineVerticesBuffer', 'aPosition', this),
          new p5.RenderBuffer(3, 'lineTangentsIn', 'lineTangentsInBuffer', 'aTangentIn', this),
          new p5.RenderBuffer(3, 'lineTangentsOut', 'lineTangentsOutBuffer', 'aTangentOut', this),
          new p5.RenderBuffer(1, 'lineSides', 'lineSidesBuffer', 'aSide', this)
        ],
        fill: [
          new p5.RenderBuffer(3, 'vertices', 'vertexBuffer', 'aPosition', this, this._vToNArray),
          new p5.RenderBuffer(3, 'vertexNormals', 'normalBuffer', 'aNormal', this, this._vToNArray),
          new p5.RenderBuffer(4, 'vertexColors', 'colorBuffer', 'aVertexColor', this),
          new p5.RenderBuffer(3, 'vertexAmbients', 'ambientBuffer', 'aAmbientColor', this),
          //new BufferDef(3, 'vertexSpeculars', 'specularBuffer', 'aSpecularColor'),
          new p5.RenderBuffer(2, 'uvs', 'uvBuffer', 'aTexCoord', this, this._flatten)
        ],
        text: [
          new p5.RenderBuffer(3, 'vertices', 'vertexBuffer', 'aPosition', this, this._vToNArray),
          new p5.RenderBuffer(2, 'uvs', 'uvBuffer', 'aTexCoord', this, this._flatten)
        ]
      }
    };

    // Immediate Mode
    // Geometry and Material hashes stored here
    this.immediateMode = {
      geometry: new p5.Geometry(),
      shapeMode: constants.TRIANGLE_FAN,
      contourIndices: [],
      _bezierVertex: [],
      _quadraticVertex: [],
      _curveVertex: [],
      buffers: {
        fill: [
          new p5.RenderBuffer(3, 'vertices', 'vertexBuffer', 'aPosition', this, this._vToNArray),
          new p5.RenderBuffer(3, 'vertexNormals', 'normalBuffer', 'aNormal', this, this._vToNArray),
          new p5.RenderBuffer(4, 'vertexColors', 'colorBuffer', 'aVertexColor', this),
          new p5.RenderBuffer(3, 'vertexAmbients', 'ambientBuffer', 'aAmbientColor', this),
          new p5.RenderBuffer(2, 'uvs', 'uvBuffer', 'aTexCoord', this, this._flatten)
        ],
        stroke: [
          new p5.RenderBuffer(4, 'lineVertexColors', 'lineColorBuffer', 'aVertexColor', this),
          new p5.RenderBuffer(3, 'lineVertices', 'lineVerticesBuffer', 'aPosition', this),
          new p5.RenderBuffer(3, 'lineTangentsIn', 'lineTangentsInBuffer', 'aTangentIn', this),
          new p5.RenderBuffer(3, 'lineTangentsOut', 'lineTangentsOutBuffer', 'aTangentOut', this),
          new p5.RenderBuffer(1, 'lineSides', 'lineSidesBuffer', 'aSide', this)
        ],
        point: this.GL.createBuffer()
      }
    };

    this.pointSize = 5.0; //default point size
    this.curStrokeWeight = 1;
    this.curStrokeCap = constants.ROUND;
    this.curStrokeJoin = constants.ROUND;

    // map of texture sources to textures created in this gl context via this.getTexture(src)
    this.textures = new Map();

    // set of framebuffers in use
    this.framebuffers = new Set();
    // stack of active framebuffers
    this.activeFramebuffers = [];

    // for post processing step
    this.filterShader = undefined;
    this.filterGraphicsLayer = undefined;
    this.defaultFilterShaders = {};

    this.textureMode = constants.IMAGE;
    // default wrap settings
    this.textureWrapX = constants.CLAMP;
    this.textureWrapY = constants.CLAMP;
    this._tex = null;
    this._curveTightness = 6;

    // lookUpTable for coefficients needed to be calculated for bezierVertex, same are used for curveVertex
    this._lookUpTableBezier = [];
    // lookUpTable for coefficients needed to be calculated for quadraticVertex
    this._lookUpTableQuadratic = [];

    // current curveDetail in the Bezier lookUpTable
    this._lutBezierDetail = 0;
    // current curveDetail in the Quadratic lookUpTable
    this._lutQuadraticDetail = 0;

    // Used to distinguish between user calls to vertex() and internal calls
    this.isProcessingVertices = false;
    this._tessy = this._initTessy();

    this.fontInfos = {};

    this._curShader = undefined;
  }

  /**
    * Starts creating a new p5.Geometry. Subsequent shapes drawn will be added
     * to the geometry and then returned when
     * <a href="#/p5/endGeometry">endGeometry()</a> is called. One can also use
     * <a href="#/p5/buildGeometry">buildGeometry()</a> to pass a function that
     * draws shapes.
     *
     * If you need to draw complex shapes every frame which don't change over time,
     * combining them upfront with `beginGeometry()` and `endGeometry()` and then
     * drawing that will run faster than repeatedly drawing the individual pieces.
     *
     * @method beginGeometry
   */
  beginGeometry() {
    if (this.geometryBuilder) {
      throw new Error('It looks like `beginGeometry()` is being called while another p5.Geometry is already being build.');
    }
    this.geometryBuilder = new GeometryBuilder(this);
  }

  /**
   * Finishes creating a new <a href="#/p5.Geometry">p5.Geometry</a> that was
   * started using <a href="#/p5/beginGeometry">beginGeometry()</a>. One can also
   * use <a href="#/p5/buildGeometry">buildGeometry()</a> to pass a function that
   * draws shapes.
   *
   * @method endGeometry
   * @returns {p5.Geometry} The model that was built.
   */
  endGeometry() {
    if (!this.geometryBuilder) {
      throw new Error('Make sure you call beginGeometry() before endGeometry()!');
    }
    const geometry = this.geometryBuilder.finish();
    this.geometryBuilder = undefined;
    return geometry;
  }

  /**
   * Creates a new <a href="#/p5.Geometry">p5.Geometry</a> that contains all
   * the shapes drawn in a provided callback function. The returned combined shape
   * can then be drawn all at once using <a href="#/p5/model">model()</a>.
   *
   * If you need to draw complex shapes every frame which don't change over time,
   * combining them with `buildGeometry()` once and then drawing that will run
   * faster than repeatedly drawing the individual pieces.
   *
   * One can also draw shapes directly between
   * <a href="#/p5/beginGeometry">beginGeometry()</a> and
   * <a href="#/p5/endGeometry">endGeometry()</a> instead of using a callback
   * function.
   *
   * @method buildGeometry
   * @param {Function} callback A function that draws shapes.
   * @returns {p5.Geometry} The model that was built from the callback function.
   */
  buildGeometry(callback) {
    this.beginGeometry();
    callback();
    return this.endGeometry();
  }

  //////////////////////////////////////////////
  // Setting
  //////////////////////////////////////////////

  _setAttributeDefaults(pInst) {
    // See issue #3850, safer to enable AA in Safari
    const applyAA = navigator.userAgent.toLowerCase().includes('safari');
    const defaults = {
      alpha: true,
      depth: true,
      stencil: true,
      antialias: applyAA,
      premultipliedAlpha: true,
      preserveDrawingBuffer: true,
      perPixelLighting: true,
      version: 2
    };
    if (pInst._glAttributes === null) {
      pInst._glAttributes = defaults;
    } else {
      pInst._glAttributes = Object.assign(defaults, pInst._glAttributes);
    }
    return;
  }

  _initContext() {
    if (this._pInst._glAttributes.version !== 1) {
      // Unless WebGL1 is explicitly asked for, try to create a WebGL2 context
      this.drawingContext =
        this.canvas.getContext('webgl2', this._pInst._glAttributes);
    }
    this.webglVersion =
      this.drawingContext ? constants.WEBGL2 : constants.WEBGL;
    // If this is the main canvas, make sure the global `webglVersion` is set
    this._pInst._setProperty('webglVersion', this.webglVersion);
    if (!this.drawingContext) {
      // If we were unable to create a WebGL2 context (either because it was
      // disabled via `setAttributes({ version: 1 })` or because the device
      // doesn't support it), fall back to a WebGL1 context
      this.drawingContext =
        this.canvas.getContext('webgl', this._pInst._glAttributes) ||
        this.canvas.getContext('experimental-webgl', this._pInst._glAttributes);
    }
    if (this.drawingContext === null) {
      throw new Error('Error creating webgl context');
    } else {
      const gl = this.drawingContext;
      gl.enable(gl.DEPTH_TEST);
      gl.depthFunc(gl.LEQUAL);
      gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
      // Make sure all images are loaded into the canvas premultiplied so that
      // they match the way we render colors. This will make framebuffer textures
      // be encoded the same way as textures from everything else.
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
      this._viewport = this.drawingContext.getParameter(
        this.drawingContext.VIEWPORT
      );
    }
  }

  //This is helper function to reset the context anytime the attributes
  //are changed with setAttributes()

  _resetContext(options, callback) {
    const w = this.width;
    const h = this.height;
    const defaultId = this.canvas.id;
    const isPGraphics = this._pInst instanceof p5.Graphics;

    if (isPGraphics) {
      const pg = this._pInst;
      pg.canvas.parentNode.removeChild(pg.canvas);
      pg.canvas = document.createElement('canvas');
      const node = pg._pInst._userNode || document.body;
      node.appendChild(pg.canvas);
      p5.Element.call(pg, pg.canvas, pg._pInst);
      pg.width = w;
      pg.height = h;
    } else {
      let c = this.canvas;
      if (c) {
        c.parentNode.removeChild(c);
      }
      c = document.createElement('canvas');
      c.id = defaultId;
      if (this._pInst._userNode) {
        this._pInst._userNode.appendChild(c);
      } else {
        document.body.appendChild(c);
      }
      this._pInst.canvas = c;
      this.canvas = c;
    }

    const renderer = new p5.RendererGL(
      this._pInst.canvas,
      this._pInst,
      !isPGraphics
    );
    this._pInst._setProperty('_renderer', renderer);
    renderer.resize(w, h);
    renderer._applyDefaults();

    if (!isPGraphics) {
      this._pInst._elements.push(renderer);
    }

    if (typeof callback === 'function') {
      //setTimeout with 0 forces the task to the back of the queue, this ensures that
      //we finish switching out the renderer
      setTimeout(() => {
        callback.apply(window._renderer, options);
      }, 0);
    }
  }


  /**
 * @class p5.RendererGL
 */
  _update() {
    // reset model view and apply initial camera transform
    // (containing only look at info; no projection).
    this.uMVMatrix.set(
      this._curCamera.cameraMatrix.mat4[0],
      this._curCamera.cameraMatrix.mat4[1],
      this._curCamera.cameraMatrix.mat4[2],
      this._curCamera.cameraMatrix.mat4[3],
      this._curCamera.cameraMatrix.mat4[4],
      this._curCamera.cameraMatrix.mat4[5],
      this._curCamera.cameraMatrix.mat4[6],
      this._curCamera.cameraMatrix.mat4[7],
      this._curCamera.cameraMatrix.mat4[8],
      this._curCamera.cameraMatrix.mat4[9],
      this._curCamera.cameraMatrix.mat4[10],
      this._curCamera.cameraMatrix.mat4[11],
      this._curCamera.cameraMatrix.mat4[12],
      this._curCamera.cameraMatrix.mat4[13],
      this._curCamera.cameraMatrix.mat4[14],
      this._curCamera.cameraMatrix.mat4[15]
    );

    // reset light data for new frame.

    this.ambientLightColors.length = 0;
    this.specularColors = [1, 1, 1];

    this.directionalLightDirections.length = 0;
    this.directionalLightDiffuseColors.length = 0;
    this.directionalLightSpecularColors.length = 0;

    this.pointLightPositions.length = 0;
    this.pointLightDiffuseColors.length = 0;
    this.pointLightSpecularColors.length = 0;

    this.spotLightPositions.length = 0;
    this.spotLightDirections.length = 0;
    this.spotLightDiffuseColors.length = 0;
    this.spotLightSpecularColors.length = 0;
    this.spotLightAngle.length = 0;
    this.spotLightConc.length = 0;

    this._enableLighting = false;

    //reset tint value for new frame
    this._tint = [255, 255, 255, 255];

    //Clear depth every frame
    this.GL.clearStencil(0);
    this.GL.clear(this.GL.DEPTH_BUFFER_BIT | this.GL.STENCIL_BUFFER_BIT);
    this.GL.disable(this.GL.STENCIL_TEST);
  }

  /**
 * [background description]
 */
  background(...args) {
    const _col = this._pInst.color(...args);
    const _r = _col.levels[0] / 255;
    const _g = _col.levels[1] / 255;
    const _b = _col.levels[2] / 255;
    const _a = _col.levels[3] / 255;
    this.clear(_r, _g, _b, _a);
  }

  //////////////////////////////////////////////
  // COLOR
  //////////////////////////////////////////////
  /**
 * Basic fill material for geometry with a given color
 * @method  fill
 * @class p5.RendererGL
 * @param  {Number|Number[]|String|p5.Color} v1  gray value,
 * red or hue value (depending on the current color mode),
 * or color Array, or CSS color string
 * @param  {Number}            [v2] green or saturation value
 * @param  {Number}            [v3] blue or brightness value
 * @param  {Number}            [a]  opacity
 * @chainable
 * @example
 * <div>
 * <code>
 * function setup() {
 *   createCanvas(200, 200, WEBGL);
 * }
 *
 * function draw() {
 *   background(0);
 *   noStroke();
 *   fill(100, 100, 240);
 *   rotateX(frameCount * 0.01);
 *   rotateY(frameCount * 0.01);
 *   box(75, 75, 75);
 * }
 * </code>
 * </div>
 *
 * @alt
 * black canvas with purple cube spinning
 */
  fill(v1, v2, v3, a) {
    //see material.js for more info on color blending in webgl
    const color = p5.prototype.color.apply(this._pInst, arguments);
    this.curFillColor = color._array;
    this.drawMode = constants.FILL;
    this._useNormalMaterial = false;
    this._tex = null;
  }

  /**
 * Basic stroke material for geometry with a given color
 * @method  stroke
 * @param  {Number|Number[]|String|p5.Color} v1  gray value,
 * red or hue value (depending on the current color mode),
 * or color Array, or CSS color string
 * @param  {Number}            [v2] green or saturation value
 * @param  {Number}            [v3] blue or brightness value
 * @param  {Number}            [a]  opacity
 * @example
 * <div>
 * <code>
 * function setup() {
 *   createCanvas(200, 200, WEBGL);
 * }
 *
 * function draw() {
 *   background(0);
 *   stroke(240, 150, 150);
 *   fill(100, 100, 240);
 *   rotateX(frameCount * 0.01);
 *   rotateY(frameCount * 0.01);
 *   box(75, 75, 75);
 * }
 * </code>
 * </div>
 *
 * @alt
 * black canvas with purple cube with pink outline spinning
 */
  stroke(r, g, b, a) {
    const color = p5.prototype.color.apply(this._pInst, arguments);
    this.curStrokeColor = color._array;
  }

  strokeCap(cap) {
    this.curStrokeCap = cap;
  }

  strokeJoin(join) {
    this.curStrokeJoin = join;
  }

  filter(...args) {
    // Couldn't create graphics in RendererGL constructor
    // (led to infinite loop)
    // so it's just created here once on the initial filter call.
    if (!this.filterGraphicsLayer) {
      // the real _pInst is buried when this is a secondary p5.Graphics
      const pInst =
        this._pInst instanceof p5.Graphics ? this._pInst._pInst : this._pInst;
      // create secondary layer
      this.filterGraphicsLayer =
        new p5.Graphics(
          this.width,
          this.height,
          constants.WEBGL,
          pInst
        );
    }
    let pg = this.filterGraphicsLayer;

    // use internal shader for filter constants BLUR, INVERT, etc
    let filterParameter = undefined;
    if (typeof args[0] === 'string') {
      let operation = args[0];
      let defaults = {
        [constants.BLUR]: 4,
        [constants.POSTERIZE]: 4,
        [constants.THRESHOLD]: 0.5
      };
      let useDefaultParam = operation in defaults && args[1] === undefined;
      filterParameter = useDefaultParam ? defaults[operation] : args[1];

      // Create and store shader for constants once on initial filter call.
      // Need to store multiple in case user calls different filters,
      // eg. filter(BLUR) then filter(GRAY)
      if ( !(operation in this.defaultFilterShaders) ) {
        this.defaultFilterShaders[operation] = new p5.Shader(
          pg._renderer,
          filterShaderVert,
          filterShaderFrags[operation]
        );
      }
      this.filterShader = this.defaultFilterShaders[operation];
    }
    // use custom user-supplied shader
    else {
      let userShader = args[0];

      // Copy the user shader once on the initial filter call,
      // since it has to be bound to pg and not main
      let isSameUserShader = (
        this.filterShader !== undefined &&
        userShader._vertSrc === this.filterShader._vertSrc &&
        userShader._fragSrc === this.filterShader._fragSrc
      );
      if (!isSameUserShader) {
        this.filterShader =
          new p5.Shader(pg._renderer, userShader._vertSrc, userShader._fragSrc);
        this.filterShader.parentShader = userShader;
      }
    }

    // apply shader to pg
    pg.shader(this.filterShader);
    this.filterShader.setUniform('tex0', this);
    this.filterShader.setUniform('texelSize', [1.0/this.width, 1.0/this.height]);
    this.filterShader.setUniform('canvasSize', [this.width, this.height]);
    // filterParameter only used for POSTERIZE, BLUR, and THRESHOLD
    // but shouldn't hurt to always set
    this.filterShader.setUniform('filterParameter', filterParameter);
    pg.rect(0,0,this.width,this.height);

    // draw pg contents onto main renderer
    this._pInst.push();
    this._pInst.noStroke(); // don't draw triangles for plane() geometry
    this._pInst.scale(1, -1); // vertically flip output
    this._pInst.texture(pg);
    this._pInst.plane(this.width, this.height);
    this._pInst.pop();
  }

  blendMode(mode) {
    if (
      mode === constants.DARKEST ||
      mode === constants.LIGHTEST ||
      mode === constants.ADD ||
      mode === constants.BLEND ||
      mode === constants.SUBTRACT ||
      mode === constants.SCREEN ||
      mode === constants.EXCLUSION ||
      mode === constants.REPLACE ||
      mode === constants.MULTIPLY ||
      mode === constants.REMOVE
    )
      this.curBlendMode = mode;
    else if (
      mode === constants.BURN ||
      mode === constants.OVERLAY ||
      mode === constants.HARD_LIGHT ||
      mode === constants.SOFT_LIGHT ||
      mode === constants.DODGE
    ) {
      console.warn(
        'BURN, OVERLAY, HARD_LIGHT, SOFT_LIGHT, and DODGE only work for blendMode in 2D mode.'
      );
    }
  }

  erase(opacityFill, opacityStroke) {
    if (!this._isErasing) {
      this._applyBlendMode(constants.REMOVE);
      this._isErasing = true;

      this._cachedFillStyle = this.curFillColor.slice();
      this.curFillColor = [1, 1, 1, opacityFill / 255];

      this._cachedStrokeStyle = this.curStrokeColor.slice();
      this.curStrokeColor = [1, 1, 1, opacityStroke / 255];
    }
  }

  noErase() {
    if (this._isErasing) {
      this._isErasing = false;
      this.curFillColor = this._cachedFillStyle.slice();
      this.curStrokeColor = this._cachedStrokeStyle.slice();
      this.blendMode(this._cachedBlendMode);
    }
  }

  beginClip(options = {}) {
    super.beginClip(options);
    const gl = this.GL;
    gl.clearStencil(0);
    gl.clear(gl.STENCIL_BUFFER_BIT);
    gl.enable(gl.STENCIL_TEST);
    gl.stencilFunc(
      gl.ALWAYS, // the test
      1, // reference value
      0xff // mask
    );
    gl.stencilOp(
      gl.KEEP, // what to do if the stencil test fails
      gl.KEEP, // what to do if the depth test fails
      gl.REPLACE // what to do if both tests pass
    );
    gl.disable(gl.DEPTH_TEST);

    this._pInst.push();
    this._pInst.resetShader();
    if (this._doFill) this._pInst.fill(0, 0);
    if (this._doStroke) this._pInst.stroke(0, 0);
  }

  endClip() {
    this._pInst.pop();

    const gl = this.GL;
    gl.stencilOp(
      gl.KEEP, // what to do if the stencil test fails
      gl.KEEP, // what to do if the depth test fails
      gl.KEEP // what to do if both tests pass
    );
    gl.stencilFunc(
      this._clipInvert ? gl.EQUAL : gl.NOTEQUAL, // the test
      0, // reference value
      0xff // mask
    );
    gl.enable(gl.DEPTH_TEST);

    // Mark the depth at which the clip has been applied so that we can clear it
    // when we pop past this depth
    this._clipDepth = this._pushPopDepth;

    super.endClip();
  }

  _clearClip() {
    this.GL.clearStencil(1);
    this.GL.clear(this.GL.STENCIL_BUFFER_BIT);
    this._clipDepth = null;
  }

  /**
 * Change weight of stroke
 * @method  strokeWeight
 * @param  {Number} stroke weight to be used for drawing
 * @example
 * <div>
 * <code>
 * function setup() {
 *   createCanvas(200, 400, WEBGL);
 *   setAttributes('antialias', true);
 * }
 *
 * function draw() {
 *   background(0);
 *   noStroke();
 *   translate(0, -100, 0);
 *   stroke(240, 150, 150);
 *   fill(100, 100, 240);
 *   push();
 *   strokeWeight(8);
 *   rotateX(frameCount * 0.01);
 *   rotateY(frameCount * 0.01);
 *   sphere(75);
 *   pop();
 *   push();
 *   translate(0, 200, 0);
 *   strokeWeight(1);
 *   rotateX(frameCount * 0.01);
 *   rotateY(frameCount * 0.01);
 *   sphere(75);
 *   pop();
 * }
 * </code>
 * </div>
 *
 * @alt
 * black canvas with two purple rotating spheres with pink
 * outlines the sphere on top has much heavier outlines,
 */
  strokeWeight(w) {
    if (this.curStrokeWeight !== w) {
      this.pointSize = w;
      this.curStrokeWeight = w;
    }
  }

  // x,y are canvas-relative (pre-scaled by _pixelDensity)
  _getPixel(x, y) {
    const gl = this.GL;
    return readPixelWebGL(
      gl,
      null,
      x,
      y,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      this._pInst.height * this._pInst.pixelDensity()
    );
  }

  /**
 * Loads the pixels data for this canvas into the pixels[] attribute.
 * Note that updatePixels() and set() do not work.
 * Any pixel manipulation must be done directly to the pixels[] array.
 *
 * @private
 * @method loadPixels
 */

  loadPixels() {
    const pixelsState = this._pixelsState;

    //@todo_FES
    if (this._pInst._glAttributes.preserveDrawingBuffer !== true) {
      console.log(
        'loadPixels only works in WebGL when preserveDrawingBuffer ' + 'is true.'
      );
      return;
    }

    const pd = this._pInst._pixelDensity;
    const gl = this.GL;

    pixelsState._setProperty(
      'pixels',
      readPixelsWebGL(
        pixelsState.pixels,
        gl,
        null,
        0,
        0,
        this.width * pd,
        this.height * pd,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        this.height * pd
      )
    );
  }

  updatePixels() {
    const fbo = this._getTempFramebuffer();
    fbo.pixels = this._pixelsState.pixels;
    fbo.updatePixels();
    this._pInst.push();
    this._pInst.resetMatrix();
    this._pInst.clear();
    this._pInst.imageMode(constants.CENTER);
    this._pInst.image(fbo, 0, 0);
    this._pInst.pop();
    this.GL.clearDepth(1);
    this.GL.clear(this.GL.DEPTH_BUFFER_BIT);
  }

  /**
 * @private
 * @returns {p5.Framebuffer} A p5.Framebuffer set to match the size and settings
 * of the renderer's canvas. It will be created if it does not yet exist, and
 * reused if it does.
 */
  _getTempFramebuffer() {
    if (!this._tempFramebuffer) {
      this._tempFramebuffer = this._pInst.createFramebuffer({
        format: constants.UNSIGNED_BYTE,
        useDepth: this._pInst._glAttributes.depth,
        depthFormat: constants.UNSIGNED_INT,
        antialias: this._pInst._glAttributes.antialias
      });
    }
    return this._tempFramebuffer;
  }



  //////////////////////////////////////////////
  // HASH | for geometry
  //////////////////////////////////////////////

  geometryInHash(gId) {
    return this.retainedMode.geometry[gId] !== undefined;
  }

  viewport(w, h) {
    this._viewport = [0, 0, w, h];
    this.GL.viewport(0, 0, w, h);
  }

  /**
 * [resize description]
 * @private
 * @param  {Number} w [description]
 * @param  {Number} h [description]
 */
  resize(w, h) {
    p5.Renderer.prototype.resize.call(this, w, h);
    this._origViewport = {
      width: this.GL.drawingBufferWidth,
      height: this.GL.drawingBufferHeight
    };
    this.viewport(
      this._origViewport.width,
      this._origViewport.height
    );

    this._curCamera._resize();

    //resize pixels buffer
    const pixelsState = this._pixelsState;
    if (typeof pixelsState.pixels !== 'undefined') {
      pixelsState._setProperty(
        'pixels',
        new Uint8Array(
          this.GL.drawingBufferWidth * this.GL.drawingBufferHeight * 4
        )
      );
    }

    for (const framebuffer of this.framebuffers) {
      // Notify framebuffers of the resize so that any auto-sized framebuffers
      // can also update their size
      framebuffer._canvasSizeChanged();
    }

    // resize filter graphics layer
    if (this.filterGraphicsLayer) {
      p5.Renderer.prototype.resize.call(this.filterGraphicsLayer, w, h);
    }
  }

  /**
 * clears color and depth buffers
 * with r,g,b,a
 * @private
 * @param {Number} r normalized red val.
 * @param {Number} g normalized green val.
 * @param {Number} b normalized blue val.
 * @param {Number} a normalized alpha val.
 */
  clear(...args) {
    const _r = args[0] || 0;
    const _g = args[1] || 0;
    const _b = args[2] || 0;
    const _a = args[3] || 0;

    this.GL.clearColor(_r * _a, _g * _a, _b * _a, _a);
    this.GL.clearDepth(1);
    this.GL.clear(this.GL.COLOR_BUFFER_BIT | this.GL.DEPTH_BUFFER_BIT);
  }

  applyMatrix(a, b, c, d, e, f) {
    if (arguments.length === 16) {
      p5.Matrix.prototype.apply.apply(this.uMVMatrix, arguments);
    } else {
      this.uMVMatrix.apply([
        a, b, 0, 0,
        c, d, 0, 0,
        0, 0, 1, 0,
        e, f, 0, 1
      ]);
    }
  }

  /**
 * [translate description]
 * @private
 * @param  {Number} x [description]
 * @param  {Number} y [description]
 * @param  {Number} z [description]
 * @chainable
 * @todo implement handle for components or vector as args
 */
  translate(x, y, z) {
    if (x instanceof p5.Vector) {
      z = x.z;
      y = x.y;
      x = x.x;
    }
    this.uMVMatrix.translate([x, y, z]);
    return this;
  }

  /**
 * Scales the Model View Matrix by a vector
 * @private
 * @param  {Number | p5.Vector | Array} x [description]
 * @param  {Number} [y] y-axis scalar
 * @param  {Number} [z] z-axis scalar
 * @chainable
 */
  scale(x, y, z) {
    this.uMVMatrix.scale(x, y, z);
    return this;
  }

  rotate(rad, axis) {
    if (typeof axis === 'undefined') {
      return this.rotateZ(rad);
    }
    p5.Matrix.prototype.rotate.apply(this.uMVMatrix, arguments);
    return this;
  }

  rotateX(rad) {
    this.rotate(rad, 1, 0, 0);
    return this;
  }

  rotateY(rad) {
    this.rotate(rad, 0, 1, 0);
    return this;
  }

  rotateZ(rad) {
    this.rotate(rad, 0, 0, 1);
    return this;
  }

  push() {
    // get the base renderer style
    const style = p5.Renderer.prototype.push.apply(this);

    // add webgl-specific style properties
    const properties = style.properties;

    properties.uMVMatrix = this.uMVMatrix.copy();
    properties.uPMatrix = this.uPMatrix.copy();
    properties._curCamera = this._curCamera;

    // make a copy of the current camera for the push state
    // this preserves any references stored using 'createCamera'
    this._curCamera = this._curCamera.copy();

    properties.ambientLightColors = this.ambientLightColors.slice();
    properties.specularColors = this.specularColors.slice();

    properties.directionalLightDirections =
      this.directionalLightDirections.slice();
    properties.directionalLightDiffuseColors =
      this.directionalLightDiffuseColors.slice();
    properties.directionalLightSpecularColors =
      this.directionalLightSpecularColors.slice();

    properties.pointLightPositions = this.pointLightPositions.slice();
    properties.pointLightDiffuseColors = this.pointLightDiffuseColors.slice();
    properties.pointLightSpecularColors = this.pointLightSpecularColors.slice();

    properties.spotLightPositions = this.spotLightPositions.slice();
    properties.spotLightDirections = this.spotLightDirections.slice();
    properties.spotLightDiffuseColors = this.spotLightDiffuseColors.slice();
    properties.spotLightSpecularColors = this.spotLightSpecularColors.slice();
    properties.spotLightAngle = this.spotLightAngle.slice();
    properties.spotLightConc = this.spotLightConc.slice();

    properties.userFillShader = this.userFillShader;
    properties.userStrokeShader = this.userStrokeShader;
    properties.userPointShader = this.userPointShader;

    properties.pointSize = this.pointSize;
    properties.curStrokeWeight = this.curStrokeWeight;
    properties.curStrokeColor = this.curStrokeColor;
    properties.curFillColor = this.curFillColor;
    properties.curAmbientColor = this.curAmbientColor;
    properties.curSpecularColor = this.curSpecularColor;
    properties.curEmissiveColor = this.curEmissiveColor;

    properties._hasSetAmbient = this._hasSetAmbient;
    properties._useSpecularMaterial = this._useSpecularMaterial;
    properties._useEmissiveMaterial = this._useEmissiveMaterial;
    properties._useShininess = this._useShininess;

    properties.constantAttenuation = this.constantAttenuation;
    properties.linearAttenuation = this.linearAttenuation;
    properties.quadraticAttenuation = this.quadraticAttenuation;

    properties._enableLighting = this._enableLighting;
    properties._useNormalMaterial = this._useNormalMaterial;
    properties._tex = this._tex;
    properties.drawMode = this.drawMode;

    properties._currentNormal = this._currentNormal;
    properties.curBlendMode = this.curBlendMode;

    return style;
  }
  pop(...args) {
    if (this._pushPopDepth === this._clipDepth) {
      this._clearClip();
      this.GL.disable(this.GL.STENCIL_TEST);
    }
    super.pop(...args);
  }
  resetMatrix() {
    this.uMVMatrix.set(
      this._curCamera.cameraMatrix.mat4[0],
      this._curCamera.cameraMatrix.mat4[1],
      this._curCamera.cameraMatrix.mat4[2],
      this._curCamera.cameraMatrix.mat4[3],
      this._curCamera.cameraMatrix.mat4[4],
      this._curCamera.cameraMatrix.mat4[5],
      this._curCamera.cameraMatrix.mat4[6],
      this._curCamera.cameraMatrix.mat4[7],
      this._curCamera.cameraMatrix.mat4[8],
      this._curCamera.cameraMatrix.mat4[9],
      this._curCamera.cameraMatrix.mat4[10],
      this._curCamera.cameraMatrix.mat4[11],
      this._curCamera.cameraMatrix.mat4[12],
      this._curCamera.cameraMatrix.mat4[13],
      this._curCamera.cameraMatrix.mat4[14],
      this._curCamera.cameraMatrix.mat4[15]
    );
    return this;
  }

  //////////////////////////////////////////////
  // SHADER
  //////////////////////////////////////////////

  /*
 * shaders are created and cached on a per-renderer basis,
 * on the grounds that each renderer will have its own gl context
 * and the shader must be valid in that context.
 */

  _getImmediateStrokeShader() {
    // select the stroke shader to use
    const stroke = this.userStrokeShader;
    if (!stroke || !stroke.isStrokeShader()) {
      return this._getLineShader();
    }
    return stroke;
  }


  _getRetainedStrokeShader() {
    return this._getImmediateStrokeShader();
  }

  /*
   * selects which fill shader should be used based on renderer state,
   * for use with begin/endShape and immediate vertex mode.
   */
  _getImmediateFillShader() {
    const fill = this.userFillShader;
    if (this._useNormalMaterial) {
      if (!fill || !fill.isNormalShader()) {
        return this._getNormalShader();
      }
    }
    if (this._enableLighting) {
      if (!fill || !fill.isLightShader()) {
        return this._getLightShader();
      }
    } else if (this._tex) {
      if (!fill || !fill.isTextureShader()) {
        return this._getLightShader();
      }
    } else if (!fill /*|| !fill.isColorShader()*/) {
      return this._getImmediateModeShader();
    }
    return fill;
  }

  /*
   * selects which fill shader should be used based on renderer state
   * for retained mode.
   */
  _getRetainedFillShader() {
    if (this._useNormalMaterial) {
      return this._getNormalShader();
    }

    const fill = this.userFillShader;
    if (this._enableLighting) {
      if (!fill || !fill.isLightShader()) {
        return this._getLightShader();
      }
    } else if (this._tex) {
      if (!fill || !fill.isTextureShader()) {
        return this._getLightShader();
      }
    } else if (!fill /* || !fill.isColorShader()*/) {
      return this._getColorShader();
    }
    return fill;
  }

  _getImmediatePointShader() {
    // select the point shader to use
    const point = this.userPointShader;
    if (!point || !point.isPointShader()) {
      return this._getPointShader();
    }
    return point;
  }

  _getRetainedLineShader() {
    return this._getImmediateLineShader();
  }

  _getLightShader() {
    if (!this._defaultLightShader) {
      if (this._pInst._glAttributes.perPixelLighting) {
        this._defaultLightShader = new p5.Shader(
          this,
          defaultShaders.phongVert,
          defaultShaders.phongFrag
        );
      } else {
        this._defaultLightShader = new p5.Shader(
          this,
          defaultShaders.lightVert,
          defaultShaders.lightTextureFrag
        );
      }
    }

    return this._defaultLightShader;
  }

  _getImmediateModeShader() {
    if (!this._defaultImmediateModeShader) {
      this._defaultImmediateModeShader = new p5.Shader(
        this,
        defaultShaders.immediateVert,
        defaultShaders.vertexColorFrag
      );
    }

    return this._defaultImmediateModeShader;
  }

  _getNormalShader() {
    if (!this._defaultNormalShader) {
      this._defaultNormalShader = new p5.Shader(
        this,
        defaultShaders.normalVert,
        defaultShaders.normalFrag
      );
    }

    return this._defaultNormalShader;
  }

  _getColorShader() {
    if (!this._defaultColorShader) {
      this._defaultColorShader = new p5.Shader(
        this,
        defaultShaders.normalVert,
        defaultShaders.basicFrag
      );
    }

    return this._defaultColorShader;
  }

  _getPointShader() {
    if (!this._defaultPointShader) {
      this._defaultPointShader = new p5.Shader(
        this,
        defaultShaders.pointVert,
        defaultShaders.pointFrag
      );
    }
    return this._defaultPointShader;
  }

  _getLineShader() {
    if (!this._defaultLineShader) {
      this._defaultLineShader = new p5.Shader(
        this,
        defaultShaders.lineVert,
        defaultShaders.lineFrag
      );
    }

    return this._defaultLineShader;
  }

  _getFontShader() {
    if (!this._defaultFontShader) {
      if (this.webglVersion === constants.WEBGL) {
        this.GL.getExtension('OES_standard_derivatives');
      }
      this._defaultFontShader = new p5.Shader(
        this,
        this._webGL2CompatibilityPrefix('vert', 'mediump') +
        defaultShaders.fontVert,
        this._webGL2CompatibilityPrefix('frag', 'mediump') +
        defaultShaders.fontFrag
      );
    }
    return this._defaultFontShader;
  }

  _webGL2CompatibilityPrefix(
    shaderType,
    floatPrecision
  ) {
    let code = '';
    if (this.webglVersion === constants.WEBGL2) {
      code += '#version 300 es\n#define WEBGL2\n';
    }
    if (shaderType === 'vert') {
      code += '#define VERTEX_SHADER\n';
    } else if (shaderType === 'frag') {
      code += '#define FRAGMENT_SHADER\n';
    }
    if (floatPrecision) {
      code += `precision ${floatPrecision} float;\n`;
    }
    return code;
  }

  _getEmptyTexture() {
    if (!this._emptyTexture) {
      // a plain white texture RGBA, full alpha, single pixel.
      const im = new p5.Image(1, 1);
      im.set(0, 0, 255);
      this._emptyTexture = new p5.Texture(this, im);
    }
    return this._emptyTexture;
  }

  getTexture(input) {
    let src = input;
    if (src instanceof p5.Framebuffer) {
      src = src.color;
    }

    const texture = this.textures.get(src);
    if (texture) {
      return texture;
    }

    const tex = new p5.Texture(this, src);
    this.textures.set(src, tex);
    return tex;
  }

  /**
   * @method activeFramebuffer
   * @private
   * @returns {p5.Framebuffer|null} The currently active framebuffer, or null if
   * the main canvas is the current draw target.
   */
  activeFramebuffer() {
    return this.activeFramebuffers[this.activeFramebuffers.length - 1] || null;
  }

  createFramebuffer(options) {
    return new p5.Framebuffer(this, options);
  }

  _setStrokeUniforms(strokeShader) {
    strokeShader.bindShader();

    // set the uniform values
    strokeShader.setUniform('uUseLineColor', this._useLineColor);
    strokeShader.setUniform('uMaterialColor', this.curStrokeColor);
    strokeShader.setUniform('uStrokeWeight', this.curStrokeWeight);
    strokeShader.setUniform('uStrokeCap', STROKE_CAP_ENUM[this.curStrokeCap]);
    strokeShader.setUniform('uStrokeJoin', STROKE_JOIN_ENUM[this.curStrokeJoin]);
  }

  _setFillUniforms(fillShader) {
    fillShader.bindShader();

    // TODO: optimize
    fillShader.setUniform('uUseVertexColor', this._useVertexColor);
    fillShader.setUniform('uMaterialColor', this.curFillColor);
    fillShader.setUniform('isTexture', !!this._tex);
    if (this._tex) {
      fillShader.setUniform('uSampler', this._tex);
    }
    fillShader.setUniform('uTint', this._tint);

    fillShader.setUniform('uHasSetAmbient', this._hasSetAmbient);
    fillShader.setUniform('uAmbientMatColor', this.curAmbientColor);
    fillShader.setUniform('uSpecularMatColor', this.curSpecularColor);
    fillShader.setUniform('uEmissiveMatColor', this.curEmissiveColor);
    fillShader.setUniform('uSpecular', this._useSpecularMaterial);
    fillShader.setUniform('uEmissive', this._useEmissiveMaterial);
    fillShader.setUniform('uShininess', this._useShininess);

    fillShader.setUniform('uUseLighting', this._enableLighting);

    const pointLightCount = this.pointLightDiffuseColors.length / 3;
    fillShader.setUniform('uPointLightCount', pointLightCount);
    fillShader.setUniform('uPointLightLocation', this.pointLightPositions);
    fillShader.setUniform(
      'uPointLightDiffuseColors',
      this.pointLightDiffuseColors
    );
    fillShader.setUniform(
      'uPointLightSpecularColors',
      this.pointLightSpecularColors
    );

    const directionalLightCount = this.directionalLightDiffuseColors.length / 3;
    fillShader.setUniform('uDirectionalLightCount', directionalLightCount);
    fillShader.setUniform('uLightingDirection', this.directionalLightDirections);
    fillShader.setUniform(
      'uDirectionalDiffuseColors',
      this.directionalLightDiffuseColors
    );
    fillShader.setUniform(
      'uDirectionalSpecularColors',
      this.directionalLightSpecularColors
    );

    // TODO: sum these here...
    const ambientLightCount = this.ambientLightColors.length / 3;
    fillShader.setUniform('uAmbientLightCount', ambientLightCount);
    fillShader.setUniform('uAmbientColor', this.ambientLightColors);

    const spotLightCount = this.spotLightDiffuseColors.length / 3;
    fillShader.setUniform('uSpotLightCount', spotLightCount);
    fillShader.setUniform('uSpotLightAngle', this.spotLightAngle);
    fillShader.setUniform('uSpotLightConc', this.spotLightConc);
    fillShader.setUniform('uSpotLightDiffuseColors', this.spotLightDiffuseColors);
    fillShader.setUniform(
      'uSpotLightSpecularColors',
      this.spotLightSpecularColors
    );
    fillShader.setUniform('uSpotLightLocation', this.spotLightPositions);
    fillShader.setUniform('uSpotLightDirection', this.spotLightDirections);

    fillShader.setUniform('uConstantAttenuation', this.constantAttenuation);
    fillShader.setUniform('uLinearAttenuation', this.linearAttenuation);
    fillShader.setUniform('uQuadraticAttenuation', this.quadraticAttenuation);

    fillShader.bindTextures();
  }

  _setPointUniforms(pointShader) {
    pointShader.bindShader();

    // set the uniform values
    pointShader.setUniform('uMaterialColor', this.curStrokeColor);
    // @todo is there an instance where this isn't stroke weight?
    // should be they be same var?
    pointShader.setUniform(
      'uPointSize',
      this.pointSize * this._pInst._pixelDensity
    );
  }

  /* Binds a buffer to the drawing context
   * when passed more than two arguments it also updates or initializes
   * the data associated with the buffer
   */
  _bindBuffer(
    buffer,
    target,
    values,
    type,
    usage
  ) {
    if (!target) target = this.GL.ARRAY_BUFFER;
    this.GL.bindBuffer(target, buffer);
    if (values !== undefined) {
      let data = values;
      if (values instanceof p5.DataArray) {
        data = values.dataArray();
      } else if (!(data instanceof (type || Float32Array))) {
        data = new (type || Float32Array)(data);
      }
      this.GL.bufferData(target, data, usage || this.GL.STATIC_DRAW);
    }
  }

  ///////////////////////////////
  //// UTILITY FUNCTIONS
  //////////////////////////////
  _arraysEqual(a, b) {
    const aLength = a.length;
    if (aLength !== b.length) return false;
    return a.every((ai, i) => ai === b[i]);
  }

  _isTypedArray(arr) {
    return [
      Float32Array,
      Float64Array,
      Int16Array,
      Uint16Array,
      Uint32Array
    ].some(x => arr instanceof x);
  }
  /**
   * turn a two dimensional array into one dimensional array
   * @private
   * @param  {Array} arr 2-dimensional array
   * @return {Array}     1-dimensional array
   * [[1, 2, 3],[4, 5, 6]] -> [1, 2, 3, 4, 5, 6]
   */
  _flatten(arr) {
    //when empty, return empty
    if (arr.length === 0) {
      return [];
    } else if (arr.length > 20000) {
      //big models , load slower to avoid stack overflow
      //faster non-recursive flatten via axelduch
      //stackoverflow.com/questions/27266550/how-to-flatten-nested-array-in-javascript
      const result = [];
      const nodes = arr.slice();
      let node;
      node = nodes.pop();
      do {
        if (Array.isArray(node)) {
          nodes.push(...node);
        } else {
          result.push(node);
        }
      } while (nodes.length && (node = nodes.pop()) !== undefined);
      result.reverse(); // we reverse result to restore the original order
      return result;
    } else {
      //otherwise if model within limits for browser
      //use faster recursive loading
      return [].concat(...arr);
    }
  }

  /**
   * turn a p5.Vector Array into a one dimensional number array
   * @private
   * @param  {p5.Vector[]} arr  an array of p5.Vector
   * @return {Number[]}     a one dimensional array of numbers
   * [p5.Vector(1, 2, 3), p5.Vector(4, 5, 6)] ->
   * [1, 2, 3, 4, 5, 6]
   */
  _vToNArray(arr) {
    const ret = [];

    for (const item of arr) {
      ret.push(item.x, item.y, item.z);
    }

    return ret;
  }

  // function to calculate BezierVertex Coefficients
  _bezierCoefficients(t) {
    const t2 = t * t;
    const t3 = t2 * t;
    const mt = 1 - t;
    const mt2 = mt * mt;
    const mt3 = mt2 * mt;
    return [mt3, 3 * mt2 * t, 3 * mt * t2, t3];
  }

  // function to calculate QuadraticVertex Coefficients
  _quadraticCoefficients(t) {
    const t2 = t * t;
    const mt = 1 - t;
    const mt2 = mt * mt;
    return [mt2, 2 * mt * t, t2];
  }

  // function to convert Bezier coordinates to Catmull Rom Splines
  _bezierToCatmull(w) {
    const p1 = w[1];
    const p2 = w[1] + (w[2] - w[0]) / this._curveTightness;
    const p3 = w[2] - (w[3] - w[1]) / this._curveTightness;
    const p4 = w[2];
    const p = [p1, p2, p3, p4];
    return p;
  }
  _initTessy() {
    // function called for each vertex of tesselator output
    function vertexCallback(data, polyVertArray) {
      for (let i = 0; i < data.length; i++) {
        polyVertArray.push(data[i]);
      }
    }

    function begincallback(type) {
      if (type !== libtess.primitiveType.GL_TRIANGLES) {
        console.log(`expected TRIANGLES but got type: ${type}`);
      }
    }

    function errorcallback(errno) {
      console.log('error callback');
      console.log(`error number: ${errno}`);
    }
    // callback for when segments intersect and must be split
    function combinecallback(coords, data, weight) {
      const result = new Array(p5.RendererGL.prototype.tessyVertexSize).fill(0);
      for (let i = 0; i < weight.length; i++) {
        for (let j = 0; j < result.length; j++) {
          if (weight[i] === 0 || !data[i]) continue;
          result[j] += data[i][j] * weight[i];
        }
      }
      return result;
    }

    function edgeCallback(flag) {
      // don't really care about the flag, but need no-strip/no-fan behavior
    }

    const tessy = new libtess.GluTesselator();
    tessy.gluTessCallback(libtess.gluEnum.GLU_TESS_VERTEX_DATA, vertexCallback);
    tessy.gluTessCallback(libtess.gluEnum.GLU_TESS_BEGIN, begincallback);
    tessy.gluTessCallback(libtess.gluEnum.GLU_TESS_ERROR, errorcallback);
    tessy.gluTessCallback(libtess.gluEnum.GLU_TESS_COMBINE, combinecallback);
    tessy.gluTessCallback(libtess.gluEnum.GLU_TESS_EDGE_FLAG, edgeCallback);
    tessy.gluTessProperty(
      libtess.gluEnum.GLU_TESS_WINDING_RULE,
      libtess.windingRule.GLU_TESS_WINDING_NONZERO
    );

    return tessy;
  }

  _triangulate(contours) {
    // libtess will take 3d verts and flatten to a plane for tesselation.
    // libtess is capable of calculating a plane to tesselate on, but
    // if all of the vertices have the same z values, we'll just
    // assume the face is facing the camera, letting us skip any performance
    // issues or bugs in libtess's automatic calculation.
    const z = contours[0] ? contours[0][2] : undefined;
    let allSameZ = true;
    for (const contour of contours) {
      for (
        let j = 0;
        j < contour.length;
        j += p5.RendererGL.prototype.tessyVertexSize
      ) {
        if (contour[j + 2] !== z) {
          allSameZ = false;
          break;
        }
      }
    }
    if (allSameZ) {
      this._tessy.gluTessNormal(0, 0, 1);
    } else {
      // Let libtess pick a plane for us
      this._tessy.gluTessNormal(0, 0, 0);
    }

    const triangleVerts = [];
    this._tessy.gluTessBeginPolygon(triangleVerts);

    for (const contour of contours) {
      this._tessy.gluTessBeginContour();
      for (
        let j = 0;
        j < contour.length;
        j += p5.RendererGL.prototype.tessyVertexSize
      ) {
        const coords = contour.slice(
          j,
          j + p5.RendererGL.prototype.tessyVertexSize
        );
        this._tessy.gluTessVertex(coords, coords);
      }
      this._tessy.gluTessEndContour();
    }

    // finish polygon
    this._tessy.gluTessEndPolygon();

    return triangleVerts;
  }
};
/**
 * ensures that p5 is using a 3d renderer. throws an error if not.
 */
p5.prototype._assert3d = function (name) {
  if (!this._renderer.isP3D)
    throw new Error(
      `${name}() is only supported in WEBGL mode. If you'd like to use 3D graphics and WebGL, see  https://p5js.org/examples/form-3d-primitives.html for more information.`
    );
};

// function to initialize GLU Tesselator

p5.RendererGL.prototype.tessyVertexSize = 12;

export default p5.RendererGL;
