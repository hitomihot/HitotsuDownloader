let zip = [];
let completezip = [];
let errorzip = [];
let all_url_stack = "";//lock
let datalockcount = 0;
const subDomainList = ["la", "aa", "ba"];
const callPerServer = 2;
const download_array = [];
const proxyurl = "http://localhost:443/";

download_array[0] = function download_html(zipnumber, passlockcount) {
    download_hitomi_html(zipnumber, passlockcount);
};

download_array[1] = function download_hitomi_js(zipnumber, passlockcount) {
    $.ajax({
        url: 'http://localhost:443/https://hitomi.la/galleries/' + zip[zipnumber].filenumber + '.js',
        //async:false,
        success: function () {
            $.each(galleryinfo, function (i, image) {
                zip[zipnumber].pushimageurl(url_from_url(zip[zipnumber].filenumber + "/" + image.name, i));
                zip[zipnumber].pushimagename(image.name);
            });
            returnlock(passlockcount).then(isworking(), thenerror());

        },
        error: function () {
            zip[zipnumber].imageurl = ["error"];
            zip[zipnumber].imagename = ["error"];
            returnlock(passlockcount).then(isworking(), thenerror());
        }
    });
};

class zipmember {
    constructor() {
        this.originurl = "";//for save original url
        this.imageurl = [];//for download
        this.jszip = new JSZip();
        this.threadcount = 0;
        this.requestlimit = 0;
        this.mainurl = "";
        this.mainid = "";
        this.filename = "";
    }

    get originurl() {
        return this._originurl;
    }

    get imageurl() {
        return this._imageurl;
    }

    get jszip() {
        return this._jszip;
    }

    get threadcount() {
        return this._threadcount;
    }

    get requestlimit() {
        return this._threadlimit;
    }

    get mainurl() {
        return this._mainurl;
    }

    get mainid() {
        return this._mainid;
    }

    get filename() {
        return this._filename;
    }

    set originurl(strin) {
        let text = strin.split("/");
        this._originurl = strin;
        this._mainurl = text[0] + "//" + text[2];

        switch (text[3]) {
            case "s"    :
                this._mainid = text[5].split("-")[0];
                break;
            case "g"   :
            case "mpv"  :
                this._mainid = text[4];
                break;
        }
    }

    set imageurl(arra) {
        if (Array.isArray(arra)) {
            this._imageurl = arra;
        }
    }

    set jszip(jszi) {
        this._jszip = jszi;
    }//need block if not JSzip

    set threadcount(intege) {
        this._threadcount = intege;
    }

    set requestlimit(intege) {
        this._threadlimit = intege;
    }

    set mainurl(strin) {
        this._mainurl = this._mainurl;
    }

    set mainid(inte) {
        this._mainid = this._mainid;
    }

    set filename(strin) {
        this._filename = strin;
    }

    set_thread(number) {
        let clas = this;
        return new Promise(function (resolve, reject) {
            if (number > 0 && clas.threadcount >= 0) {
                clas.threadcount = clas.threadcount + number;
                resolve(clas);
            }
            else {
                reject("error " + ": set_thread: " + clas.threadcount + "," + number);
            }
        });
    }

    unlock_thread() {
        let clas = this;
        clas.threadcount = clas.threadcount - 1;
        return new Promise(function (resolve, reject) {
            if (clas.threadcount >= 0) {
                resolve(clas);
            }
            else {
                reject("error " + ": unlock_thread: " + clas.threadcount + "," + number);
            }
        });
    };

    start(cla) {
        let clas = cla;
        if (clas.mainurl == "https://hitomi.la") {
            //setthreadlock(3);
            //call gallerynumber.js , all tag js
        }

        else if (clas.mainurl == "https://exhentai.org" || clas.mainurl == "https://e-hentai.org") {
            let text = clas.originurl.split("/");
            if (text[3] == "s") {
                clas.e_set_gallery_info(clas.originurl, clas).then(function (info_array) {
                    return clas.e_set_download(info_array[0], info_array[1], 100, 10, clas);
                });
            }
        }
        else {

        }
    }

    e_set_gallery_info(fromurl, clas) {
        let tempfilename = "";
        let call_buffer = "";

        return clas.e_find_gp0(fromurl).then(function (fromurl) {
            return clas.e_find_gallery_info(fromurl);
        }).then(function (filename, g_array) {
            tempfilename = filename;
            return clas.e_find_s_from_all_g(g_array, clas.e_find_s_from_g);
        }).then(function (s_array) {
            return [tempfilename, s_array];
        });
    }

