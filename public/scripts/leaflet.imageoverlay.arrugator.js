(function () {
	'use strict';

	/**
	 * Leaflet.ImageOverlay.Arrugator by Iván Sánchez Ortega <ivan@sanchezortega.es> https://ivan.sanchezortega.es
	 *
	 * Licensed under GPLv3.
	 *
	 * Includes Iván Sánchez's Glii (under GPLv3, see https://gitlab.com/IvanSanchez/arrugator)
	 *
	 * Includes Vladimir Agafonkin's TinyQueue (under ISC, see https://github.com/mourner/tinyqueue)
	 *
	 */

	var constantNames = [
		"STATIC_DRAW",
		"DYNAMIC_DRAW",
		"STREAM_DRAW",
		"BYTE",
		"UNSIGNED_BYTE",
		"SHORT",
		"UNSIGNED_SHORT",
		"INT",
		"UNSIGNED_INT",
		"FLOAT",
		"UNSIGNED_SHORT_5_6_5",
		"UNSIGNED_SHORT_4_4_4_4",
		"UNSIGNED_SHORT_5_5_5_1",
		"POINTS",
		"LINES",
		"LINE_LOOP",
		"LINE_STRIP",
		"TRIANGLES",
		"TRIANGLE_STRIP",
		"TRIANGLE_FAN",
		"ALPHA",
		"RGB",
		"RGBA",
		"LUMINANCE",
		"LUMINANCE_ALPHA",
		"RED",
		"RG",
		"RED_INTEGER",
		"RG_INTEGER",
		"RGB_INTEGER",
		"RGBA_INTEGER",
		"NEAREST",
		"LINEAR",
		"NEAREST_MIPMAP_NEAREST",
		"LINEAR_MIPMAP_NEAREST",
		"NEAREST_MIPMAP_LINEAR",
		"LINEAR_MIPMAP_LINEAR",
		"REPEAT",
		"CLAMP_TO_EDGE",
		"MIRRORED_REPEAT",
		"RGBA4",
		"RGB565",
		"RGB5_A1",
		"DEPTH_COMPONENT16",
		"STENCIL_INDEX8",
		"DEPTH_STENCIL",
		"DEPTH_COMPONENT24",
		"DEPTH_COMPONENT32F",
		"DEPTH24_STENCIL8",
		"DEPTH32F_STENCIL8",
		"R32I",
		"NEVER",
		"ALWAYS",
		"LESS",
		"LEQUAL",
		"GREATER",
		"GEQUAL",
		"EQUAL",
		"NOTEQUAL",
		"FUNC_ADD",
		"FUNC_SUBTRACT",
		"FUNC_REVERSE_SUBTRACT",
		"MIN",
		"MAX",
		"ZERO",
		"ONE",
		"SRC_COLOR",
		"ONE_MINUS_SRC_COLOR",
		"DST_COLOR",
		"ONE_MINUS_DST_COLOR",
		"SRC_ALPHA",
		"ONE_MINUS_SRC_ALPHA",
		"DST_ALPHA",
		"ONE_MINUS_DST_ALPHA",
		"CONSTANT_COLOR",
		"ONE_MINUS_CONSTANT_COLOR",
		"CONSTANT_ALPHA",
		"ONE_MINUS_CONSTANT_ALPHA",
		"SRC_ALPHA_SATURATE",
	];

	const factories = {};
	function registerFactory(name, fact) {
		factories[name] = fact;
	}
	class GliiFactory {
		constructor(target, contextAttributes) {
			if (!target || !target.constructor || !target.constructor.name) {
				throw new Error(
					"Invalid target passed to GliiFactory constructor. Expected either a HTMLCanvasElement or a WebGLRenderingContext but got " +
						typeof target +
						"," +
						JSON.stringify(target) +
						"."
				);
			}
			switch (target.constructor.name) {
				case "HTMLCanvasElement":
					function get(name) {
						try {
							return target.getContext(name, contextAttributes);
						} catch (e) {
							return undefined;
						}
					}
					this.gl =
						get("webgl2") ||
						get("webgl") ||
						get("experimental-webgl") ||
						get("webgl-experimental");
					if (!this.gl) {
						throw new Error("Glii could not create a WebGL context from canvas.");
					}
					break;
				case "WebGLRenderingContext":
				case "WebGL2RenderingContext":
				case "bound WebGLRenderingContext":
				case "bound WebGL2RenderingContext":
					this.gl = target;
					break;
				default:
					throw new Error(
						"Invalid target passed to GliiFactory constructor. Expected either a HTMLCanvasElement or a WebGLRenderingContext but got an instance of " +
							target.constructor.name +
							"."
					);
			}
			const gl = this.gl;
			this._isWebGL2 =
				gl.constructor.name === "WebGL2RenderingContext" ||
				gl.constructor.name === "bound WebGL2RenderingContext";
			for (let factName in factories) {
				this[factName] = factories[factName](gl, this);
			}
			for (let i in constantNames) {
				const name = constantNames[i];
				this[name] = gl[name];
			}
			if ("canvas" in gl) {
				gl.canvas.addEventListener(
					"webglcontextlost",
					(ev) => {
						console.warn("glii has lost context", ev);
						ev.preventDefault();
					},
					false
				);
				gl.canvas.addEventListener(
					"webglcontextrestored",
					(ev) => {
						console.warn("glii lost context has been restored", ev);
					},
					false
				);
				const resizeObserver = new ResizeObserver(() => {
					this._drawingBufferSizeChanged = true;
				});
				resizeObserver.observe(gl.canvas);
			}
			this.refreshDrawingBufferSize();
			this._loadedExtensions = new Map();
		}
		getSupportedExtensions() {
			if (this._knownExtensions) {
				return this._knownExtensions;
			}
			return (this._knownExtensions = this.gl.getSupportedExtensions());
		}
		isExtensionSupported(extName) {
			return this.getSupportedExtensions().includes(extName);
		}
		loadExtension(extName) {
			let ext = this._loadedExtensions.get(extName);
			if (ext) {
				return ext;
			} else {
				if (!this.isExtensionSupported(extName)) {
					throw new Error(`WebGL extension ${extName} is not supported`);
				}
				ext = this.gl.getExtension(extName);
				this._loadedExtensions.set(extName, ext);
				return ext;
			}
		}
		isWebGL2() {
			return this._isWebGL2;
		}
		refreshDrawingBufferSize() {
			if (this._drawingBufferSizeChanged) {
				const canvas = this.gl.canvas;
				const { width, height } = canvas.getClientRects()[0];
				this._width = canvas.width = width;
				this._height = canvas.height = height;
				this._drawingBufferSizeChanged = false;
			}
			return [this._width, this._height];
		}
	}

	var typeMap = new Map([
		[Int8Array,         0x1400],
		[Uint8Array,        0x1401],
		[Uint8ClampedArray, 0x1401],
		[Int16Array,        0x1402],
		[Uint16Array,       0x1403],
		[Int32Array,        0x1404],
		[Uint32Array,       0x1405],
		[Float32Array,      0x1406],
	]);

	var reverseTypeMap = new Map([
		[0x1400,	Int8Array   ],
		[0x1401,	Uint8Array  ],
		[0x1402,	Int16Array  ],
		[0x1402,	Int16Array  ],
		[0x1403,	Uint16Array ],
		[0x1404,	Int32Array  ],
		[0x1405,	Uint32Array ],
		[0x1406,	Float32Array],
		[0x8033,	Uint16Array],
		[0x8034,	Uint16Array],
		[0x8363,	Uint16Array],
		[0x84FA,	Uint16Array],
		[0x8D61,	Uint16Array],
	]);

	class RenderBuffer {
		#width;
		#height;
		#gl;
		#rb;
		#internalFormat;
		#multisample;
		constructor(gl, opts = {}) {
			this.#gl = gl;
			this.#rb = gl.createRenderbuffer();
			if ("size" in opts) {
				if ("width" in opts || "height" in opts) {
					throw new Error(
						'Expected either "size" or "width"/"height", but both were provided'
					);
				}
				this.#width = opts.size[0];
				this.#height = opts.size[1];
			} else {
				this.#width = opts.width || 256;
				this.#height = opts.height || 256;
			}
			this.#internalFormat = opts.internalFormat || gl.RGBA4;
			this.#multisample = opts.multisample || 0;
			this.resize(this.#width, this.#height);
		}
		get rb() {
			if (!this.#rb) {
				throw new Error("RenderBuffer has been destroyed and cannot be used");
			}
			return this.#rb;
		}
		resize(x, y) {
			this.#width = x;
			this.#height = y;
			const gl = this.#gl;
			gl.bindRenderbuffer(gl.RENDERBUFFER, this.#rb);
			if ("renderbufferStorageMultisample" in gl && this.#multisample > 1) {
				gl.renderbufferStorageMultisample(
					gl.RENDERBUFFER,
					this.#multisample,
					this.#internalFormat,
					this.#width,
					this.#height
				);
			} else {
				gl.renderbufferStorage(
					gl.RENDERBUFFER,
					this.#internalFormat,
					this.#width,
					this.#height
				);
			}
			return this;
		}
		destroy() {
			this.#gl.deleteRenderbuffer(this.#rb);
			this.#rb = undefined;
		}
	}
	registerFactory("RenderBuffer", function (gl) {
		return class WrappedRenderBuffer extends RenderBuffer {
			constructor(opts) {
				super(gl, opts);
			}
		};
	});

	class FrameBuffer {
		#gl;
		#fb;
		#width;
		#height;
		#colourAttachs;
		#depth;
		#stencil;
		constructor(gl, opts = {}) {
			this.#gl = gl;
			this.#fb = gl.createFramebuffer();
			gl.bindFramebuffer(gl.FRAMEBUFFER, this.#fb);
			if ("size" in opts) {
				if ("width" in opts || "height" in opts) {
					throw new Error(
						'Expected either "size" or "width"/"height", but both were provided'
					);
				}
				this.#width = opts.size[0];
				this.#height = opts.size[1];
			} else {
				this.#width = opts.width || 256;
				this.#height = opts.height || 256;
			}
			this.#colourAttachs = opts.colour || opts.color || [];
			this.#colourAttachs.forEach((att, i) => {
				if (att instanceof Texture) {
					att.getUnit();
					if (!att.isLoaded()) {
						att.texArray(
							this.#width,
							this.#height,
							new (reverseTypeMap.get(att.type))(
								this.#width * this.#height * att.getComponentsPerTexel()
							)
						);
					}
					gl.framebufferTexture2D(
						gl.FRAMEBUFFER,
						gl.COLOR_ATTACHMENT0 + i,
						gl.TEXTURE_2D,
						att.tex,
						0
					);
				} else if (att instanceof RenderBuffer) {
					gl.framebufferRenderbuffer(
						gl.FRAMEBUFFER,
						gl.COLOR_ATTACHMENT0 + i,
						gl.RENDERBUFFER,
						att.rb
					);
				}
			});
			if (opts.depth && opts.depth instanceof RenderBuffer) {
				this.#depth = opts.depth;
				gl.framebufferRenderbuffer(
					gl.FRAMEBUFFER,
					gl.DEPTH_ATTACHMENT,
					gl.RENDERBUFFER,
					opts.depth.rb
				);
			}
			if (opts.stencil && opts.stencil instanceof RenderBuffer) {
				this.#stencil = opts.stencil;
				gl.framebufferRenderbuffer(
					gl.FRAMEBUFFER,
					gl.STENCIL_ATTACHMENT,
					gl.RENDERBUFFER,
					opts.stencil.rb
				);
			}
			this.#checkStatus();
		}
		get fb() {
			return this.#fb;
		}
		get width() {
			return this.#width;
		}
		get height() {
			return this.#height;
		}
		resize(x, y) {
			this.#height = y;
			this.#width = x;
			this.#colourAttachs.forEach((att, _) => {
				att.getUnit();
				att.texArray(
					x,
					y,
					new (reverseTypeMap.get(att.type))(
						this.#width * this.#height * att.getComponentsPerTexel()
					)
				);
			});
			if (this.#depth && this.#depth instanceof RenderBuffer) {
				this.#depth.resize(x, y);
			}
			if (this.#stencil && this.#stencil instanceof RenderBuffer) {
				this.#depth.resize(x, y);
			}
			this.#checkStatus();
			return this;
		}
		destroy() {
			this.#gl.deleteFramebuffer(this.#fb);
		}
		#checkStatus() {
			const gl = this.#gl;
			const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
			if (status === gl.FRAMEBUFFER_INCOMPLETE_ATTACHMENT) {
				throw new Error(
					`The attachment types are mismatched or not all framebuffer attachment points are framebuffer attachment complete.
For valid format/type combinations of framebuffer attachments, see https://www.khronos.org/registry/webgl/specs/1.0/#6.6 and https://www.khronos.org/registry/webgl/extensions/WEBGL_draw_buffers/`
				);
			} else if (status === gl.FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT) {
				throw new Error("There is no attachment.");
			} else if (status === gl.FRAMEBUFFER_INCOMPLETE_DIMENSIONS) {
				throw new Error("Height and width of the attachment are not the same.");
			} else if (status === gl.FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT) {
				throw new Error("There is no attachment.");
			} else if (status === gl.FRAMEBUFFER_UNSUPPORTED) {
				throw new Error(
					"The format of the attachment is not supported, or depth and stencil attachments are not the same renderbuffer."
				);
			} else if (status !== gl.FRAMEBUFFER_COMPLETE) {
				throw new Error("FrameBuffer invalid " + status);
			}
		}
		readPixels(x, y, w, h) {
			const gl = this.#gl;
			x = x || 0;
			y = y || 0;
			w = w || this.#width;
			h = h || this.#height;
			const attach = this.#colourAttachs[0];
			let format, type, arrClass;
			let itemsPerPx = 1;
			if (attach instanceof Texture) {
				if (
					attach.internalFormat === gl.RGBA ||
					attach.internalFormat === gl.RGB ||
					attach.internalFormat === gl.ALPHA
				) {
					format = attach.internalFormat;
					itemsPerPx = attach.getComponentsPerTexel();
				} else if (attach.internalFormat === gl.LUMINANCE) {
					format = gl.RGB;
					itemsPerPx = 3;
				} else if (attach.internalFormat === gl.R32F) {
					format = gl.RGBA;
					itemsPerPx = 4;
				} else {
					throw new Error(
						"Pixels cannot be read back from texture: texture internal format must be R32F, RGB, RGBA, ALPHA, LUMINANCE or LUMINANCE_ALPHA (all other formats yet unsupported by glii)"
					);
				}
				type = attach.type || gl.UNSIGNED_BYTE;
				arrClass = reverseTypeMap.get(type);
				if (!arrClass) {
					throw new Error("Unknown texture pixel type");
				}
			} else {
				if (attach.internalFormat === gl.RGBA4) {
					format = gl.RGBA;
					type = gl.UNSIGNED_SHORT_4_4_4_4;
					arrClass = Uint16Array;
				} else if (attach.internalFormat === gl.RGB565) {
					format = gl.RGB565;
					type = gl.UNSIGNED_SHORT_5_6_5;
					arrClass = Uint16Array;
				} else if (attach.internalFormat === gl.RGB5_A1) {
					format = gl.RGB5_A1;
					type = gl.UNSIGNED_SHORT_5_5_5_1;
					arrClass = Uint16Array;
				} else {
					throw new Error(
						"Pixels cannot be read back from renderbuffer: renderbuffer internal format must be RGBA4, RGB565 or RGB5_A1"
					);
				}
			}
			const pixelCount = w * h;
			const out = new arrClass(pixelCount * itemsPerPx);
			gl.bindFramebuffer(gl.FRAMEBUFFER, this.#fb);
			gl.readPixels(x, y, w, h, format, type, out);
			return out;
		}
	}
	registerFactory("FrameBuffer", function (gl) {
		return class WrappedFrameBuffer extends FrameBuffer {
			constructor(opts) {
				super(gl, opts);
			}
		};
	});

	class Texture {
		#gl;
		#tex;
		constructor(gl, opts = {}) {
			this.#gl = gl;
			this.#tex = gl.createTexture();
			this._unit = undefined;
			this._lastActive = performance.now();
			this.minFilter = opts.minFilter || gl.NEAREST;
			this.magFilter = opts.magFilter || gl.NEAREST;
			this.wrapS = opts.wrapS || gl.CLAMP_TO_EDGE;
			this.wrapT = opts.wrapT || gl.CLAMP_TO_EDGE;
			this.internalFormat = opts.internalFormat || gl.RGBA;
			this.format = opts.format || gl.RGBA;
			this.type = opts.type || gl.UNSIGNED_BYTE;
			this._isLoaded = false;
			this.width = undefined;
			this.height = undefined;
		}
		static _boundUnits = new WeakMap();
		get tex() {
			if (!this.#tex) {
				throw new Error("Texture has been destroyed and cannot be used");
			}
			return this.#tex;
		}
		getUnit() {
			this._lastActive = performance.now();
			const gl = this.#gl;
			if (this._unit !== undefined) {
				gl.activeTexture(gl.TEXTURE0 + this._unit);
				return this._unit;
			}
			if (!Texture._boundUnits.has(this.#gl)) {
				const maxUnits = this.#gl.getParameter(
					this.#gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS
				);
				Texture._boundUnits.set(this.#gl, new Array(maxUnits));
			}
			const units = Texture._boundUnits.get(this.#gl);
			let oldestUnit = -1;
			let oldestTime = Infinity;
			for (let i = 0, l = units.length; i < l; i++) {
				if (units[i] === undefined) {
					gl.activeTexture(gl.TEXTURE0 + i);
					gl.bindTexture(gl.TEXTURE_2D, this.#tex);
					units[i] = this;
					return (this._unit = i);
				}
				if (units[i]._lastActive < oldestTime) {
					oldestUnit = i;
					oldestTime = units[i]._lastActive;
				}
			}
			gl.activeTexture(gl.TEXTURE0 + oldestUnit);
			gl.bindTexture(gl.TEXTURE_2D, this.#tex);
			units[oldestUnit]._unit = undefined;
			units[oldestUnit] = this;
			return (this._unit = oldestUnit);
		}
		_resetParameters() {
			const gl = this.#gl;
			gl.bindTexture(gl.TEXTURE_2D, this.#tex);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, this.minFilter);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, this.magFilter);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, this.wrapS);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, this.wrapT);
		}
		texImage2D(img) {
			const gl = this.#gl;
			this._isLoaded = true;
			this.width = img.width;
			this.height = img.height;
			this.getUnit();
			gl.texImage2D(gl.TEXTURE_2D, 0, this.internalFormat, this.format, this.type, img);
			this._resetParameters();
			this.#generateMipmap();
			return this;
		}
		texSubImage2D(img, x, y) {
			const gl = this.#gl;
			this._isLoaded = true;
			this.getUnit();
			gl.texSubImage2D(gl.TEXTURE_2D, 0, x, y, this.internalFormat, this.type, img);
			this._resetParameters();
			this.#generateMipmap();
			return this;
		}
		texArray(w, h, arr) {
			this.getUnit();
			const gl = this.#gl;
			this._isLoaded = true;
			this.width = w;
			this.height = h;
			if (arr === null || reverseTypeMap.get(this.type) !== arr.constructor) {
				throw new Error("Passed TypedArray doesn't match the texture's pixel type ");
			}
			gl.texImage2D(
				gl.TEXTURE_2D,
				0,
				this.internalFormat,
				w,
				h,
				0,
				this.format,
				this.type,
				arr
			);
			this._resetParameters();
			this.#generateMipmap();
			return this;
		}
		#generateMipmap() {
			const gl = this.#gl;
			if (
				(this.minFilter === gl.NEAREST || this.minFilter === gl.LINEAR) &&
				(this.magFilter === gl.NEAREST || this.magFilter === gl.LINEAR)
			) {
				return;
			}
			gl.generateMipmap(gl.TEXTURE_2D);
		}
		isLoaded() {
			return this._isLoaded;
		}
		getComponentsPerTexel() {
			const gl = this.#gl;
			switch (this.format) {
				case gl.RGBA:
				case gl.RGBA_INTEGER:
					return 4;
				case gl.RGB:
				case gl.RGB_INTEGER:
					return 3;
				case gl.LUMINANCE_ALPHA:
				case gl.RG:
				case gl.RG_INTEGER:
					return 2;
				case gl.LUMINANCE:
				case gl.ALPHA:
				case gl.RED:
				case gl.RED_INTEGER:
					return 1;
				default:
					throw new Error("Unknown texel data format");
			}
		}
		asImageData() {
			if (!this._isLoaded) {
				throw new Error(
					"Must load something into the Texture before calling asImageData()"
				);
			}
			const gl = this.#gl;
			if (this.format !== gl.RGBA && this.internalFormat !== gl.R32F) {
				throw new Error("asImageData() only available for textures with RGBA8 or R32F format");
			}
			const fb = new FrameBuffer(gl, {
				width: this.width,
				height: this.height,
				colour: [this],
			});
			let pixels = fb.readPixels();
			if (this.internalFormat === gl.R32F) {
				const size = this.width * this.height;
				const redComponent = new Float32Array(size);
				for (let i = 0; i < size; i++) {
					redComponent[i] = pixels[i*4];
				}
				pixels = redComponent;
			}
			const imagedata = new ImageData(
				new Uint8ClampedArray(pixels.buffer),
				this.width,
				this.height
			);
			fb.destroy();
			return imagedata;
		}
		debugIntoCanvas(canvas) {
			const data = this.asImageData();
			canvas.width = this.width;
			canvas.height = this.height;
			canvas.getContext("2d").putImageData(data, 0, 0);
			return this;
		}
		destroy() {
			this.#gl.deleteTexture(this.#tex);
			this.#tex = undefined;
		}
	}
	registerFactory("Texture", function (gl) {
		return class WrappedTexture extends Texture {
			constructor(opts) {
				super(gl, opts);
			}
			static getMaxSize() {
				return gl.getParameter(gl.MAX_TEXTURE_SIZE);
			}
		};
	});

	class AbstractAttributeSet {
		constructor(gl, options = {}, recordSize = 0) {
			this._gl = gl;
			this._recordSize = recordSize;
			this._size = options.size || 255;
			this._growFactor = options.growFactor;
			this._usage = options.usage || gl.STATIC_DRAW;
			this._buf = gl.createBuffer();
			gl.bindBuffer(gl.ARRAY_BUFFER, this._buf);
			gl.bufferData(gl.ARRAY_BUFFER, this._recordSize * this._size, this._usage);
			if (this._growFactor) {
				this._byteData = new Uint8Array(this._recordSize * this._size);
			}
		}
		static GLSL_TYPE_COMPONENTS = {
			float: 1,
			vec2: 2,
			vec3: 3,
			vec4: 4,
		};
		commit(index, length) {
			const gl = this._gl;
			const addr = this._recordSize * index;
			const size = this._recordSize * length;
			const data = new Uint8Array(this._byteData.buffer, addr, size);
			if (!isFinite(addr) || !isFinite(size)) {
				throw new Error("Cannot commit attribute data witn non-finite start/length");
			}
			gl.bindBuffer(gl.ARRAY_BUFFER, this._buf);
			gl.bufferSubData(gl.ARRAY_BUFFER, addr, data);
			return this;
		}
		setBytes(index, offset, data) {
			const upperIndex =
				index + Math.floor((data.byteLength + offset) / this._recordSize);
			if (upperIndex > this._size) {
				this._grow(upperIndex);
			}
			const gl = this._gl;
			gl.bindBuffer(gl.ARRAY_BUFFER, this._buf);
			const addr = this._recordSize * index + offset;
			gl.bufferSubData(gl.ARRAY_BUFFER, addr, data);
			if (this._byteData) {
				if (data instanceof ArrayBuffer) {
					this._byteData.set(new Uint8Array(data), addr);
				} else {
					this._byteData.set(
						new Uint8Array(data.buffer, data.byteOffset, data.byteLength),
						addr
					);
				}
			}
			return this;
		}
		_grow(minimum) {
			if (!this._growFactor) {
				throw new Error(
					`Non-growable attribute buffer can only hold ${
					this._size
				} records, but tried to set ${minimum + 1}-th record.`
				);
			}
			this._size = Math.max(minimum + 1, Math.ceil(this._size * this._growFactor));
			const newByteData = new Uint8Array(this._recordSize * this._size);
			newByteData.set(this._byteData, 0);
			this._byteData = newByteData;
			const gl = this._gl;
			gl.bindBuffer(gl.ARRAY_BUFFER, this._buf);
			gl.bufferData(gl.ARRAY_BUFFER, this._byteData, this._usage);
		}
	}

	const precisionQualifiers = "((?:(?:lowp)|(?:mediump)|(?:highp))\\s+)?";
	const glsl1AttribTypes = "((?:float)|(?:vec[2-4]))";
	const glsl1VaryingTypes = "((?:float)|(?:int)|(?:bool)|(?:[ib]?vec[2-4])|(?:mat[2-4]))";
	const regexpAttrib = new RegExp(
		"^" +
			precisionQualifiers +
			glsl1AttribTypes +
			"$"
	);
	const regexpVarying = new RegExp("^" + precisionQualifiers + glsl1VaryingTypes + "$");
	function parseGlslAttribType(str) {
		const match = regexpAttrib.exec(str);
		if (!match) {
			throw new Error(
				`Invalid GLSL type. Expected float|vec2|vec3|vec4 (optionally prepended by lowp|mediump|highp), but found "${str}"`
			);
		}
		const [_, precision, type] = match;
		return [precision, type];
	}
	function parseGlslVaryingType(str) {
		const match = regexpVarying.exec(str);
		if (!match) {
			throw new Error(
				`Invalid GLSL type. Expected float|vec(234)|(ib)vec(234)|mat(234) (optionally prepended by lowp|mediump|highp), but found "${str}"`
			);
		}
		const [_, precision, type] = match;
		return [precision, type];
	}
	const parseGlslUniformType = parseGlslVaryingType;

	function stridify(arrayType) {
		return class StridedTypeArray extends arrayType {
			#stride;
			#offset;
			constructor(buffer, stride, offset) {
				super(buffer);
				this.#stride = stride;
				this.#offset = offset;
			}
			set(values, index) {
				super.set(values, index * this.#stride + this.#offset);
			}
		};
	}
	const stridedArrays = new Map(Array.from(typeMap.keys()).map((t) => [t, stridify(t)]));

	class SingleAttribute extends AbstractAttributeSet {
		constructor(gl, options) {
			const type = options.type || Float32Array;
			const bytesPerElement = type.BYTES_PER_ELEMENT;
			const fullGlslType = options.glslType || "float";
			const [glslPrecision, glslType] = parseGlslAttribType(fullGlslType);
			if (!(glslType in AbstractAttributeSet.GLSL_TYPE_COMPONENTS)) {
				throw new Error(
					"Invalid value for the `glslType` option; must be `float`, `vec2`, `vec3`, or `vec4`."
				);
			}
			const componentCount = AbstractAttributeSet.GLSL_TYPE_COMPONENTS[glslType];
			super(gl, options, bytesPerElement * componentCount);
			this._glslType = fullGlslType;
			this._componentCount = componentCount;
			this._glType = typeMap.get(type);
			this._normalized = options.normalized;
			if (options.glslType === "float") {
				this.set = this.setNumber;
			} else {
				this.set = this.setArray;
			}
			this._recordBuf = new type(componentCount);
			this._arrayType = type;
		}
		setNumber(index, value) {
			this._recordBuf[0] = value;
			super.setBytes(index, 0, this._recordBuf);
			return this;
		}
		setArray(index, values) {
			if (values.length !== this._componentCount) {
				throw new Error(
					`Expected ${this._componentCount} values but got ${values.length}.`
				);
			}
			this._recordBuf.set(values);
			super.setBytes(index, 0, this._recordBuf);
			return this;
		}
		asStridedArray(minSize) {
			if (minSize > this._size) {
				this._grow(minSize);
			}
			return new (stridedArrays.get(this._arrayType))(
				this._byteData.buffer,
				this._componentCount,
				0
			);
		}
		multiSet(index, values) {
			if (values.length % this._componentCount) {
				throw new Error(
					`Expected values to be a multiple of ${this._componentCount} but got ${values.length}.`
				);
			}
			super.setBytes(index, 0, this._arrayType.from(values));
			return this;
		}
		bindWebGL1(location) {
			const gl = this._gl;
			gl.bindBuffer(gl.ARRAY_BUFFER, this._buf);
			gl.enableVertexAttribArray(location);
			gl.vertexAttribPointer(
				location,
				this._componentCount,
				this._glType,
				this._normalized,
				this._recordSize,
				0
			);
		}
		getGlslType() {
			return this._glslType;
		}
		destroy() {
			this._gl.deleteBuffer(this._buf);
		}
		debugDump() {
			const view = new this._arrayType(this._byteData.buffer);
			return Array.from(new Array(this._size), (_, i) => {
				const j = i * this._componentCount;
				return view.subarray(j, j + this._componentCount);
			});
		}
	}
	registerFactory("SingleAttribute", function (gl) {
		return class WrappedSingleAttribute extends SingleAttribute {
			constructor(options) {
				super(gl, options);
			}
		};
	});

	class SequentialIndices {
		constructor(gl, options = {}) {
			this._gl = gl;
			this._size = options.size || 3;
			this._drawMode = options.drawMode === undefined ? gl.TRIANGLES : options.drawMode;
		}
		drawMe() {
			this._gl.drawArrays(this._drawMode, 0, this._size);
		}
		drawMePartial(start, count) {
			this._gl.drawArrays(this._drawMode, start, count);
		}
	}
	registerFactory("SequentialIndices", function (gl) {
		return class WrappedSequentialIndices extends SequentialIndices {
			constructor(options) {
				super(gl, options);
			}
		};
	});

	class IndexBuffer extends SequentialIndices {
		constructor(gl, gliiFactory, options = {}) {
			super(gl, options);
			this._size = options.size || 255;
			this._growFactor = options.growFactor || 1.2;
			this._usage = options.usage || gl.STATIC_DRAW;
			this._type = options.type || gl.UNSIGNED_SHORT;
			if (this._type === gl.UNSIGNED_BYTE) {
				this._bytesPerSlot = 1;
				this._typedArray = Uint8Array;
				this._maxValue = 1 << 8;
			} else if (this._type === gl.UNSIGNED_SHORT) {
				this._bytesPerSlot = 2;
				this._typedArray = Uint16Array;
				this._maxValue = 1 << 16;
			} else if (this._type === gl.UNSIGNED_INT) {
				gliiFactory.isWebGL2() || gliiFactory.loadExtension("OES_element_index_uint");
				this._bytesPerSlot = 4;
				this._typedArray = Uint32Array;
				this._maxValue = (1 << 16) * (1 << 16);
			} else {
				throw new Error(
					"Invalid type for IndexBuffer. Must be one of `gl.UNSIGNED_BYTE`, `gl.UNSIGNED_SHORT` or `gl.UNSIGNED_INT`."
				);
			}
			this._buf = gl.createBuffer();
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._buf);
			gl.bufferData(
				gl.ELEMENT_ARRAY_BUFFER,
				this._size * this._bytesPerSlot,
				this._usage
			);
			this._activeIndices = 0;
			if (this._growFactor) {
				this._ramData = new this._typedArray(this._size);
			}
		}
		set(n, indices) {
			if (indices.length === 0) {
				return this;
			}
			const gl = this._gl;
			this.grow(n + indices.length);
			gl.bufferSubData(
				gl.ELEMENT_ARRAY_BUFFER,
				n * this._bytesPerSlot,
				this._typedArray.from(indices)
			);
			this._setActiveIndices(n + indices.length);
			if (this._ramData) {
				this._ramData.set(indices, n);
			}
			return this;
		}
		truncate(n) {
			this._activeIndices = Math.min(this._activeIndices, n);
			return this;
		}
		grow(minimum) {
			this.bindMe();
			if (this._size >= minimum) {
				return;
			}
			if (!this._growFactor) {
				throw new Error(
					`Tried to set index out of bounds of non-growable IndexBuffer (requested ${minimum} vs size ${this._size})`
				);
			} else {
				this._size = Math.max(minimum + 1, Math.ceil(this._size * this._growFactor));
				const newRamData = new this._typedArray(this._size);
				newRamData.set(this._ramData, 0);
				this._ramData = newRamData;
				const gl = this._gl;
				gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this._ramData, this._usage);
			}
		}
		bindMe() {
			const gl = this._gl;
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._buf);
		}
		drawMe() {
			this.bindMe();
			this._gl.drawElements(this._drawMode, this._activeIndices, this._type, 0);
		}
		drawMePartal(start, count) {
			this.bindMe();
			this._gl.drawElements(
				this._drawMode,
				count,
				this._type,
				start * this._bytesPerSlot
			);
		}
		_setActiveIndices(n) {
			this._activeIndices = Math.max(this._activeIndices, n);
		}
		destroy() {
			this._gl.deleteBuffer(this._buf);
		}
		asTypedArray(minSize) {
			if (isFinite(minSize)) {
				this.grow(minSize);
			}
			return this._ramData;
		}
		commit(start, length) {
			this.bindMe();
			const addr = this._bytesPerSlot * start;
			const data = new this._typedArray(this._ramData.buffer, addr, length);
			const gl = this._gl;
			gl.bufferSubData(gl.ELEMENT_ARRAY_BUFFER, addr, data);
			this._setActiveIndices(start + length);
		}
	}
	registerFactory("IndexBuffer", function (gl, gliiFactory) {
		return class WrappedIndexBuffer extends IndexBuffer {
			constructor(options) {
				super(gl, gliiFactory, options);
			}
		};
	});

	const errRegexp = /ERROR: 0:([0-9]+):(.*)\n/;
	function prettifyGlslError(log, header, src, type, lineOffset) {
		const match = errRegexp.exec(log);
		if (match) {
			let lineNumber = match[1];
			const msg = match[2];
			if (lineNumber < lineOffset) {
				const line = header.split("\n")[lineNumber - 1];
				throw new Error(
					`Could not compile ${type} shader, reason:\n${msg}\nError lies in injected GLSL headers (check inputs like attributes and uniforms)\nAround line ${lineNumber}: ${line}`
				);
			} else {
				lineNumber -= lineOffset;
				const line = src.split("\n")[lineNumber - 1];
				throw new Error(
					`Could not compile ${type} shader, reason:\n${msg}\nAround line ${lineNumber}: ${line}`
				);
			}
		}
		throw new Error(`Could not compile ${type} shader, reason in unknown line:\n${log}`);
	}

	class WebGL1Program {
		constructor(
			gl,
			gliiFactory,
			{
				vertexShaderSource,
				varyings = {},
				fragmentShaderSource,
				indexBuffer,
				attributes = {},
				uniforms = {},
				textures = {},
				target = null,
				depth = 0x0207,
				blend = false,
				unusedWarning = true,
			}
		) {
			this._gl = gl;
			this._gliiFactory = gliiFactory;
			let attribDefs = "";
			for (let attribName in attributes) {
				const type = attributes[attribName].getGlslType();
				attribDefs += `attribute ${type} ${attribName};\n`;
			}
			let uniformDefs = "";
			this._unifSetters = {};
			for (let uName in uniforms) {
				const uniformType = uniforms[uName];
				const [_, glslType] = parseGlslUniformType(uniformType);
				switch (glslType) {
					case "float":
						this._unifSetters[uName] = gl.uniform1f.bind(gl);
						break;
					case "vec2":
						this._unifSetters[uName] = gl.uniform2fv.bind(gl);
						break;
					case "vec3":
						this._unifSetters[uName] = gl.uniform3fv.bind(gl);
						break;
					case "vec4":
						this._unifSetters[uName] = gl.uniform4fv.bind(gl);
						break;
					case "int":
					case "bool":
						this._unifSetters[uName] = gl.uniform1i.bind(gl);
						break;
					case "ivec2":
					case "bvec2":
						this._unifSetters[uName] = gl.uniform2iv.bind(gl);
						break;
					case "ivec3":
					case "bvec3":
						this._unifSetters[uName] = gl.uniform3iv.bind(gl);
						break;
					case "ivec4":
					case "bvec4":
						this._unifSetters[uName] = gl.uniform4iv.bind(gl);
						break;
					case "mat2":
						this._unifSetters[uName] = (p, v) => gl.uniformMatrix2fv(p, false, v);
						break;
					case "mat3":
						this._unifSetters[uName] = (p, v) => gl.uniformMatrix3fv(p, false, v);
						break;
					case "mat4":
						this._unifSetters[uName] = (p, v) => gl.uniformMatrix4fv(p, false, v);
						break;
					default:
						throw new Error(`Unknown uniform GLSL type "${uniformType}"`);
				}
				uniformDefs += `uniform ${uniformType} ${uName};\n`;
			}
			for (let texName in textures) {
				uniformDefs += "uniform sampler2D " + texName + ";\n";
			}
			let varyingDefs = Object.entries(varyings)
				.map(([n, t]) => {
					parseGlslVaryingType(t);
					return `varying ${t} ${n};\n`;
				})
				.join("");
			const precisionHeader = "precision highp float;\n";
			const program = (this._program = gl.createProgram());
			const vertexShader = this._compileShader(
				gl.VERTEX_SHADER,
				precisionHeader + attribDefs + varyingDefs + uniformDefs,
				vertexShaderSource
			);
			const fragmtShader = this._compileShader(
				gl.FRAGMENT_SHADER,
				precisionHeader + varyingDefs + uniformDefs,
				fragmentShaderSource
			);
			gl.linkProgram(program);
			var success = gl.getProgramParameter(program, gl.LINK_STATUS);
			if (!success) {
				console.warn(gl.getProgramInfoLog(program));
				gl.deleteProgram(program);
				throw new Error("Could not compile shaders into a WebGL1 program");
			}
			gl.detachShader(program, vertexShader);
			gl.deleteShader(vertexShader);
			gl.detachShader(program, fragmtShader);
			gl.deleteShader(fragmtShader);
			if (!(indexBuffer instanceof SequentialIndices)) {
				throw new Error(
					"The WebGL1Program constructor needs a valid `IndexBuffer` to be passed as an option."
				);
			}
			this._indexBuff = indexBuffer;
			this._attrs = attributes;
			this._attribsMap = {};
			for (let attribName in attributes) {
				const loc = gl.getAttribLocation(this._program, attribName);
				if (loc === -1) {
					if (unusedWarning)
						console.warn(
							`Attribute "${attribName}" is not used in the shaders and will be ignored`
						);
					delete this._attrs[attribName];
				} else {
					this._attribsMap[attribName] = loc;
				}
			}
			this._unifsMap = {};
			this._texs = textures;
			this._unifs = uniforms;
			for (let unifName in uniforms) {
				const loc = gl.getUniformLocation(this._program, unifName);
				if (unusedWarning && loc === -1) {
					console.warn(`Uniform "${unifName}" is not being used in the shaders.`);
				}
				this._unifsMap[unifName] = loc;
			}
			for (let texName in textures) {
				if (texName in this._unifsMap) {
					throw new Error(
						`Texture name "${texName}" conflicts with already defined (non-texture) uniform.`
					);
				}
				const loc = gl.getUniformLocation(this._program, texName);
				if (unusedWarning && loc === -1) {
					console.warn(`Texture "${texName}" is not being used in the shaders.`);
				}
				this._unifsMap[texName] = loc;
			}
			this._target = target;
			this.depth = depth;
			this.blend = blend;
		}
		_compileShader(type, header, src) {
			const gl = this._gl;
			const shader = gl.createShader(type);
			gl.shaderSource(shader, "#line 1\n" + header + "#line 10001\n" + src);
			gl.compileShader(shader);
			const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
			if (success) {
				gl.attachShader(this._program, shader);
				return shader;
			}
			const log = gl.getShaderInfoLog(shader);
			gl.deleteShader(shader);
			const readableType = type === gl.VERTEX_SHADER ? "vertex" : "fragment";
			prettifyGlslError(log, header, src, readableType, 10000);
			throw new Error("Could not compile shader.");
		}
		_preRun() {
			const gl = this._gl;
			if (!this._target) {
				gl.bindFramebuffer(gl.FRAMEBUFFER, null);
				this._gliiFactory.refreshDrawingBufferSize();
				gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
			} else {
				gl.bindFramebuffer(gl.FRAMEBUFFER, this._target.fb);
				gl.viewport(0, 0, this._target.width, this._target.height);
			}
			if (this.blend) {
				gl.enable(gl.BLEND);
				gl.blendEquationSeparate(this.blend.equationRGB, this.blend.equationAlpha);
				gl.blendFuncSeparate(
					this.blend.srcRGB,
					this.blend.dstRGB,
					this.blend.srcAlpha,
					this.blend.dstAlpha
				);
				if (this.blend.colour) {
					gl.blendColor(
						this.blend.colour[0],
						this.blend.colour[1],
						this.blend.colour[2],
						this.blend.colour[3]
					);
				}
			} else {
				gl.disable(gl.BLEND);
			}
			gl.useProgram(this._program);
			if (this.depth === gl.ALWAYS) {
				gl.disable(gl.DEPTH_TEST);
			} else {
				gl.enable(gl.DEPTH_TEST);
				gl.depthFunc(this.depth);
			}
			for (let attribName in this._attrs) {
				const location = this._attribsMap[attribName];
				this._attrs[attribName].bindWebGL1(location);
			}
			for (let texName in this._texs) {
				if (this._texs[texName]) {
					gl.uniform1i(this._unifsMap[texName], this._texs[texName].getUnit());
				}
			}
		}
		run(lod) {
			this._preRun();
			this._indexBuff.drawMe(lod);
			return this;
		}
		runPartial(start, count) {
			this._preRun();
			this._indexBuff.drawMePartial(start, count);
			return this;
		}
		setUniform(name, value) {
			this._gl.useProgram(this._program);
			if (name in this._unifSetters) {
				this._unifSetters[name](this._unifsMap[name], value);
				return this;
			} else {
				throw new Error(`Uniform name ${name} is unknown in this WebGL1Program.`);
			}
		}
		getUniform(name) {
			const location = this._unifsMap[name];
			if (location){
				return this._gl.getUniform( this._program, location);
			} else {
				throw new Error(`Uniform name ${name} is unknown or unused in this WebGL1Program.`);
			}
		}
		setTexture(name, texture) {
			this._texs[name] = texture;
			return this;
		}
		setIndexBuffer(buf) {
			this._indexBuff = buf;
			return this;
		}
		setAttribute(name, attr) {
			if (this._attrs[name].getGlslType() !== attr.getGlslType()) {
				throw new Error(
					`Bindable attribute named ${name} expected to be of type ${this._attrs[
					name
				].getGlslType()}, but instead got ${attr.getGlslType()}`
				);
			}
			this._attrs[name] = attr;
			return this;
		}
		setTarget(target) {
			this._target = target;
			return this;
		}
		destroy() {
			this._gl.deleteProgram(this._program);
		}
		debugDumpAttributes() {
			const attrValues = {};
			for (const [name, bound] of Object.entries(this._attrs)) {
				attrValues[name] = bound.debugDump();
			}
			let maxLength = 0;
			for (let values of Object.values(attrValues)) {
				maxLength = Math.max(maxLength, values.length);
			}
			return Array.from(new Array(maxLength), (_, i) => {
				const obj = {};
				for (const [name, values] of Object.entries(attrValues)) {
					obj[name] = values[i];
				}
				return obj;
			});
		}
	}
	registerFactory("WebGL1Program", function (gl, gliiFactory) {
		return class WrappedWebGL1Program extends WebGL1Program {
			constructor(opts) {
				super(gl, gliiFactory, opts);
			}
		};
	});

	class TinyQueue {
		constructor(data = [], compare = defaultCompare) {
			this.data = data;
			this.length = this.data.length;
			this.compare = compare;
			if (this.length > 0) {
				for (let i = (this.length >> 1) - 1; i >= 0; i--) this._down(i);
			}
		}
		push(item) {
			this.data.push(item);
			this.length++;
			this._up(this.length - 1);
		}
		pop() {
			if (this.length === 0) return undefined;
			const top = this.data[0];
			const bottom = this.data.pop();
			this.length--;
			if (this.length > 0) {
				this.data[0] = bottom;
				this._down(0);
			}
			return top;
		}
		peek() {
			return this.data[0];
		}
		_up(pos) {
			const { data, compare } = this;
			const item = data[pos];
			while (pos > 0) {
				const parent = (pos - 1) >> 1;
				const current = data[parent];
				if (compare(item, current) >= 0) break;
				data[pos] = current;
				pos = parent;
			}
			data[pos] = item;
		}
		_down(pos) {
			const { data, compare } = this;
			const halfLength = this.length >> 1;
			const item = data[pos];
			while (pos < halfLength) {
				let left = (pos << 1) + 1;
				let best = data[left];
				const right = left + 1;
				if (right < this.length && compare(data[right], best) < 0) {
					left = right;
					best = data[right];
				}
				if (compare(best, item) >= 0) break;
				data[pos] = best;
				pos = left;
			}
			data[pos] = item;
		}
	}
	function defaultCompare(a, b) {
		return a < b ? -1 : a > b ? 1 : 0;
	}

	class Arrugator {
		constructor(projector, verts, uv, trigs) {
			this._projector = projector;
			this._verts = verts;
			this._uv = uv;
			this._projVerts = verts.map(projector);
			this._trigs = trigs;
			this._segs = [];
			this._segCount = 0;
			this._segTrigs = [];
			this._queue = new TinyQueue([], function (a, b) {
				return b.epsilon - a.epsilon;
			});
			this._vertToSeg = new Array(verts.length);
			for (let i in this._verts) {
				this._vertToSeg[i] = [];
			}
			for (let t in this._trigs) {
				let trig = this._trigs[t];
				let v0 = trig[0];
				let v1 = trig[1];
				let v2 = trig[2];
				this._segment(v0, v1, t);
				this._segment(v1, v2, t);
				this._segment(v2, v0, t);
			}
		}
		_segment(v1, v2, t, maxEpsilon = Infinity) {
			if (this._vertToSeg[v1] && this._vertToSeg[v1][v2] !== undefined) {
				const found = this._vertToSeg[v1][v2];
				if (!this._segTrigs[found].includes(t)) {
					this._segTrigs[found].push(t);
				}
				return found;
			}
			const segIdx = this._segCount++;
			this._segs[segIdx] = [v1, v2];
			this._vertToSeg[v1][v2] = segIdx;
			this._vertToSeg[v2][v1] = segIdx;
			this._segTrigs[segIdx] = [t];
			const midpoint = [
				(this._verts[v1][0] + this._verts[v2][0]) / 2,
				(this._verts[v1][1] + this._verts[v2][1]) / 2,
			];
			const projectedMid = this._projector(midpoint);
			const midProjected = [
				(this._projVerts[v1][0] + this._projVerts[v2][0]) / 2,
				(this._projVerts[v1][1] + this._projVerts[v2][1]) / 2,
			];
			const epsilon =
				(projectedMid[0] - midProjected[0]) ** 2 +
				(projectedMid[1] - midProjected[1]) ** 2;
			if (Number.isFinite(epsilon) && epsilon < maxEpsilon) {
				this._queue.push({
					v1: v1,
					v2: v2,
					epsilon: epsilon,
					midpoint: midpoint,
					projectedMid: projectedMid,
				});
			}
			return segIdx;
		}
		output() {
			return {
				unprojected: Array.from(this._verts),
				projected: Array.from(this._projVerts),
				uv: Array.from(this._uv),
				trigs: Array.from(this._trigs),
			};
		}
		#stepsWithSameEpsilon = 0;
		lowerEpsilon(targetEpsilon) {
			let currentEpsilon = this._queue.peek().epsilon;
			let lastEpsilon = currentEpsilon;
			while ( currentEpsilon >= targetEpsilon) {
				this.step();
				currentEpsilon = this._queue.peek().epsilon;
				if (currentEpsilon === lastEpsilon) {
					this.#stepsWithSameEpsilon++;
					if (this.#stepsWithSameEpsilon < 500) {
						console.warn("Arrugator stopped due to epsilon stall. Raster may need hints for proper arrugation.");
						break;
					}
				} else {
					this.#stepsWithSameEpsilon = 0;
					lastEpsilon = currentEpsilon;
				}
			}
		}
		get epsilon() {
			return this._queue.peek().epsilon;
		}
		set epsilon(ep) {
			return this.lowerEpsilon(ep);
		}
		step() {
			const seg = this._queue.pop();
			return this.#splitSegment(seg, seg.epsilon);
		}
		force() {
			const segments = this._queue.data;
			this._queue.data = [];
			this._queue.length = 0;
			segments.forEach(seg=>this.#splitSegment(seg, Infinity));
		}
		#splitSegment(seg, maxEpsilon) {
			const v1 = seg.v1;
			const v2 = seg.v2;
			const s = this._vertToSeg[v1] && this._vertToSeg[v1][v2];
			const trigs = this._segTrigs[s];
			if (trigs.length >= 3) {
				throw new Error("Somehow a segment is shared by three triangles");
			}
			delete this._segTrigs[s];
			delete this._segs[s];
			delete this._vertToSeg[v1][v2];
			delete this._vertToSeg[v2][v1];
			const vm = this._verts.length;
			this._projVerts[vm] = seg.projectedMid;
			this._verts[vm] = seg.midpoint;
			this._vertToSeg[vm] = [];
			this._uv[vm] = [
				(this._uv[v1][0] + this._uv[v2][0]) / 2,
				(this._uv[v1][1] + this._uv[v2][1]) / 2,
			];
			for (let t of trigs) {
				this._splitTriangle(v1, v2, vm, t, maxEpsilon);
			}
		}
		_splitTriangle(v1, v2, vm, t, epsilon = Infinity) {
			const tvs = this._trigs[t];
			let v3;
			let winding = false;
			if (tvs[0] === v1 && tvs[1] === v2) {
				v3 = tvs[2];
				winding = true;
			} else if (tvs[1] === v1 && tvs[2] === v2) {
				v3 = tvs[0];
				winding = true;
			} else if (tvs[2] === v1 && tvs[0] === v2) {
				v3 = tvs[1];
				winding = true;
			} else if (tvs[1] === v1 && tvs[0] === v2) {
				v3 = tvs[2];
				winding = false;
			} else if (tvs[2] === v1 && tvs[1] === v2) {
				v3 = tvs[0];
				winding = false;
			} else if (tvs[0] === v1 && tvs[2] === v2) {
				v3 = tvs[1];
				winding = false;
			} else {
				throw new Error(
					"Data structure mishap: could not fetch 3rd vertex used in triangle"
				);
			}
			const t2 = this._trigs.length;
			if (winding) {
				this._trigs[t] = [v1, vm, v3];
				this._trigs[t2] = [vm, v2, v3];
			} else {
				this._trigs[t] = [vm, v1, v3];
				this._trigs[t2] = [v2, vm, v3];
			}
			const s1 = this._vertToSeg[v1] && this._vertToSeg[v1][v2];
			const s2 = this._vertToSeg[v2] && this._vertToSeg[v2][v3];
			const s3 = this._vertToSeg[v3] && this._vertToSeg[v3][v1];
			function filterTrig(i) {
				return i !== t;
			}
			if (s1 !== undefined) {
				this._segTrigs[s1] = this._segTrigs[s1].filter(filterTrig);
			}
			if (s2 !== undefined) {
				this._segTrigs[s2] = this._segTrigs[s2].filter(filterTrig);
			}
			if (s3 !== undefined) {
				this._segTrigs[s3] = this._segTrigs[s3].filter(filterTrig);
			}
			this._segment(v1, vm, t, epsilon);
			this._segment(vm, v3, t, epsilon);
			this._segment(v3, v1, t, epsilon);
			this._segment(v2, vm, t2, epsilon);
			this._segment(vm, v3, t2, epsilon);
			this._segment(v3, v2, t2, epsilon);
		}
	}

	function clamp(n, min, max) {
		return Math.max(min, Math.min(n, max));
	}


	/**
	 * Utility function for creating a pre-split grid. This is meant for rasters
	 * that span large areas, since they tend to be problematic on the poles and
	 * antimeridian: cropping and pre-splitting these will alleviate artifacts.
	 *
	 * Input corners must be in the following order:
	 * - Top-left
	 * - Bottom-left
	 * - Upper-right
	 * - Lower-right
	 *
	 * This will generate subdivisions^2 quads as a result (or 2 * subdivisions^2
	 * triangles). Default of 25 quads for 5 horizontal & vertical subdivisions.
	 *
	 */

	function preSplitGrid(
		corners,
		subdivisions = 5,
		cropX = [-Infinity, +Infinity],
		cropY = [-Infinity, +Infinity]
	) {

		const [[x1,y1],[x2,y2],[x3,y3],[x4,y4]] = corners;

		let vertices = new Array(subdivisions ** 2);
		let sourceUV = new Array(subdivisions ** 2);

		for (let i=0; i<=subdivisions; i++) {
			const pctY = i/subdivisions;
			const pctY1 = 1 - pctY;
			for (let j=0; j<=subdivisions; j++) {
				const pctX = j/subdivisions;
				const pctX1 = 1 - pctX;

				let x =
					(x1 * pctX1 + x3 * pctX) * pctY1 +
					(x2 * pctX1 + x4 * pctX) * pctY ;
				let y =
					(y1 * pctX1 + y3 * pctX) * pctY1 +
					(y2 * pctX1 + y4 * pctX) * pctY ;

				x = clamp(x, cropX[0], cropX[1]);
				y = clamp(y, cropY[0], cropY[1]);
				vertices[ i*(subdivisions+1)+j ] = [x,y];
				sourceUV[ i*(subdivisions+1)+j ] = [pctX, pctY];
			}
		}

		//trigs = [[0,1,3],[0,3,2]]
		let trigs = new Array();


		for (let i=0; i<subdivisions; i++) {
			const offset1 = (i * (subdivisions+1));
			const offset2 = ((i+1) * (subdivisions+1));
			for (let j=0; j<subdivisions; j++) {
				trigs.push([offset1 + j, offset1 + j + 1, offset2 + j]);
				trigs.push([offset1 + j + 1, offset2+ j, offset2 + j + 1]);
			}
		}

		return {vertices, sourceUV, trigs};
	}

	// import { GLFactory as Glii } from "glii";

	/**
	 * @class L.ImageOverlay.Arrugator
	 *
	 * Displays reprojected raster images.
	 *
	 * Leverages Glii for not going insane with the WebGL bits, and Arrugator for
	 * calculating the triangle mesh for raster reprojection.
	 *
	 */

	L.ImageOverlay.Arrugator = L.Layer.extend({
		options: {
			// @option controlPoints: Array of Array of Number
			// An `Array` of four points, corresponding to the X-Y CRS coordinates
			// for the four corners of the raster.
			// The order must be: top-left, bottom-left, upper-right, lower-right
			controlPoints: undefined,

			// @option padding: Number = 0.1
			// How much to extend the clip area around the map view (relative to its size)
			// e.g. 0.1 would be 10% of map view in each direction
			padding: 0.1,

			// @option epsilon: Number = 1000000
			// Target epsilon for the Arrugator triangle subdivision. Should be equal to the
			// *square* of the maximum error, in projected map units. The default equals
			// 1000 map units.
			epsilon: 1000000,

			// @option fragmentShader: String = "void main() { gl_FragColor = texture2D(uRaster, vUV); }"
			// A `String` containing the WebGL fragment shader to be used. The default
			// just samples the predefined `uRaster` texture with the predefined `vUV`
			// `vec2` varying.
			//
			// Do not change the default unless you know what a fragment shader is.
			fragmentShader: "void main() { gl_FragColor = texture2D(uRaster, vUV); }",

			// @option subdivisions: Number = 1
			// Before arrugating the raster, it will be split into this many horizontal
			// & vertical subdivisions. The default of one subdivision (i.e. one quad,
			// two triangles) will work for rasters which cover a small area, but
			// rasters covering large swaths can display projection artifacts
			// unless they're split beforehand.
			subdivisions: 1,

			// @option cropX: Number = [-Infinity, Infinity]
			// The horizontal component of the input coordinates will be cropped
			// between these values.
			cropX: [-Infinity, Infinity],

			// @option cropX: Number = [-Infinity, Infinity]
			// The vertical component of the input coordinates will be cropped
			// between these values.
			//
			// This is meant to prevent projection artifacts near the poles.
			// When projecting from EPSG:4326 into EPSG:3857, it is recommended to
			// crop vertically between [-89, +89].
			cropY: [-Infinity, Infinity],

			map: undefined,
			opacity: undefined,
			myCanvas: undefined
		},

		initialize: function initialize(url, opts) {
			this._reactLeafletMap = this._map || opts.map;

			if (opts.myCanvas) {
				this._myCanvas = opts.myCanvas;
			}

			if (!this._reactLeafletMap ||!this._reactLeafletMap instanceof L.Map) {
				throw new Error("A L.ImageOverlay.Arrugator needs a fully setup map container");
			}
			this._src = url;

			// @option controlPoints: Array of Array of Number
			// An array of four pairs of coordinates,
			this._controlPoints = opts.controlPoints;
			if (!(this._controlPoints instanceof Array) || this._controlPoints.length !== 4) {
				throw new Error(
					"A L.ImageOverlay.Arrugator needs a 'controlPoints' option, which must be an array of four coordinates"
				);
			}

			// @option projector: Function
			// A `Function` that should take an `Array` of two numbers (coordinates in the
			// raster's original projection) and return an `Array` of two numbers
			// (coordinates in the Leaflet display projection).
			//
			// Typically this should be a proj4 forward projection function, like
			// `proj4(srcCRS, displayCRS).forward`
			//
			// It's up to the developer to ensure that the projector function is the adequate
			// for the CRSs.
			this._projector = opts.projector;
			if (!(this._projector instanceof Function)) {
				throw new Error(
					"A L.ImageOverlay.Arrugator needs a 'projector' option, which must be function for projecting coordinate pairs"
				);
			}

			L.Util.setOptions(this, opts);
		},

		onAdd: function onAdd() {
			if (!this._container) {
				this._initContainer();

				if (this._zoomAnimated) {
					L.DomUtil.addClass(this._container, "leaflet-zoom-animated");
				}
			}

			if (this.options.opacity) {
				L.DomUtil.setOpacity(this._container, this.options.opacity);
			}

			this.getPane().appendChild(this._container);
			this._reset();
		},

		onRemove: function onRemove() {
			this._destroyContainer();
		},

		getEvents: L.Renderer.prototype.getEvents,
		// 	_onAnimZoom: L.Renderer.prototype._onAnimZoom,
		_onAnimZoom: function (ev) {
			this._updateTransform(ev.center, ev.zoom);
			this._redraw();
		},
		// 	_onZoom: L.Renderer.prototype._onZoom,
		_onZoom: function (ev) {
			this._update();
		},
		_onZoomEnd: L.Util.falseFn,
		_updateTransform: L.Renderer.prototype._updateTransform,

		_initContainer: function _initContainer() {
			this._container = this._myCanvas || document.createElement("canvas");

			const glii = (this._glii = new GliiFactory(this._container, {
				preMultipliedAlpha: false,
			}));

			const rasterTexture = new glii.Texture({
				minFilter: glii.LINEAR,
				maxFilter: glii.LINEAR,
			});
			const rasterImage = new Image();
			rasterImage.onload = () => {
				rasterTexture.texImage2D(rasterImage);
				this.fire("load");
				this._redraw();
			};

			rasterImage.src = this._src;

			const {
				vertices,
				sourceUV,
				trigs: inputTrigs,
			} = preSplitGrid(
				this._controlPoints,
				this.options.subdivisions,
				this.options.cropX,
				this.options.cropY
			);

			this._arrugator = new Arrugator(this._projector, vertices, sourceUV, inputTrigs);

			this._arrugator.lowerEpsilon(this.options.epsilon);

			let arrugado = this._arrugator.output();

			const pos = new glii.SingleAttribute({
				glslType: "vec2",
				size: arrugado.projected.length,
				growFactor: false,
			});
			const uv = new glii.SingleAttribute({
				glslType: "vec2",
				size: arrugado.uv.length,
				growFactor: false,
			});
			const trigs = (this._trigs = new glii.IndexBuffer({
				size: arrugado.trigs.length * 3,
				growFactor: false,
			}));

			const unprojectedDataBounds = L.bounds(arrugado.projected);
			this._dataBounds = L.latLngBounds([
				this._reactLeafletMap.options.crs.projection.unproject(unprojectedDataBounds.min),
				this._reactLeafletMap.options.crs.projection.unproject(unprojectedDataBounds.max),
			]);

			pos.setBytes(0, 0, Float32Array.from(arrugado.projected.flat()));
			uv.setBytes(0, 0, Float32Array.from(arrugado.uv.flat()));
			trigs.set(0, arrugado.trigs.flat());

			this._program = new glii.WebGL1Program({
				vertexShaderSource: `
void main() {
	gl_Position = vec4(
		(aPos.xy - uCenter) / vec2(uScale),
		1.0,
		1.0
	);
	vUV = aUV;
}`,
				varyings: { vUV: "vec2" },
				fragmentShaderSource: this.options.fragmentShader,
				indexBuffer: this._trigs,
				attributes: {
					aPos: pos,
					aUV: uv,
				},
				textures: {
					uRaster: rasterTexture,
				},
				uniforms: {
					uCenter: "vec2",
					uScale: "vec2",
				},
			});
		},

		_destroyContainer: function _destroyContainer() {
			delete this._glii;
			L.DomUtil.remove(this._container);
			L.DomEvent.off(this._container);
			delete this._container;
		},

		_redraw: function _redraw() {		
			if (this._container === undefined) this._myCanvas;

			var crs = this._reactLeafletMap.options.crs,
				projcenter = crs.project(this._center),
				mapPxSize = this._bounds.getSize(),
				scale = mapPxSize.divideBy(crs.scale(this._zoom) / 20037508);
			this._program.setUniform("uCenter", [projcenter.x, projcenter.y]);
			this._program.setUniform("uScale", [scale.x, scale.y]);
			this._program.run();
		},

		_update: function _update() {
			if (this._reactLeafletMap._animatingZoom && this._bounds) {
				return;
			}
			L.Renderer.prototype._update.call(this);

			this._center = this._reactLeafletMap.getCenter();
			this._zoom = this._reactLeafletMap.getZoom();

			L.Browser.retina ? 2 : 1;
				let mapPxSize = this._bounds.getSize();
			// 		    mapPxSize = this._map.getSize();

			this._container.width = /*m * */ mapPxSize.x;
			this._container.height = /*m * */ mapPxSize.y;
			console.log('container width : ' + this._container.width);
			console.log('container height : ' + this._container.height);
			L.DomUtil.setPosition(this._container, this._bounds.min);

			console.log('redraw called from update');
			this._redraw();
		},

		_reset: function () {
			this._update();
			this._updateTransform(this._center, this._zoom);
		},

		getBounds: function getBounds() {
			return this._dataBounds;
		}

	});

	L.imageOverlay.arrugator = function arrugator(url, opts) {
		return new L.ImageOverlay.Arrugator(url, opts);
	};

})();
//# sourceMappingURL=leaflet.imageoverlay.arrugator.js.map
