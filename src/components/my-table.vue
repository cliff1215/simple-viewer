<template>
    <table class="table table-striped">
        <thead>
            <tr>
                <th v-for="name in head_names" :key="name"> 
                    {{ name }}
                </th>
            </tr>
        </thead>
        <tbody>
            <tr v-for="(row, index) in row_datas" 
                :class="{'info': row.selected }"
                :key="index"
                @click="clickImageTableRow(row)">
                <td v-for="name in head_names" :key="name"> 
                    {{ row[name] }}
                </td>
            </tr>
        </tbody>
    </table>
</template>

<script>
    export default {
        props: ['head_names', 'row_datas'],
        methods: {
            resetSelectedRow(row) {
                this.row_datas.forEach((element) => {
                    if (element === row)
                        element.selected = !element.selected;
                    else if (element.selected)
                        element.selected = false;   
                });
            },
            clickImageTableRow(row) {
                this.resetSelectedRow(row);
                if (row.selected) {
                    this.$emit('select_row', row);
                }
            } 
        }
    }
</script>

<style>

</style>
