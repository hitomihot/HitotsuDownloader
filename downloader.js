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
            case "s"    : this._mainid = text[5].split("-")[0];
                break;
            case "g"   :
            case "mpv"  : this._mainid = text[4];
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

    setthreadcount(number) {
        let clas = this;
        return new Promise(function (resolve, reject) {
            if (number > 0 && clas.threadcount >= 0) {
                clas.threadcount = clas.threadcount + number;
                resolve();
            }
            else {
                reject();
            }
        });
    }

    unlockthread() {
        let clas = this;
            clas.threadcount = clas.threadcount - 1;
        return new Promise(function (resolve, reject) {
            if (clas.threadcount >= 0) {
                resolve();
            }
            else {
                reject();
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
            if (text[3] == "s") {
                this.request_g_from_s();
            }
            else if (text[3] == "g") {
                this.request_s_from_g(this.originurl);
            }
        }
        else {

        }
    }

    request_g_from_s() {
        let clas = this;
        $.ajax({
            url: this.originurl,
            //async:false,
            success: function (data) {
                let g_key = textsplit(data , clas.mainurl + "/g/" + clas.mainid + "/" , "/");
                clas.request_all_g(g_key);
            },
            error: function () {/*error*/
            }
        });
    }

    request_all_g(g_key )
    {
        let clas = this;
        $.ajax({
            url: this.originurl,
            //async:false,
            success: function (data) {
                let lastg = textsplit(data , clas.mainurl + "/g/" + clas.mainid + "/" , "/");
                clas.request_all_g(g_key);
            },
            error: function () {/*error*/
            }
        });
    }

    request_s_from_g(fromurl) {
        let clas = this;
        $.ajax({
            url: fromurl,
            //async:false,
            success: function (data) {
                let getartist = textsplit(data, "<div id=\"td_artist:", "\"");
                let getgroup = textsplit(data, "<div id=\"td_group:", "\"");
                let galleryname = textsplit(data, "id=\"gn\">", "</h1>");

                let i = 0;
                while ((i = galleryname.indexOf("[")) != -1) {
                    galleryname = galleryname.substring(0, i - 1) + galleryname.substring(galleryname.indexOf("]") + 1, galleryname.length);
                }
                while ((i = galleryname.indexOf("(")) != -1) {
                    galleryname = galleryname.substring(0, i - 1) + galleryname.substring(galleryname.indexOf(")") + 1, galleryname.length);
                }
                while ((i = galleryname.indexOf("{")) != -1) {
                    galleryname = galleryname.substring(0, i - 1) + galleryname.substring(galleryname.indexOf("}") + 1, galleryname.length);
                }
                clas.filename = getgroup + "_" + getartist + "_" + galleryname;

                let text = textsplit(data, clas.mainurl + "/s/", "\">");
                if (text != "") {
                    clas.request_thread_from_s(clas.mainurl + "/s/" + text);
                }
            },
            error: function () {/*error*/
            }
        });
    }

    request_thread_from_s(fromurl) {
        let clas = this;
        $.ajax({
            url: fromurl,
            //async:false,
            success: function (data) {
                let urlarray = fromurl.split("/");
                let imgnumber = urlarray[urlarray.length - 1].split("-")[1];
                if (imgnumber == 1)//right?
                {
                    let lockcount = textsplit(data, " / <span>", "</span>");
                    if (lockcount != "") {
                        clas.setthreadcount(lockcount).then(function () {
                            let nexts = clas.find_nexts_from_s(data, imgnumber);
                            if (nexts != "") {
                                clas.request_nexts_from_s(nexts);
                            }
                            clas.request_image_from_s(clas.find_image_url(data));
                        }, function () {/*error*/
                        });
                    }
                }
                else {
                    let key = textsplit(data, clas.mainurl + "/s/", "-1");
                    if (key != "") {
                        clas.request_thread_from_s(clas.mainurl + "/s/" + key + "-1");
                    } else {/*error*/
                    }
                }
            }
        });
    }

    request_nexts_from_s(fromurl) {
        let clas = this;
        $.ajax({
            url: fromurl,
            //async:false,
            success: function (data) {
                let temp1 = fromurl.split("/s/");
                let imagenumber = temp1[1].split("/")[1].split;
                let nexts = clas.find_nexts_from_s(data, imgnumber);
                if (nexts != "") {
                    clas.request_nexts_from_s(nexts);
                }
                clas.request_image_from_s(clas.find_image_url(data));
            },
            error: function () {/*error*/
            }
        });
    }

    request_image_from_s(fromurl) {
        let clas = this;
        let xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function () {
            if (this.readyState == 4) {
                if (this.status == 200 || this.status == 304) {
                    let filename = fromurl.split("/").pop();
                    clas.jszip.file(filename, this.response, {base64: true});
                    clas.unlockthread().then(function ()
                    {
                        if (clas.threadcount == 0) {
                            clas.jszip.generateAsync({type: "blob"}).then(function (blob) {
                                saveAs(blob, clas.filename + ".zip");
                            } , function(){/*error*/})
                        }
                    } , function(){/*error*/});
                }
                else {

                }
            }
        };
        xhr.open('GET', proxyurl + fromurl);
        xhr.responseType = 'arraybuffer';
        xhr.send();
    }

    find_nexts_from_s(data, integ) {
        let next = Number(integ) + 1;
        let key = textsplit(data, "id=\"next\"", "\">");
        key = textsplit(key, "href=\"", "-" + next);
        if (key != "") {
            return (key + "-" + next);
        } else {
            return "";
            /*error*/
        }
    }

    find_image_url(data) {
        let text = textsplit(data, "id=\"img\"", "style");
        text = textsplit(text, "src=\"", "\"");
        return text;
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


/*

 function setZip(inputurl) {
 let inputurllength = inputurl.length;
 }

 function getfiledata(inputurl) {
 let linkid = 0;
 let pushnumber = zip.length;
 let inputurllength = inputurl.length;
 let passlockcount = datalockcount;
 let download_arraylength = download_array.length;

 setthreadlock(inputurllength * download_arraylength).then(function () {
 for (let a = 0; a < inputurllength; a++) {
 initzipnumber(a + pushnumber);
 zip[a + pushnumber].fileurl = inputurl[a];
 for (let b = 0; b < download_arraylength; b++) {
 download_array[b](a + pushnumber, passlockcount);
 }
 }
 }
 );
 }

 function setthreadlock(number) {
 datalockcount = datalockcount + number;
 return new Promise(function (resolve, reject) {
 if (datalockcount >= 0) {
 resolve();
 }
 else {
 reject();
 }
 });
 }
 function returnlock(passlockcount) {
 datalockcount = datalockcount - 1;
 return new Promise(function (resolve, reject) {
 if (!(datalockcount < passlockcount)) {
 resolve();
 }
 else {
 reject();
 }
 });
 }


 function download_html(zipnumber, passlockcount) {
 download_hitomi_html(zipnumber, passlockcount);
 }





 function download_hitomi_js(zipnumber, passlockcount) {
 $.ajax({
 url: 'http://localhost:443/https://hitomi.la/galleries/' + zip[zipnumber][1] + '.js',
 //async:false,
 success: function () {
 $.each(galleryinfo, function (i, image) {
 zip[zipnumber].pushimageurl(url_from_url(zip[zipnumber].filenumber + "/" + image.name, i));
 zip[zipnumber].pushimagename(image.name);
 //zip[zipnumber].lockthread(); i try set thread lock here. but fail. why?
 });
 returnlock(passlockcount).then(isworking(), thenerror());

 },
 error: function () {
 //zip[zipnumber].pushimageurl(url_from_url(zip[zipnumber].filenumber + "/" +image.name , i));
 //zip[zipnumber].pushimagename(image.name);
 zip[zipnumber].threadcount = 0;//is this really work?
 returnlock(passlockcount).then(isworking(), thenerror());
 }
 });
 }

 function url_from_url(url, i) {
 return "http://localhost:443/https://" + subdomain_from_url(i) + ".hitomi.la/galleries/" + url;
 }

 function subdomain_from_url(i) {
 let retval = subDomainList[i % subDomainList.length];
 return retval;
 }

 function isworking() {
 if (all_url_stack != "") {
 download_get(all_url_stack);
 all_url_stack = "";
 }
 else if (datalockcount == 0 && (zip.length > 0)) {
 if (zip[0].imageurl[0] == "error") {
 errorzip.push(zip.shift());
 isworking();
 }
 else {
 getimagedata(0);
 }
 }
 else if (datalockcount == 0 && zip.length == 0) {
 printwithTime("finish------");
 }
 else if (datalockcount > 0 && zip.length > 0) {

 }
 else {
 printwithTime("error in isworking - " + zip[0].fileurl + "\ndatalockcount = " + datalockcount + "\nzip.length = " + zip.length);
 }
 }

 function getimagedata(zipnumber) {
 let imageurllength = zip[zipnumber].imageurl.length - 1;
 zip[zipnumber].threadcount = imageurllength + 1;
 let maxthread = subDomainList.length * callPerServer;
 for (let i = 0; (i < subDomainList.length * callPerServer) && (i < imageurllength); i++) {
 download_next_image(imageurllength - i, zipnumber, maxthread);
 }
 }

 function download_next_image(index, zipnumber, maxthread) {
 if (index >= 0) {
 ajax_download_blob(index, zipnumber, 0, maxthread);
 }
 }

 function ajax_download_blob(index, zipnumber, count, maxthread) {
 let xhr = new XMLHttpRequest();

 xhr.onreadystatechange = function () {
 if (this.readyState == 4) {
 if (this.status == 200 || this.status == 304) {
 image_downloaded(this.response, index, zipnumber, maxthread);
 }
 else {
 if (count < 10) {
 ajax_download_blob(index, zipnumber, count + 1);//is this really effective code?
 }
 else {
 alert("error on picture number" + index + "-- error " + this.status);
 //need whar file
 }
 }
 }
 };
 xhr.open('GET', zip[zipnumber].imageurl[index]);
 xhr.responseType = 'arraybuffer';
 xhr.send();
 }

 function image_downloaded(imgData, index, zipnumber, maxthread) {
 zip[zipnumber].jszip.file(zip[zipnumber].imagename[index], imgData, {base64: true});
 zip[zipnumber].unlockthread();
 if (zip[zipnumber].threadcount == 0) {
 let content = zip[zipnumber].jszip.generateAsync({type: "blob"})
 .then(function (blob) {
 saveAs(blob, zip[zipnumber].filename + ".zip")
 .then(nextcontent(blob, zipnumber), thenerror());
 }, thenerror());
 }
 else if (zip[zipnumber].threadcount < 0) {
 alert("error on image_download thread error. zip[" + zipnumber + "][" + index + "] , maxthread = " + maxthread);
 }
 else {
 download_next_image(index - maxthread, zipnumber, maxthread);
 }
 }

 function thenerror() {
 }

 function nextcontent(blob, zipnumber) {
 var completeziplength = completezip.length;
 completezip.push(zip.shift());
 //completezip[completeziplength].jszip = "";
 //completezip[completeziplength].imageurl = [""];
 //completezip[completeziplength].imagename = [""];
 printwithTime(completezip[completeziplength].filename + ".zip finish");
 //blob.close();
 isworking();
 }



 */

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