    e_find_gp0(fromurl) {
        //find title,artist,group from e_hen or ex_hen
        let deferred = $.Deferred();
        let temp_text = fromurl.split("/");
        let g_url = "";
        if (temp_text[3] == "s") {
            let temp_gallery = temp_text[0] + "//" + temp_text[2] + "/g/";//galleryURL[0,1,2,3] need3
            let temp_id = temp_text.pop();
            temp_id = temp_id.split("-")[0];
            let temp_search_keyword = temp_gallery + temp_id + "/";//galleryURL[0,1,2,3,4] need2

            ajax_call(fromurl).done(function (data) {
                let temp_key = textsplit(data, temp_search_keyword, "/");
                if (temp_key != "") {
                    deferred.resolve(temp_search_keyword + temp_key + "/?p=0");//galleryURL[0,1,2,3,4,5,6] full_url
                }
                else {
                    console.log("error " + ":   e_find_gp0: " + fromurl);
                    deferred.reject("error " + ":   e_find_gp0: " + fromurl);
                }
            });
        }
        else if (temp_text[3] == "g") {
            g_url = temp_text[0] + "//" + temp_text[2] + "/" + temp_text[3] + "/" + temp_text[4] + "/" + temp_text[5] + "/?p=0";//galleryURL[0,1,2,3,4,5,6] full_url
            deferred.resolve(g_url);
        }
        else {
            console.log("error " + ":   e_find_gp0: " + fromurl);
            deferred.reject("error " + ":   e_find_gp0: " + fromurl);
        }
        return deferred.promise();
    }

    e_find_gallery_info(fromurl) {
        let deferred = $.Deferred();
        let filename = "";
        ajax_call(fromurl).done(function (data) {
            let getartist = textsplit(data, "<div id=\"td_artist:", "\"");
            if (getartist == "") {
                getartist = "N/A";
            }
            let getgroup = textsplit(data, "<div id=\"td_group:", "\"");
            if (getgroup == "") {
                getgroup = "N/A";
            }
            let galleryname = textsplit(data, "id=\"gn\">", "</h1>");
            if (galleryname == "") {
                galleryname = fromurl.split("/")[5];
            }
            else {
                var i = 0;
                while ((i = galleryname.indexOf("[")) != -1) {
                    galleryname = galleryname.substring(0, i - 1) + galleryname.substring(galleryname.indexOf("]") + 1, galleryname.length);
                }
                while ((i = galleryname.indexOf("(")) != -1) {
                    galleryname = galleryname.substring(0, i - 1) + galleryname.substring(galleryname.indexOf(")") + 1, galleryname.length);
                }
                while ((i = galleryname.indexOf("{")) != -1) {
                    galleryname = galleryname.substring(0, i - 1) + galleryname.substring(galleryname.indexOf("}") + 1, galleryname.length);
                }
                //this code maybe problem when real_title have [],{},(). cause cannot evaluate added text or original title
            }

            filename = getgroup + "_" + getartist + "_" + galleryname;
            let temp_text = fromurl.slice(0, -1);
            let g_array = [];
            if (data.indexOf(temp_text) != -1) {
                let maxpage = data.split(temp_text);
                maxpage = maxpage[maxpage.length - 2].split("\"")[0];
                for (var i = 0; i <= maxpage; i++) {
                    g_array[i] = temp_text + i;
                }
            }
            else {
                g_array[0] = fromurl;
            }

            deferred.resolve(filename, g_array);
        });
        return deferred.promise();
    }

    e_find_s_from_all_g(fromurlarray, loop_func) {
        let deferred = $.Deferred();
        let s_array = [];
        promis_map(fromurlarray, loop_func , 5)
            .then(function (retur_array) {
                let temp_arraylength = retur_array.length;
                for (let i = 0; i < temp_arraylength; i++) {
                    let temp_array2dlength = retur_array[i].length;
                    while (temp_array2dlength > 0) {
                        let temp_text = retur_array[i].splice(0, 1);
                        s_array.push(temp_text);
                        temp_array2dlength = temp_array2dlength - 1;
                    }
                }
                deferred.resolve(s_array);
            }, function () {
                console.log("error " + ":  e_find_s_from_all_g: " + fromurl);
                deferred.reject("error " + ":  e_find_s_from_all_g: " + fromurl);
            });
        return deferred.promise();
    }

