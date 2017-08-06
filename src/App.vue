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
            :dcm_image="dcm_image">
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
            console.log(row);
            // window.axios({
            //     method: 'get',
            //     url: 'http://localhost:8090/image/file/' + row.id
            // }).then((response) => {
            //     //console.log(response);
            //     this.dcm_image = null;
            //     this.dcm_image = new DcmImageInfo();
            //     this.dcm_image.setFromJson(response.data);
            // })
        }
    }
}
</script>

<style>

</style>
