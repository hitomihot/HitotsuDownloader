//ver 0.1

let zip = [];
let completezip = [];
let errorzip = [];
let db = 0;


const subDomainList = ["la", "ba", "aa"];//la,aa,ba
const proxyurl = "http://localhost:8080/"; //

class zipmember {
    constructor() {
        this.originurl = "";//for save original url
        this.jszip = new JSZip();
        this.mainurl = "";
    }

    get originurl() {
        return this._originurl;
    }

    get jszip() {
        return this._jszip;
    }

    get requestlimit() {
        return this._threadlimit;
    }

    get mainurl() {
        return this._mainurl;
    }

    set originurl(strin) {
        let text = strin.split("/");
        this._originurl = strin;
        this._mainurl = text[0] + "//" + text[2];
    }

    set jszip(jszi) {
        this._jszip = jszi;
    }//need block if not JSzip

    set requestlimit(intege) {
        this._threadlimit = intege;
    }

    set mainurl(strin) {
        this._mainurl = this._mainurl;
    }

    start() {
        let clas = this;
        if (clas.mainurl == "https://hitomi.la") {
            let s = clas.h_set_gallery_info(clas.originurl, clas).then(function (info_array) {
                return clas.h_set_download(info_array[0], info_array[1], 100, clas);//filename , imagearray
            }).then(function () {
                zip[0].jszip = "";
                completezip.push(zip.shift());
                nextstart();
                return null;
            }).catch(function () {
                zip[0].jszip = "";
                errorzip.push(zip.shift());
                nextstart();
            });
        }

        else if (clas.mainurl == "https://exhentai.org" || clas.mainurl == "https://e-hentai.org") {
            let text = clas.originurl.split("/");
            let s = clas.e_set_gallery_info(clas.originurl, clas).then(function (info_array) {
                return clas.e_set_download(info_array[0], info_array[1], 100, clas);//filename , imagearray
            }).then(function () {
                zip[0].jszip = "";
                completezip.push(zip.shift());
                nextstart();
                return null;
            }).catch(function () {
                zip[0].jszip = "";
                errorzip.push(zip.shift());
                nextstart();
            });
        }
    }

    h_set_gallery_info(fromurl, clas) {
        return new Promise(function (resolve, reject) {
            let tempfilename = "";
            clas.h_find_gallery_info(fromurl)
                .then(function (temp_array) {
                    tempfilename = temp_array[0];
                    return clas.h_get_gallery_js(temp_array[1], temp_array[2]);//galleryid, fromurl
                }).then(function (image_array) {
                resolve([tempfilename, image_array]);
            }).catch(function (error) {
                console.log(error + ":  h_set_gallery_info: " + fromurl + "\n\n" + clas);
                reject(error + ":  h_set_gallery_info: " + fromurl + "\n\n" + clas);
            });
        });
    }

    h_find_gallery_info(fromurl) {
        return new Promise(function (resolve, reject) {
            let tempid = fromurl.split(".html")[0].split("/")[4];
            let tempname = "";
            let temp_title = "";
            let temp_artist = "";
            let temp_group = "";

            ajax_call("https://hitomi.la/galleries/" + tempid + ".html")
                .then(function (data) {
                    let text1 = textsplit(data, "-gallery", "date");

                    temp_title = textsplit(text1, "h1>", "</h1");
                    temp_title = textsplit(temp_title, ".html\">", "</a");
                    if (temp_title == "") {
                        temp_title = tempid;
                    }

                    temp_artist = textsplit(text1, "h2>", "</h2");
                    temp_artist = textsplit(temp_artist, ".html\">", "</a");
                    if (temp_artist == "") {
                        temp_artist = "N/A";
                    }


                    temp_group = textsplit(text1, "td>Group</td", "</td");
                    temp_group = textsplit(temp_group, ".html\">", "</a");
                    if (temp_group == "") {
                        temp_group = "N/A";
                    }
                    tempname = temp_group + "_" + temp_artist + "_" + temp_title;
                    resolve([tempname, tempid, "https://hitomi.la/galleries/" + tempid + ".js"]);
                }, function () {
                    tempname = "N/A_N/A_" + tempid;
                    resolve([tempname, tempid, "https://hitomi.la/galleries/" + tempid + ".js"]);
                }).catch(function () {
                console.log("error " + ":    h_find_gallery_info: " + fromurl);
                reject("error " + ":    h_find_gallery_info: " + fromurl);
            });
        });
    }