    e_find_s_from_g(fromurl) {
        let deferred = $.Deferred();
        let mainurl = fromurl.split("/");
        mainurl = mainurl[0] + "//" + mainurl[2] + "/s/";
        ajax_call(fromurl).done(function (data) {
            let s_array = data.split(mainurl);
            s_array.shift();
            let s_arraylength = s_array.length;
            for (let i = 0; i < s_arraylength; i++) {
                s_array[i] = mainurl + s_array[i].split("\"")[0];
            }
            deferred.resolve(s_array);
        });
        return deferred.promise();
    }

    e_set_download(filename, s_array, sync_count1, sync_count2, clas) {
        //let deferred = $.Deferred();
        let s_arraylength = s_array.length;
        let count1_buffer = [];
        let count2_buffer = [];
        let counter1_2 = 0;
        let add_number = 0;
        let save_zip = "";
        /*
}*/
        return clas.e_find_image_from_all_s(s_array , clas.e_find_image_from_s)
            .then(function (image_array) {
                while (s_arraylength > 0) {
                    count1_buffer.push(image_array.splice(0, sync_count1));
                    s_arraylength = s_arraylength - sync_count1;
                }
            return Promise.mapSeries(count1_buffer , function(image_subarray){
                add_number = add_number+1;
                return clas.e_request_all_image(image_subarray , new JSZip() , clas.request_image , clas.e_find_image_from_s)
                    .then(function (save_zip) {
                    return clas.make_savefile(save_zip , filename + "_" + add_number);
                });
            });

        });


        //deferred.resolve();
        /*
         while (s_arraylength > 0) {
         save_zip = new JSZip();
         counter1_2 = sync_count1;
         count1_buffer = s_array.splice(0, sync_count1);
         add_number = add_number + 1;







         while(counter1_2 > 0){
         count2_buffer = count1_buffer.splice(0 , sync_count2);
         clas.e_find_image_from_all_s(count2_buffer , clas.e_find_image_from_s)
         .then(function(fromurlarray){
         counter1_2 = counter1_2 - sync_count2;
         return clas.e_request_all_image(fromurlarray , save_zip , clas.request_image , clas.e_find_image_from_s);
         }).then(function () {
         if(counter1_2 <= 0){
         return clas.make_savefile(save_zip , filename + "-" + add_number);
         s_arraylength = s_arraylength - size;
         }
         })
         }
         }
         if(s_arraylength == 0) {
         deferred.resolve();
         }
         else{
         deferred.reject();
         }

         return clas.find_image_from_info()
         .then(function (image_array, clas) {
         return clas.request_all_image(image_array , error_function);
         }).then(function (save_zip, clas) {
         return clas.make_savefile(save_zip , filename);
         }).catch(function (error) {
         console.log(error);
         });
         */
        //return deferred.promise();
    }

    e_find_image_from_all_s(fromurlarray, loop_func) {
        let deferred = $.Deferred();
        let image_array = [];
        promis_map(fromurlarray, loop_func , 5).then(function (temp_array) {
            let temp_arraylength = temp_array.length;
            for (let i = 0; i < temp_arraylength; i++) {
                image_array.push(temp_array[i]);
            }
            deferred.resolve(image_array);
        }, function (error) {
            deferred.reject("error " + error.errorCode + ": e_find_image_from_all_s: " + fromurl);
        });
        return deferred.promise();
    }

    e_find_image_from_s(fromurl) {
        let deferred = $.Deferred();
        ajax_call(fromurl).done(function (data) {
            let image_url = [];
            image_url[0] = textsplit(data, "id=\"img\"", "style");
            image_url[0] = textsplit(image_url[0], "src=\"", "\"");
            image_url[1] = textsplit(data, "return nl(\'", "\')\"");
            image_url[1] = fromurl + "?nl=" + image_url[1];
            deferred.resolve(image_url);
        })

        return deferred.promise();
    }

    e_request_all_image(fromurlarray, save_zip, loop_func, error_function) {
        return new Promise(function (resolve, reject) {
            return promis_map(fromurlarray, function(fromurl){return loop_func(fromurl , save_zip , loop_func , error_function)} , 5)
                .then(function () {resolve(save_zip);
            });
        });
    }

