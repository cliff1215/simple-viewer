<template>
    <div id="app" class="wrapper">
        <div class="worklist">
            <hr/>
            <button class="btn btn-primary" 
                    @click="clickGetExamsInfo">
                Get Exam Info From DB
            </button>
            <hr/>
            <my-table 
                :head_names="tableHead"
                :row_datas="exams"
                @select_row="onSelectRow">
            </my-table>
            <hr/>
        </div>
        <div id="imgbox" class="image-view" ref="imgbox">
            <dcm-image-box ref="imgbox0"
                :dib_width="view_width"
                :dib_height="view_height"
                :dcm_image="dcm_image"
                @mouse_wheel="onMouseWheel">
            </dcm-image-box>
        </div>
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
            //[ 'pa_id', 'pa_name', 'pa_sex', 'ex_desc', 'ex_date', 'ex_modal', 'ex_bodypart', 'ex_images' ]
            tableHead: [
                { title: 'ID', prop: 'pa_id' }, { title: 'Name', prop: 'pa_name' },
                { title: 'Sex', prop: 'pa_sex' }, { title: 'Exam Name', prop: 'ex_desc' },
                { title: 'Exam Date', prop: 'ex_date' }, { title: 'Modal', prop: 'ex_modal' },
                { title: 'Bodypart', prop: 'ex_bodypart' }, { title: 'Images', prop: 'ex_images' }
            ],
            exams: [],
            images: [],
            currImgIdx: -1,
            isShow: false,
            viewTimer: null,
            timeInterval: 10,
            threadCnt: 4,
            view_width: 512,
            view_height: 512,
            dcm_image: null
        }
    },
    mounted() {
        // console.log(this.$refs["imgbox"].offsetWidth);
        this.view_width = this.$refs["imgbox"].offsetWidth - 20;
        this.view_height = this.view_width;
    },
    methods: {
        clickGetExamsInfo() {
            window.axios({
                method: 'get',
                //url: 'http://localhost:8090/exam'
                url: 'http://localhost:3000/api/exam'
            }).then((response) => {
                //console.log(response.data);
                this.exams = [];
                let i = 0;
                response.data.forEach((elmt) => {
                    let exam = new Exam(elmt, i++);
                    this.exams.push(exam);
                });
            });
            // fetch('http://localhost:3000/api/exam')
            //     .then((response) => response.json())
            //     .then((data) => {
            //         //console.log(data);
            //         this.exams = [];
            //         let i = 0;
            //         data.forEach((elmt) => {
            //             let exam = new Exam(elmt, i++);
            //             this.exams.push(exam);
            //         });
            //     });
        },
        onSelectRow(row) {
            console.log(row.ex_id);
            window.axios({
                method: 'get',
                //url: 'http://localhost:8090/image/exam/' + row.ex_id
                url: 'http://localhost:3000/api/image/exam/' + row.ex_id
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
                this.viewTimer = setInterval(this.showImage, this.timeInterval);
                //this.showImage(this.currImgIdx);
            });
            // fetch('http://localhost:3000/api/image/exam/' + row.ex_id)
            // .then((res) => res.json())
            // .then((data) => {
            //     this.images = [];
            //     this.currImgIdx = 0;
            //     this.isShow = false;

            //     let i = 0;
            //     data.forEach((item) => {
            //         item.tag = i++;
            //         item.dcmImage = new DcmImageInfo();
            //         this.images.push(item);
            //     });
            //     this.viewTimer = setInterval(this.showImage, this.timeInterval);
            //     //this.showImage(this.currImgIdx);
            // });
        },
        onMouseWheel(delta) {   // delta: +1 or -1
            //console.log(delta);
            let idx = this.currImgIdx + delta;
            if (idx < 0 || idx >= this.images.length)
                return;

            if (!this.isShow) return;

            this.currImgIdx = idx;
            this.isShow = false;
            this.viewTimer = setInterval(this.showImage, this.timeInterval);
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
.wrapper {
    margin-top: 1em;
    display: grid;
    grid-template-columns: 0.9fr 1.1fr;
}
.worklist {
    margin-left: 1em;
    margin-right: 1em;
}
/* #app {
    width: 100%;
}
#imgbox {
    margin-top: 4em;
} */
</style>