		h_get_gallery_js(galleryid, fromurl) {
			return new Promise(function (resolve, reject) {
				let temp_array = [];
				let subDomainListlength = subDomainList.length;
				ajax_call(fromurl).then(function (data) {
					let temp_array2 = data.split("name\"\:\"");
					temp_array2.shift();
					let temp_array2length = temp_array2.length;
					let temp_3 = [];
					for(var i = 0 ; i < temp_array2length; i++){
						temp_3 = temp_array2[i].split("\"");
						temp_array[i] = [];
						temp_array[i][0] = "https://" + subDomainList[i % subDomainListlength] + ".hitomi.la/galleries/" + galleryid + "/";
						temp_array[i][0] = temp_array[i][0] + temp_3[0];
						temp_array[i][1] = temp_array[i][0];
					}
					resolve(temp_array);
				}).catch(function (error) {
					console.log(error + ":  h_get_gallery_json: " + galleryid + "\n\n" + fromurl);
					reject(error + ":  h_get_gallery_json: " + galleryid + "\n\n" + fromurl);
				});
			});
		}

    h_set_download(filename, image_array, sync_count1, clas) {
        return new Promise(function (resolve, reject) {
            let image_arraylength = image_array.length;
            let temp_buffer = [];//per 100 image url
            let add_number = 0;//zip name + per 100 image split
            while (image_arraylength > 0) {
                temp_buffer.push(image_array.splice(0, sync_count1));
                image_arraylength = image_arraylength - sync_count1;
            }

            return Promise.mapSeries(temp_buffer, function (image_subarray) {
                add_number = add_number + 1;
                return clas.h_request_all_image(image_subarray, new JSZip(), clas.request_image, "")
                    .then(function (save_zip) {
                        if (temp_buffer.length == 1) {
                            return clas.make_savefile(save_zip, filename);
                        }
                        else {
                            return clas.make_savefile(save_zip, filename + "_" + add_number);
                        }
                        add_number = add_number + 1;
                    });
            }).then(function () {
                resolve("success");
            }).catch(function () {
                console.log("error " + ":  h_set_download: " + filename + "\n\n" + "\n\n" + sync_count1 + "\n\n" + clas);
                reject("error " + ":  h_set_download: " + filename + "\n\n" + "\n\n" + sync_count1 + "\n\n" + clas);
            });
        });
    }

    h_request_all_image(fromurlarray, save_zip, loop_func, error_function) {
        let progress = [];
        let fromurlarraylength = fromurlarray.length;
        for (var i = 0; i < fromurlarraylength; i++) {
            progress[i] = fromurlarray[i][0].split("/").pop();
        }
        return new Promise(function (resolve, reject) {
            return promis_map(fromurlarray, function (fromurl) {
                return loop_func(fromurl, save_zip, loop_func, error_function).then(function () {
                    progress.splice(progress.indexOf(fromurl[0].split("/").pop()), 1, "");
                    changewithTime("remain" + progress , '#loading_list');
                });
            }, 5).then(function () {
                resolve(save_zip);
            }).catch(function () {
                console.log("error " + ":  h_request_all_image: " + fromurlarray + "\n\n" + save_zip + "\n\n" + loop_func + "\n\n" + error_function);
                reject("error " + ":  h_request_all_image: " + fromurlarray + "\n\n" + save_zip + "\n\n" + loop_func + "\n\n" + error_function);
            });
        });
    }