    request_image(fromurl, save_zip, self_func , error_function) {
        return new Promise(function (resolve, reject) {
            let xhr1 = new XMLHttpRequest();
            xhr1.onreadystatechange = function () {
                if (this.readyState == 4) {
                    if (this.status == 200 || this.status == 304) {
                        let filename = fromurl[0].split("/").pop();
                        save_zip.file(filename, this.response, {base64: true});
                        resolve("success");
                    }
                    else {
                        if (error_function != "") {
                            error_function(fromurl[1])
                                .then(function (fromurl) {
                                    return self_func(fromurl, save_zip);
                                }).then(function () {
                                resolve("success");
                            }, function () {
                                reject("error " + error.errorCode + ":  find_s_from_g: " + fromurl);
                            });
                        }
                        else {
                            return self_func(fromurl, save_zip)
                                .then(function () {
                                    resolve("success");
                                }, function () {
                                    reject("error " + error.errorCode + ":  find_s_from_g: " + fromurl);
                                });
                        }
                    }
                }
            };
            xhr1.open('GET', proxyurl + fromurl[0]);
            xhr1.responseType = 'arraybuffer';
            xhr1.send();
        });
    }

    make_savefile(save_zip, filename) {
        let clas = this;
        let content = save_zip.generateAsync({type: "blob"})
            .then(function (blob) {
                saveAs(blob, filename + ".zip")
            })
            .catch(function (error) {
                console.log(error);
            });
    }

}


$(document).ready(function () {

    $.ajaxPrefilter(function (options) {
        if (options.crossDomain && jQuery.support.cors) {
            var http = (window.location.protocol === 'http:' ? 'http:' : 'https:');
            options.url = proxyurl + options.url;
            //options.url = "http://cors.corsproxy.io/url=" + options.url;
        }
    });

    $('#getData').click(function () {
        if (zip.length <= 0) {
            //printwithTime("start------------");
            download_get($('#input_url').val());
            all_url_stack = "";
        }
        else {
            all_url_stack = all_url_stack + $('#input_url').val();
            //printwithTime("ready for add download url-----------");
        }
    });
});

function download_get(urls) {
    let inputurl = urls.split("http");
    inputurl.shift();
    let inputurllength = inputurl.length;
    for (let i = 0; i < inputurllength; i++) {
        zip[i] = new zipmember();
        zip[i].originurl = "http" + inputurl[i];
    }
    nextstart();
}

function nextstart() {
    if (zip.length > 0) {
        zip[0].start(zip[0]);
    }
    else if (all_url_stack != "") {
        download_get(all_url_stack);
    }
    else {/*end or error*/
    }
}

function printwithTime(str) {
    $('#finished_list').val(new Date().toLocaleTimeString() + ":\n " + str + "\n\n" + $('#finished_list').val());
}

function textsplit(data, sp1, sp2) {
    if (data.indexOf(sp1) != -1 && data.indexOf(sp2) != -1) {
        let text1 = data.split(sp1)[1];
        let text2 = text1.split(sp2)[0];
        return text2;
    }
    else {
        return "";
    }
}

function e_request_image_adapter(fromurl, save_zip, cla) {

}

function ajax_call(fromurl) {
    return $.ajax({url: fromurl}).fail(function (error) {
        console.log("error " + error.errorCode + ":  ajax_call: " + fromurl);
    });
}

function promis_all(loop_array, loop_func) {
    return Promise.all(loop_array.map(loop_func))
        .then(function (retur_array) {
            return new Promise(function (resolve, reject) {
                if (retur_array != "") {
                    resolve(retur_array);
                }
                else {
                    reject("error " + ":  promis_all: " + loop_array + loop_func);
                    console.log("error " + ":  promis_all: " + loop_array + loop_func);
                }
            });
        })
}

function promis_map(loop_array, loop_func, max_async) {
    return new Promise(function (resolve, reject) {
        return Promise.map(loop_array, loop_func, {concurrency: max_async})
        .then(function (retur_array) {
                if (retur_array != "") {
                    resolve(retur_array);
                }
                else {
                    reject("error " + ":  promis_map: " + loop_array + loop_func);
                    console.log("error " + ":  promis_map: " + loop_array + loop_func);
                }
            });
        });
}











