<template>
    <div id="dcm_image_box" :width="dib_width" :height="dib_height">
        <canvas ref="webgl" 
            :width="dib_width" 
            :height="dib_height">
        </canvas>
        <div id="window-level">
            <p>{{ showWinLev }}</p>
        </div>
    </div>
</template>

<script>
    import ImageRender from '../classes/ImageRender';

    export default {
        props: {
            dib_width: { type: Number, default: 256 }, 
            dib_height: { type: Number, default: 256 },
            dcm_image: { type: Object, default: null }
        },
        data() {
            return {
                imageRender: null,
                mouseInfo: {
                    bIsDrag: false,
                    nCurrX: -1,
                    nCurrY: -1
                }
            }
        },
        mounted() {
            let canvas = this.$refs["webgl"];
            this.imageRender = new ImageRender(canvas);
            if (!this.imageRender.isLoadedContext()) {
                console.log('Failed to get the rendering context for WebGL');  
                return;
            }
            this.imageRender.clear();

            canvas.onmousedown = this.handleMouseDown;
            canvas.onmousemove = this.handleMouseMove;
            canvas.onmouseup   = this.handleMouseUp;
            canvas.onwheel     = this.handleMouseWheel;
        },
        computed: {
            showWinLev: function() {
                return this.dcm_image 
                        ? (this.dcm_image.nWinWidth + "/" + this.dcm_image.nWinCenter)
                        : "";
            }
        },
        watch: {
            dcm_image: function() {
                this.imageRender.showImage(this.dcm_image);
                //this.dcm_image.pRGBAImg = null;
            },
            dib_width: function() {
                if (this.imageRender) {
                    this.imageRender.resetViewPort(this.dib_width);
                }
            }
        },
        methods: {
            handleMouseDown(evt) {
                this.mouseInfo.bIsDrag = true;
                this.mouseInfo.nCurrX = evt.clientX;
                this.mouseInfo.nCurrY = evt.clientY;
            },
            handleMouseMove(evt) {
                if (!this.mouseInfo.bIsDrag 
                        || !this.dcm_image 
                        || !this.dcm_image.bIsLoadedImage) {
                    return;
                }
                // if (mouseToolNo == 1) {
                //     if (m_nCurrY - evt.clientY > 0)
                //         g_imgInfo.changeZoomRatio(0.02);
                //     else
                //         g_imgInfo.changeZoomRatio(-0.02);

                //     imageRender.setScaleMatrix(
                //          this.dcm_image.getCurrScaleX(), 
                //          this.dcm_image.getCurrScaleY());
                // }
                // else {
                    let factor = 4;

                    this.dcm_image.changeWinWidth(
                        (evt.clientX - this.mouseInfo.nCurrX) * factor);
                    this.dcm_image.changeWinCenter(
                        (this.mouseInfo.nCurrY - evt.clientY) * factor);

                    //this.setTextureLowUpValue(this.webGL, this.dcm_image.getLowUpVal());
                    this.imageRender.setTextureLowUpValue(this.dcm_image.getLowUpVal());
                // }

                this.mouseInfo.nCurrX = evt.clientX;
                this.mouseInfo.nCurrY = evt.clientY;

                this.imageRender.update();
            },
            handleMouseUp(evt) {
                if(this.mouseInfo.bIsDrag) {
                    this.mouseInfo.bIsDrag = false;
                    this.mouseInfo.nCurrX = 0;
                    this.mouseInfo.snCurrY = 0;
                }
            },
            handleMouseWheel(evt) {
                let delta = Math.max(-1, Math.min(1, (evt.wheelDelta || -evt.detail)));
                this.$emit('mouse_wheel', delta);
            }
        }
    }  
</script>

<style>
    #dcm_image_box {
        position: relative;
    }
    #window-level {
        position: absolute;
        font-family: Arial;
        color: orange;
        font-weight: bold;
        left:5px;
        top: 5px;
    }
</style>
