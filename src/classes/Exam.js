
class Exam {
    constructor(data, index) {
        this.index = index;
        this.selected = false;

        this.pa_id = data.patient.id;
        this.pa_name = data.patient.name;
        this.pa_sex = data.patient.gender;
        this.ex_id = data.id;
        this.ex_date = data.studyDate;
        this.ex_modal = data.modality;
        this.ex_desc = data.description;
        this.ex_bodypart = data.bodypart;
        this.ex_images = data.imageCount;
    }
}

export default Exam;