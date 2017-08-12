<template>
    <div id="app" class="container">
        <hr/>
        <button class="btn btn-primary" 
                @click="clickGetExamsInfo">
            Get Exam Info From DB
        </button>
        <hr/>
        <my-table 
            :head_names="[ 'pa_id', 'pa_name', 'pa_sex', 'ex_desc', 'ex_date', 'ex_modal', 'ex_bodypart', 'ex_images' ]"
            :row_datas="exams"
            @select_row="onSelectRow">
        </my-table>
        <hr/>
        <dcm-image-box ref="imgbox0"
            :dib_width="view_width"
            :dib_height="view_height"
            :dcm_image="dcm_image"
            @mouse_wheel="onMouseWheel">
        </dcm-image-box>
    </div>
</template>

<script>
import MyTable from './components/my-table.vue';
import DcmImageBox from './components/dcm-image-Box.vue';
import DcmImageInfo from './classes/DcmImageInfo.js';
import Exam from './classes/Exam.js'

export default {
    name: 'app',
    components: { 
        'my-table': MyTable,
        'dcm-image-box': DcmImageBox
    },
    data () {
        return {
            exams: [],
            images: [],
            currImgIdx: -1,
            isShow: false,
            viewTimer: null,
            threadCnt: 4,
            view_width: 512,
            view_height: 512,
            dcm_image: null
        }
    },
    methods: {
        clickGetExamsInfo() {
            window.axios({
                method: 'get',
                url: 'http://localhost:8090/exam'
            }).then((response) => {
                //console.log(response.data);
                this.exams = [];
                let i = 0;
                response.data.forEach((elmt) => {
                    let exam = new Exam(elmt, i++);
                    this.exams.push(exam);
                });
            });
        },
        onSelectRow(row) {
            console.log(row.ex_id);
            window.axios({
                method: 'get',
                url: 'http://localhost:8090/image/exam/' + row.ex_id
            }).then((response) => {
                this.images = [];
                this.currImgIdx = 0;
                this.isShow = false;

                let i = 0;
                response.data.forEach((item) => {
                    item.tag = i++;
                    item.dcmImage = new DcmImageInfo();
                    this.images.push(item);
                });
                this.viewTimer = setInterval(this.showImage, 10);
                //this.showImage(this.currImgIdx);
            });
        },
        onMouseWheel(delta) {   // delta: +1 or -1
            //console.log(delta);
            let idx = this.currImgIdx + delta;
            if (idx < 0 || idx >= this.images.length)
                return;

            if (!this.isShow) return;

            this.currImgIdx = idx;
            this.isShow = false;
            this.viewTimer = setInterval(this.showImage, 10);
        },
        showImage() {
            if (this.isShow 
                || this.currImgIdx < 0 
                || this.currImgIdx >= this.images.length) {
                return;
            }

            let tmpDcmImage = this.images[this.currImgIdx].dcmImage;
            if (tmpDcmImage.bIsLoadedImage) {
                this.dcm_image = tmpDcmImage;  
                this.isShow = true; 
                this.clearViewTimer();
            } else if (tmpDcmImage.threadError !== 0) {
                // the procedure for error
                console.log(tmpDcmImage);
                this.clearViewTimer();
                return;
            }

            //tmpDcmImage = null;
            let i = this.currImgIdx, j = 0;
            for (; i < this.images.length && j < this.threadCnt; ++i) {
                tmpDcmImage = this.images[i].dcmImage;
                // threadStatus === 0 ; thread is running now
                if (!tmpDcmImage.bIsLoadedImage) {
                    this.startWebWorker(this.images[i]);
                    ++j;
                }
            }
        },
        startWebWorker(imageInfo) {
            if (!imageInfo.dcmImage.threadStatus) {
                return;
            }
            
            let MyWorker = require("worker-loader!./WorkerGetImg.js");
            let worker = new MyWorker();
            worker.onmessage = (evt) => {

                worker.terminate();

                let tmpDcmImage = evt.data;
                if (tmpDcmImage.threadError === 0) { 
                    let dstDcmImage = imageInfo.dcmImage;
                    for (let prop in tmpDcmImage)
                        dstDcmImage[prop] = tmpDcmImage[prop];
                } else { // there is an error.
                    console.log(tmpDcmImage.pRGBAImg); // pRGBImg property has an error object.    
                }
                imageInfo.dcmImage.threadStatus = 1;
            }
            imageInfo.dcmImage.threadStatus = 0;
            worker.postMessage({tag: imageInfo.tag, id: imageInfo.id});
        },
        clearViewTimer() {
            clearInterval(this.viewTimer);
            this.viewTimer = null;   
        } 
    }
}
</script>

<style>

</style>
