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
            currIdx: -1,
            isLoading: false,
            isShow: false,
            viewTimer: null,
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
                this.currIdx = 0;
                this.isLoading = false;
                this.isShow = false;

                response.data.forEach((item) => {
                    item.dcmImage = new DcmImageInfo();
                    this.images.push(item);
                });
                this.viewTimer = setInterval(this.showImage, 10);
                //this.showImage(this.currIdx);
            });
        },
        onMouseWheel(delta) {
            //console.log(delta);
            let idx = this.currIdx + delta;
            if (idx < 0 || idx >= this.images.length)
                return;

            if (!this.isShow) return;

            this.currIdx = idx;
            this.isShow = false;
            this.isLoading = false;
            this.viewTimer = setInterval(this.showImage, 10);
        },
        showImage() {
            if (this.isShow || this.isLoading 
                || this.currIdx < 0 || this.currIdx >= this.images.length) {
                return;
            }

            let tmpImage = this.images[this.currIdx];
            if (tmpImage.dcmImage.bIsLoadedImage) {
                this.dcm_image = tmpImage.dcmImage;  
                this.isShow = true; 
                clearInterval(this.viewTimer);
                this.viewTimer = null;
                return;
            }
            if (!tmpImage.dcmImage.bIsLoadedImage) {
                this.isLoading = true;
                window.axios({
                    method: 'get',
                    url: 'http://localhost:8090/image/file/' + tmpImage.id
                }).then((response) => {
                    //console.log(response);
                    //this.dcm_image = null;
                    //this.dcm_image = new DcmImageInfo();
                   tmpImage.dcmImage.setFromJson(response.data);
                   this.isLoading = false;
                })
            } 
        } 
    }
}
</script>

<style>

</style>