    e_set_gallery_info(fromurl, clas) {
        return new Promise(function (resolve, reject) {
            let tempfilename = "";
            return clas.e_find_gp0(fromurl).then(function (fromurl) {
                return clas.e_find_gallery_info(fromurl);
            }).then(function (temp_array) {
                tempfilename = temp_array[0];//filename , gallery_array
                return clas.e_find_s_from_all_g(temp_array[1], clas.e_find_s_from_g);
            }).then(function (s_array) {
                resolve([tempfilename, s_array]);
            }).catch(function (error) {
                console.log(error + ":  e_set_download: " + fromurl + "\n\n" + clas);
                reject(error + ":  e_set_download: " + fromurl + "\n\n" + clas);
            });
        });
    }

    e_find_gp0(fromurl) {
        //find title,artist,group from e_hen or ex_hen
        return new Promise(function (resolve, reject) {
            let temp_text = fromurl.split("/");
            let g_url = "";
            if (temp_text[3] == "s") {
                let temp_gallery = temp_text[0] + "//" + temp_text[2] + "/g/";//galleryURL[0,1,2,3] need3
                let temp_id = temp_text.pop();
                temp_id = temp_id.split("-")[0];
                let temp_search_keyword = temp_gallery + temp_id + "/";//galleryURL[0,1,2,3,4] need2

                return ajax_call(fromurl).then(function (data) {
                    let temp_key = textsplit(data, temp_search_keyword, "/");
                    if (temp_key != "") {
                        resolve(temp_search_keyword + temp_key + "/?p=0");//galleryURL[0,1,2,3,4,5,6] full_url
                    }
                    else {
                        console.log("error " + ":   e_find_gp0: " + fromurl);
                        reject("error " + ":   e_find_gp0: " + fromurl);
                    }
                }).catch(function (event) {
                    console.log("error " + ":  e_find_gp0: " + fromurl);
                    reject("error " + ":  e_find_gp0: " + fromurl);
                });
            }
            else if (temp_text[3] == "g") {
                g_url = temp_text[0] + "//" + temp_text[2] + "/" + temp_text[3] + "/" + temp_text[4] + "/" + temp_text[5] + "/?p=0";//galleryURL[0,1,2,3,4,5,6] full_url
                resolve(g_url);
            }
            else {
                console.log("error " + ":   e_find_gp0: " + fromurl);
                reject("error " + ":   e_find_gp0: " + fromurl);
            }
        });
    }

    e_find_gallery_info(fromurl) {
        return new Promise(function (resolve, reject) {
            let filename = "";
            return ajax_call(fromurl).then(function (data) {
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
                        galleryname = galleryname.substring(0, i) + galleryname.substring(galleryname.indexOf("]") + 1, galleryname.length);
                    }
                    while ((i = galleryname.indexOf("(")) != -1) {
                        galleryname = galleryname.substring(0, i) + galleryname.substring(galleryname.indexOf(")") + 1, galleryname.length);
                    }
                    while ((i = galleryname.indexOf("{")) != -1) {
                        galleryname = galleryname.substring(0, i) + galleryname.substring(galleryname.indexOf("}") + 1, galleryname.length);
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

                resolve([filename, g_array]);
            }).catch(function (error) {
                console.log(error + ":  e_find_gallery_info: " + fromurl);
                reject(error + ":  e_find_gallery_info: " + fromurl);
            });
        });
    }

