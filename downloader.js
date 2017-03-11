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

    start() {
        if (this.mainurl == "https://hitomi.la") {
            //setthreadlock(3);
            //call gallerynumber.js , all tag js
        }

        else if (this.mainurl == "https://exhentai.org" || this.mainurl == "https://e-hentai.org") {
            let text = this.originurl.split("/");
                this.e_find_gp0(this.originurl)//request g from s
                    .then(function (g_url, clas) {
                        return clas.get_data_from_g(g_url);//then count max g and get gallery's data.
                    }).then(function (g_array, clas) {
                    return clas.find_s_from_all_g(g_array);
                    }).then(function (s_array, clas) {
                        let temp_array = [];
                        let s_arraylength = s_array.length;
                        let size = 100;
                        let foloop = 0;
                        while (s_arraylength > 0) {
                            return clas.find_image_from_all_s(s_array.splice(0, size - 1), clas)
                                .then(function (image_array, clas) {
                                    return clas.request_all_image(image_array);
                                }).then(function (save_zip, clas) {
                                    return clas.make_savefile(save_zip);
                                }).catch(function (error) {
                                    console.log(error);
                                });
                            s_arraylength = s_arraylength - size;
                        }
                    //return Promise.resolve();
                    }).catch(function (error) {
                    console.log(error);
                });
            
        }
        else {

        }
    }

    e_find_gp0(fromurl) {
        //find title,artist,group from e_hen or ex_hen
        let clas = this;
        let deferred = $.Deferred();
        let temp_text = fromurl.split("/");
        let g_url = "";
        if (temp_text[3] == "s") {
            let temp_gallery = temp_text[0] +"//"+ temp_text[2] + "/g/";//galleryURL[0,1,2,3] need3
            let temp_id = temp_text.pop();
            temp_id = temp_id.split("-")[0];
            let temp_search_keyword = temp_gallery + temp_id + "/";//galleryURL[0,1,2,3,4] need2

            let ajaxcall = $.ajax({url: fromurl});
            ajaxcall.done(function (data) {
                let temp_key = textsplit(data , temp_search_keyword , "/");
                if(temp_key != ""){
                    deferred.resolve(temp_search_keyword + temp_key + "/" , clas);//galleryURL[0,1,2,3,4,5] need1
                }
                else{
                    deferred.reject("error " + error.errorCode + ": e_find_g_from_s: " + fromurl);
                }
            }).fail(function (error) {
                deferred.reject("error " + error.errorCode + ": e_find_g_from_s: " + fromurl);
            });
        }
        else if(temp_text[3] == "g"){
            g_url = temp_text[0]+"//"+temp_text[2]+"/"+temp_text[3]+"/"+temp_text[4]+"/"+temp_text[5] + "/?p=0";//galleryURL[0,1,2,3,4,5,6] full_url
            deferred.resolve(g_url , clas);
        }
        else{
            deferred.reject("error " + error.errorCode + ":   e_find_gp0: " + fromurl);
        }
        return deferred.promise();
    }

    find_g_from_s(fromurl) {
        let clas = this;
        let deferred = $.Deferred();
        let temp_text = fromurl.split("/");
        let temp_gallery = temp_text[0] +"//"+ temp_text[2] + "/g/";//galleryURL[0,1,2,3] need3
        let temp_id = temp_text.pop();
        temp_id = temp_id.split("-")[0];
        let temp_search_keyword = temp_gallery + temp_id + "/";//galleryURL[0,1,2,3,4] need2

        let ajaxcall = $.ajax({url: fromurl});
        ajaxcall.done(function (data) {
            let temp_key = textsplit(data , temp_search_keyword , "/");
            if(temp_key != ""){
                deferred.resolve(temp_search_keyword + temp_key + "/" , clas);//galleryURL[0,1,2,3,4,5] need1
            }
            else{
                deferred.reject("error " + error.errorCode + ": e_find_g_from_s: " + fromurl);
            }
        }).fail(function (error) {
            deferred.reject("error " + error.errorCode + ": e_find_g_from_s: " + fromurl);
        });
        return deferred.promise();
    }

    get_data_from_g(inputurl) {
        let clas = this;
        let p_url = inputurl + "?p=";
        let deferred = $.Deferred();
        let ajaxcall = $.ajax({url: inputurl});
        ajaxcall.done(function (data) {
            let getartist = textsplit(data, "<div id=\"td_artist:", "\"");
            let getgroup = textsplit(data, "<div id=\"td_group:", "\"");
            let galleryname = textsplit(data, "id=\"gn\">", "</h1>");
            let gallerysize = "";

            let i = 0;
            while ((i = galleryname.indexOf("[")) != -1) {
                galleryname = galleryname.substring(0, i - 1) + galleryname.substring(galleryname.indexOf("]") + 1, galleryname.length);
            }
            while ((i = galleryname.indexOf("(")) != -1) {
                galleryname = galleryname.substring(0, i - 1) + galleryname.substring(galleryname.indexOf(")") + 1, galleryname.length);
            }
            while ((i = galleryname.indexOf("{")) != -1) {
                galleryname = galleryname.substring(0, i - 1) + galleryname.substring(galleryname.indexOf("}") + 1, galleryname.length);
            }//this code maybe problem when title have [],{},(). cause cannot evaluate added text or original title
            clas.filename = getgroup + "_" + getartist + "_" + galleryname;

            let maxpage = 0;
            if (data.indexOf(p_url) != -1) {
                maxpage = data.split(p_url);
                maxpage = maxpage[maxpage.length - 2].split("\"")[0];
            }

            let numberarray = [];
            for (i = 0; i <= maxpage; i++) {
                numberarray[i] = p_url + i;
            }
            deferred.resolve(numberarray, clas);
        }).fail(function (error) {
            deferred.reject("error " + error.errorCode + ": get_data_from_g: " + inputurl);
        });
        return deferred.promise();
    }

    find_s_from_all_g(fromurlarray) {
        let clas = this;
        let deferred = $.Deferred();
        let s_array = [];
        Promise.all(fromurlarray.map(function (fromurl) {
            return clas.find_s_from_g(fromurl);
        })).then(function (temp_array) {
            let temp_arraylength = temp_array.length;
            for (let i = 0; i < temp_arraylength; i++) {
                let temp_array2dlength = temp_array[i].length;
                while (temp_array2dlength > 0) {
                    let temp_text = temp_array[i].splice(0, 1);
                    s_array.push(temp_text);
                    temp_array2dlength = temp_array2dlength - 1;
                }
            }
            deferred.resolve(s_array, clas);
        }, function () {
            deferred.reject("error " + error.errorCode + ":  find_s_from_g: " + fromurl);
        });
        return deferred.promise();
    }

    find_s_from_g(fromurl) {
        let clas = this;
        let deferred = $.Deferred();
        let ajaxcall = $.ajax({url: fromurl});
        ajaxcall.done(function (data) {
            let s_array = data.split(clas.mainurl + "/s/");
            s_array.shift();
            let s_arraylength = s_array.length;
            for (let i = 0; i < s_arraylength; i++) {
                s_array[i] = s_array[i].split("\"")[0];
            }
            deferred.resolve(s_array);
        }).fail(function (error) {
            deferred.reject("error " + error.errorCode + ":  find_s_from_g: " + fromurl);
        });
        return deferred.promise();
    }

    find_image_from_all_s(fromurlarray) {
        let clas = this;
        let deferred = $.Deferred();
        let image_array = [];
        Promise.all(fromurlarray.map(function (fromurl) {
            return clas.find_image_from_s(clas.mainurl + "/s/" + fromurl);
        })).then(function (temp_array) {
            let temp_arraylength = temp_array.length;
            for (let i = 0; i < temp_arraylength; i++) {
                image_array.push(temp_array[i]);
            }
            deferred.resolve(image_array, clas);
        }, function () {
            deferred.reject("error " + error.errorCode + ":  find_s_from_g: " + fromurl);
        });
        return deferred.promise();
    }

    find_image_from_s(fromurl) {
        let clas = this;
        let deferred = $.Deferred();
        let ajaxcall = $.ajax({url: fromurl});
        ajaxcall.done(function (data) {
            let image_url = [];
            image_url[0] = textsplit(data, "id=\"img\"", "style");
            image_url[0] = textsplit(image_url[0], "src=\"", "\"");
            image_url[1] = textsplit(data, "return nl(\'", "\')\"");
            image_url[1] = fromurl + "?nl=" + image_url[1];
            deferred.resolve(image_url);
        }).fail(function (error) {
            deferred.reject("error " + error.errorCode + ":  find_s_from_g: " + fromurl);
        });
        return deferred.promise();
    }

    request_all_image(fromurlarray) {
        let clas = this;
        let deferred = $.Deferred();
        let image_array = [];
        let save_zip = new JSZip();
        Promise.all(fromurlarray.map(function (fromurl) {
            return clas.request_image(fromurl, save_zip)
        })).then(function () {
            deferred.resolve(save_zip, clas);
        }, function () {
            deferred.reject("error " + error.errorCode + ":  find_s_from_g: " + fromurl);
        });
        return deferred.promise();
    }

    request_image(fromurl, save_zip) {
        let clas = this;
        let deferred = $.Deferred();
        let xhr1 = new XMLHttpRequest();
        let xhr2 = new XMLHttpRequest();
        xhr1.onreadystatechange = function () {
            if (this.readyState == 4) {
                if (this.status == 200 || this.status == 304) {
                    let filename = fromurl[0].split("/").pop();
                    save_zip.file(filename, this.response, {base64: true});
                    deferred.resolve();
                }
                else {
                    clas.find_image_from_s(fromurl[1])
                        .then(function (fromurl) {
                            return clas.request_image(fromurl, save_zip);
                        }).then(function () {
                        deferred.resolve();
                    }, function () {
                        deferred.reject("error " + error.errorCode + ":  find_s_from_g: " + fromurl);
                    })
                }
            }
        };
        xhr1.open('GET', proxyurl + fromurl[0]);
        xhr1.responseType = 'arraybuffer';
        xhr1.send();
        return deferred.promise();
    }

    make_savefile(save_zip) {
        let clas = this;
        let content = save_zip.generateAsync({type: "blob"})
            .then(function (blob) {
                saveAs(blob, clas.filename + ".zip")
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
        zip[0].start();
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










