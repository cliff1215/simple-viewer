//
// written by TICK, 2017-07-23
//
import * as CuonUtils from './lib/cuon-utils';
import { Matrix4 } from './lib/cuon-matrix';
import { VSHADER_SOURCE, FSHADER_SOURCE } from './shader-source';

class ImageRender {
    constructor(canvas, numOfVertext = 4) {
        this.webGL = CuonUtils.getWebGLContext(canvas);
        if (!this.webGL) {
            console.log('Failed to get the rendering context for WebGL');
            return;
        }
        if (!CuonUtils.initShaders(this.webGL, VSHADER_SOURCE, FSHADER_SOURCE)) {
            console.log('Failed to intialize shaders.');
            return;
        }
        this.isLoadedTexture = false;
        this.numberOfVertex = numOfVertext;
    }

    isLoadedContext() {
        return !!this.webGL;
    }

    clear() {
        this.webGL.clearColor(0.0, 0.0, 0.0, 1.0);
    }

    // Reset the viewport of gl when the canvas width or height are changed.
    // So, reseting the coordinate (-1.0 - 1.0)
    resetViewPort(canvasWidth) {
        this.webGL.canvas.width = canvasWidth;
        this.webGL.canvas.height = canvasWidth;
        this.webGL.viewport(0, 0, this.webGL.canvas.width, this.webGL.canvas.height);
    }

    showImage(dcmImage) {
        if (!dcmImage || !dcmImage.bIsLoadedImage) {
            console.log(dcmImage);
            return;
        }
        // Set the vertex information
        // n is the number of vertex
        this.numberOfVertex = ImageRender.__initVertexBuffers(this.webGL);
        if (this.numberOfVertex < 0) {
            console.log('Failed to set the vertex information');
            return;
        }

        ImageRender.__setScaleMatrix(this.webGL, 
            dcmImage.getCurrScaleX(), dcmImage.getCurrScaleY());

        // Specify the color for clearing <canvas>
        this.webGL.clearColor(0.0, 0.0, 0.0, 1.0);

        // Set texture
        this.isLoadedTexture = ImageRender.__initTextures(this.webGL, dcmImage);
        if (!this.isLoadedTexture) {
            console.log('Failed to intialize the texture.');
            return;
        }

        ImageRender.__drawTexture(this.webGL, this.numberOfVertex);

        console.log('=====> EXEC: showImage');
    }

    update() {
        if (!this.isLoadedTexture) {
            console.log('Texture is not loaded [updateImage].');
            return;
        }
        this.webGL.clear(this.webGL.COLOR_BUFFER_BIT);
        this.webGL.drawArrays(this.webGL.TRIANGLE_STRIP, 0, this.numberOfVertex);
        // or
        // ImageRender.__drawTexture(this.webGL, this.numberOfVertex);
    }

    setTextureLowUpValue(lowupValue) {
        if (!this.isLoadedTexture) {
            console.log('Texture is not loaded [setTextureLowUpValue].');
            return;
        }

        ImageRender.__setTextureLowUpValue(this.webGL, lowupValue);
    }

    setScaleMatrix(scaleX, scaleY) {
        if (!this.isLoadedTexture) {
            console.log('WebGL or Texture is not loaded [setScaleMatrix].');
            return;
        }

        ImageRender.__setScaleMatrix(this.webGL, scaleX, scaleY);
    }

    static __setTextureLowUpValue(gl, lowupValue) {
        // Get the storage location of uniform variable
        const uLowUpVal = gl.getUniformLocation(gl.program, 'u_LowUpVal');
        if (!uLowUpVal) {
            console.log('Failed to get u_LowUpVal variable');
            return false;
        }
        gl.uniform2f(uLowUpVal, lowupValue.lower, lowupValue.upper);
        return true;
    }

    static __setScaleMatrix(gl, scaleX, scaleY) {
        const xformMatrix = new Matrix4();

        xformMatrix.setScale(scaleX, scaleY, 1.0);

        // Pass the rotation matrix to the vertex shader
        const uxformMatrix = gl.getUniformLocation(gl.program, 'u_xformMatrix');
        if (!uxformMatrix) {
            console.log('Failed to get the storage location of u_xformMatrix');
            return;
        }
        gl.uniformMatrix4fv(uxformMatrix, false, xformMatrix.elements);
    }

    static __initVertexBuffers(gl) {
        const verticesTexCoords = new Float32Array([
            // Vertex coordinates, texture coordinate
            -0.5, 0.5, 0.0, 1.0,
            -0.5, -0.5, 0.0, 0.0,
            0.5, 0.5, 1.0, 1.0,
            0.5, -0.5, 1.0, 0.0,
        ]);
        // Create the buffer object
        const vertexTexCoordBuffer = gl.createBuffer();
        if (!vertexTexCoordBuffer) {
            console.log('Failed to create the buffer object');
            return -1;
        }

        // Bind the buffer object to target
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexTexCoordBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, verticesTexCoords, gl.STATIC_DRAW);

        const FSIZE = verticesTexCoords.BYTES_PER_ELEMENT;
        // Get the storage location of a_Position, assign and enable buffer
        const aPosition = gl.getAttribLocation(gl.program, 'a_Position');
        if (aPosition < 0) {
            console.log('Failed to get the storage location of a_Position');
            return -2;
        }
        gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, FSIZE * 4, 0);
        // Enable the assignment of the buffer object
        gl.enableVertexAttribArray(aPosition);

        // Get the storage location of a_TexCoord
        const aTexCoord = gl.getAttribLocation(gl.program, 'a_TexCoord');
        if (aTexCoord < 0) {
            console.log('Failed to get the storage location of a_TexCoord');
            return -3;
        }
        // Assign the buffer object to a_TexCoord variable
        gl.vertexAttribPointer(aTexCoord, 2, gl.FLOAT, false, FSIZE * 4, FSIZE * 2);
        // Enable the assignment of the buffer object
        gl.enableVertexAttribArray(aTexCoord);

        return 4;
    }

    static __initTextures(gl, image) {
        // Create a texture object
        const texture = gl.createTexture();
        if (!texture) {
            console.log('Failed to create the texture object');
            return false;
        }
        // Get the storage location of uniform variable
        const uLowUpVal = gl.getUniformLocation(gl.program, 'u_LowUpVal');
        if (!uLowUpVal) {
            console.log('Failed to get u_LowUpVal variable');
            return false;
        }

        let lowupValue = image.getLowUpVal();
        gl.uniform2f(uLowUpVal, lowupValue.lower, lowupValue.upper);
        lowupValue = null;

        // Get the storage location of u_Sampler
        const uSampler = gl.getUniformLocation(gl.program, 'u_Sampler');
        if (!uSampler) {
            console.log('Failed to get the storage location of u_Sampler');
            return false;
        }

        ImageRender.__loadTexture(gl, texture, uSampler, image);

        return true;
    }

    static __loadTexture(gl, texture, uSampler, image) {
        // Flip the image's y axis
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
        // Enable texture unit0
        gl.activeTexture(gl.TEXTURE0);
        // Bind the texture object to the target
        gl.bindTexture(gl.TEXTURE_2D, texture);

        // Set the texture parameters
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        // Set the texture image
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, image.nWidth, image.nHeight,
            0, gl.RGBA, gl.UNSIGNED_BYTE, image.pRGBAImg);

        // Set the texture unit 0 to the sampler
        gl.uniform1i(uSampler, 0);
    }

    static __drawTexture(gl, n) {
        gl.clear(gl.COLOR_BUFFER_BIT); // Clear <canvas>
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, n); // Draw the rectangle
    }
}

export default ImageRender;