    e_find_s_from_all_g(fromurlarray, loop_func) {
        return new Promise(function (resolve, reject) {
            let s_array = [];
            return promis_map(fromurlarray, loop_func, 5)
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
                    resolve(s_array);
                }).catch(function (event) {
                    console.log("error " + ":  e_find_s_from_all_g: " + fromurlarray + "\n\n" + loop_func);
                    reject("error " + ":  e_find_s_from_all_g: " + fromurlarray + "\n\n" + loop_func);
                });
        });
    }

    e_find_s_from_g(fromurl) {
        return new Promise(function (resolve, reject) {
            let mainurl = fromurl.split("/");
            mainurl = mainurl[0] + "//" + mainurl[2] + "/s/";
            return ajax_call(fromurl).then(function (data) {
                let s_array = textsplit(data, "id=\"gdt\">", "class=\"c\">");
                s_array = s_array.split(mainurl);
                s_array.shift();
                let s_arraylength = s_array.length;
                for (let i = 0; i < s_arraylength; i++) {
                    s_array[i] = mainurl + s_array[i].split("\"")[0];
                }
                resolve(s_array);
            }).catch(function (event) {
                console.log("error " + ": e_find_s_from_g: " + fromurl);
                reject("error " + ":  e_find_s_from_g: " + fromurl);
            });
        });
    }

    e_set_download(filename, s_array, sync_count1, clas) {
        return new Promise(function (resolve, reject) {
            let s_arraylength = s_array.length;
            let temp_buffer = [];
            let add_number = 0;
            while (s_arraylength > 0) {
                temp_buffer.push(s_array.splice(0, sync_count1));
                s_arraylength = s_arraylength - sync_count1;
            }

            return Promise.mapSeries(temp_buffer, function (s_subarray) {
                return clas.e_find_image_from_all_s(s_subarray, clas.e_find_image_from_s)
                    .then(function (image_array) {
                        add_number = add_number + 1;
                        return clas.e_request_all_image(image_array, new JSZip(), clas.request_image, clas.e_find_image_from_s)
                            .then(function (save_zip) {
                                if (temp_buffer.length == 1) {
                                    return clas.make_savefile(save_zip, filename);
                                }
                                else {
                                    return clas.make_savefile(save_zip, filename + "_" + add_number);
                                }
                            });
                    });
            }).then(function () {
                resolve("success");
            }).catch(function () {
                console.log("error " + ":  e_set_download: " + filename + "\n\n" + s_array + "\n\n" + sync_count1 + "\n\n" + clas);
                reject("error " + ":  e_set_download: " + filename + "\n\n" + s_array + "\n\n" + sync_count1 + "\n\n" + clas);
            });
        });
    }

    e_find_image_from_all_s(fromurlarray, loop_func) {
        return new Promise(function (resolve, reject) {
            let image_array = [];
            return promis_map(fromurlarray, loop_func, 100).then(function (temp_array) {
                let temp_arraylength = temp_array.length;
                for (let i = 0; i < temp_arraylength; i++) {
                    image_array.push(temp_array[i]);
                }
                resolve(image_array);
            }).catch(function (event) {
                console.log("error " + ": e_find_image_from_all_s: " + fromurlarray + "\n\n" + loop_func);
                reject("error " + ": e_find_image_from_all_s: " + fromurlarray + "\n\n" + loop_func);
            });
        });
    }

    e_find_image_from_s(fromurl) {
        return new Promise(function (resolve, reject) {
            return ajax_call(fromurl).then(function (data) {
                let image_url = [];
                image_url[0] = textsplit(data, "id=\"img\"", "style");
                image_url[0] = textsplit(image_url[0], "src=\"", "\"");
                image_url[1] = textsplit(data, "return nl(\'", "\')\"");
                image_url[1] = fromurl + "?nl=" + image_url[1];
                resolve(image_url);//main,suburl
            }).catch(function (event) {
                console.log("error " + ":  e_find_image_from_s: " + fromurl);
                reject("error " + ":  e_find_image_from_s: " + fromurl);
            });
        });
    }

    e_request_all_image(fromurlarray, save_zip, loop_func, error_function) {
        let progress = [];
        let fromurlarraylength = fromurlarray.length;
        for (var i = 0; i < fromurlarraylength; i++) {
            progress[i] = fromurlarray[i][0].split("/").pop();
        }
        return new Promise(function (resolve, reject) {
            return promis_map(fromurlarray, function (fromurl) {
                return loop_func(fromurl, save_zip, loop_func, error_function).then(function () {
                    progress.splice(progress.indexOf(fromurl[0].split("/").pop()), 1, "");
                    changewithTime("remain: " + progress , '#loading_list');
                });
            }, 5)
                .then(function () {
                    resolve(save_zip);
                }).catch(function () {
                    console.log("error " + ":  e_request_all_image: " + fromurlarray + "\n\n" + save_zip + "\n\n" + loop_func + "\n\n" + error_function);
                    reject("error " + ":  e_request_all_image: " + fromurlarray + "\n\n" + save_zip + "\n\n" + loop_func + "\n\n" + error_function);
                });
        });
    }

    request_image(fromurl, save_zip, self_func, error_function) {
        /*
         let filename = fromurl[0].split("/").pop();
         console.log("\n"+"try download: "+filename);
         return new Promise(function (resolve, reject) {
         var ret = GM_xmlhttpRequest({
         method: "GET",
         url: proxyurl + fromurl[0],
         ignoreCache: true,
         responseType: 'arraybuffer',
         redirectionLimit: 0, // this is equivalent to 'failOnRedirect: true'
         onload:function(){
         //let filename = fromurl[0].split("/").pop();
         //console.log("\n"+"finishdownload: "+filename);
         save_zip.file(filename, this.response, {base64: true});
         resolve("success");
         },
         onreadystatechange: function () {
         if (this.readyState == 4) {
         if (this.status == 200 || this.status == 304) {}
         else {
         if ((error_function != undefined) && (error_function != "")) {//need check really effective error care function?
         error_function(fromurl[1])
         .then(function (fromurl) {
         return self_func(fromurl, save_zip);
         }).then(function () {
         resolve("success");
         }).catch(function () {
         console.log("error " + ":  request_image: in " + error_function + "\n\n" + self_func + "\n\n" + fromurl + "\n\n" + save_zip);
         reject("error " + ":  request_image: in " + error_function + "\n\n" + self_func + "\n\n" + fromurl + "\n\n" + save_zip);
         });
         }
         else {
         return self_func(fromurl, save_zip)
         .then(function () {
         resolve("success");
         }).catch(function () {
         console.log("error " + ":  request_image: in " + self_func + "\n\n" + fromurl + "\n\n" + save_zip);
         reject("error " + ":  request_image: in " + self_func + "\n\n" + fromurl + "\n\n" + save_zip);
         });
         }
         }
         }
         }
         });
         });
         */

        return new Promise(function (resolve, reject) {
            let filename = fromurl[0].split("/").pop();
            console.log("\n" + "try download: " + filename);
            let xhr1 = new XMLHttpRequest();
            xhr1.onload = function () {
                //let filename = fromurl[0].split("/").pop();
                //console.log("\n"+"finishdownload: "+filename);
                save_zip.file(filename, this.response, {base64: true});
                resolve("success");
            };
            xhr1.onreadystatechange = function () {
                if (this.readyState == 4) {
                    if (this.status == 200 || this.status == 304) {
                        let filename = fromurl[0].split("/").pop();
                        //printwithoutTime("finishdownload: "+filename , ???);
                        save_zip.file(filename, this.response, {base64: true});
                        resolve("success");
                    }
                    else {
                        if ((error_function != undefined) && (error_function != "")) {//need check really effective error care function?
                            error_function(fromurl[1])
                                .then(function (fromurl) {
                                    return self_func(fromurl, save_zip);
                                }).then(function () {
                                resolve("success");
                            }).catch(function () {
                                console.log("error " + ":  request_image: in " + error_function + "\n\n" + self_func + "\n\n" + fromurl + "\n\n" + save_zip);
                                reject("error " + ":  request_image: in " + error_function + "\n\n" + self_func + "\n\n" + fromurl + "\n\n" + save_zip);
                            });
                        }
                        else {
                            return self_func(fromurl, save_zip)
                                .then(function () {
                                    resolve("success");
                                }).catch(function () {
                                    console.log("error " + ":  request_image: in " + self_func + "\n\n" + fromurl + "\n\n" + save_zip);
                                    reject("error " + ":  request_image: in " + self_func + "\n\n" + fromurl + "\n\n" + save_zip);
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
        return new Promise(function (resolve, reject) {
            let content = save_zip.generateAsync({type: "blob"})
                .then(function (blob) {
                    saveAs(blob, filename + ".zip");
                    printwithTime("finish download " + filename + ".zip" , '#finished_list');
                    resolve("success");
                })
                .catch(function () {
                    console.log("error " + ":  make_savefile: " + save_zip + "\n\n" + filename);
                    reject("error " + ":  make_savefile: " + save_zip + "\n\n" + filename);
                });
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
            printwithTime("start------------" , '#finished_list');
            download_get($('#input_url').val());
            all_url_stack = "";
        }
        else {
            all_url_stack = all_url_stack + $('#input_url').val();
            printwithTime("add download url-----------" , '#finished_list');
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
        printwithoutTime("\n"+zip[i].originurl + "\n" , '#finished_list');
    }
    printwithoutTime("backup url list:" , '#finished_list');
    nextstart();
}

function nextstart() {
    if (zip.length > 0) {
        zip[0].start(zip[0]);
        printwithTime("start download from:" + zip[0].originurl , '#finished_list');
    }
    else if (all_url_stack != "") {
        download_get(all_url_stack);
    }
    else {/*end or error*/
    }
}

function printwithTime(str , where) {
    $(where).val(new Date().toLocaleTimeString() + ":\n " + str + "\n\n" + $(where).val());
}
function printwithoutTime(str , where) {
    $(where).val(str + "\n" + $(where).val());
}

function changewithTime(str , where){
    $(where).val(new Date().toLocaleTimeString() + ":\n " + str + "\n");
}

function changewithoutTime(str , where){
    $(where).val(str + "\n");
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

	function ajax_call(fromurl , fromurltype) {
		return new Promise(function (resolve, reject) {
			$.ajax({
				url: fromurl,
				mimeType:'text/plain',
				error: function(xhr, status, error) {
					var err = eval("(" + xhr.responseText + ")");
					reject("error " + err.Message +":  ajax_call: " + fromurl);
				}}).retry({times: 3})
				.done(function (data) {
				resolve(data);
			});
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
                    console.log("error " + ":  promis_all: " + loop_array + "\n\n" + loop_func);
                    reject("error " + ":  promis_all: " + loop_array + "\n\n" + loop_func);
                }
            });
        }).catch(function (event) {
            console.log("error " + ":  promis_all: " + loop_array + "\n\n" + loop_func);
            reject("error " + ":  promis_all: " + loop_array + "\n\n" + loop_func);
        });
}

function promis_map(loop_array, loop_func, max_async) {
    return new Promise(function (resolve, reject) {
        return Promise.map(loop_array, loop_func, {concurrency: max_async})
            .then(function (retur_array) {
                if (retur_array != "") {
                    resolve(retur_array);
                }
                else {
                    console.log("error " + ":  promis_map: " + loop_array + "\n\n" + loop_func + "\n\n" + max_async);
                    reject("error " + ":  promis_map: " + loop_array + "\n\n" + loop_func + "\n\n" + max_async);
                }
            }).catch(function () {
                console.log("error " + ":  promis_map: " + loop_array + "\n\n" + loop_func + "\n\n" + max_async);
                reject("error " + ":  promis_map: " + loop_array + "\n\n" + loop_func + "\n\n" + max_async);
            });
    });
}











