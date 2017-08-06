//
// Vertex shader program
//
export const VSHADER_SOURCE = `
    attribute vec4 a_Position;
    uniform mat4 u_xformMatrix;
    attribute vec2 a_TexCoord;
    varying vec2 v_TexCoord;
    void main() {
        gl_Position = u_xformMatrix * a_Position;
        v_TexCoord = a_TexCoord;
    }
`;


//
// Fragment shader program
// The third version
export const FSHADER_SOURCE = `
    #ifdef GL_ES
    precision mediump float;
    #endif
    uniform vec2 u_LowUpVal;
    uniform sampler2D u_Sampler;
    varying vec2 v_TexCoord;
    vec4 getGrayColor(vec4 color) {
       float val = color.r * 256.0 + color.g * 256.0 * 256.0;
       if (val < u_LowUpVal.x) {
           return vec4(0.0, 0.0, 0.0, 1.0);
       } else if (val >= u_LowUpVal.y) {
           return vec4(1.0, 1.0, 1.0, 1.0);
       } else {
           val = ((val - u_LowUpVal.x) * 256.0 /
                       (u_LowUpVal.y - u_LowUpVal.x)) / 256.0;
    	    if (val < 0.0) { val = 0.0; }
           else if (val > 1.0) { val = 1.0; }
           return vec4(val, val, val, 1.0);
       }
    }
    void main() {
       vec4 color = texture2D(u_Sampler, v_TexCoord);
       gl_FragColor = getGrayColor(color);
    }
`;
