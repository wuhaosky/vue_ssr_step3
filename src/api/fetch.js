"use strict";

import axios from "axios";

/**
 * 获取数据
 * @param baseargs --基本参数对象
 * @param cb --回调函数
 */
export function fetchAjaxData(baseargs, cb) {

    return axios({
        method: "get",
        url: "http://localhost:3000/api/getList"
    }).then(function(response) {
        if (response.status == 200) {
            // console.log(response.data);
            cb(response.data.msg)
        }
    }).catch(function (error) {
        console.log(error);
    });
}
