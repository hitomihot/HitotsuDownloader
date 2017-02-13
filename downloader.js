
let zip = [];
let completezip = [];
let errorzip = [];
let all_url_stack = "";//lock
let datalockcount = 0;
const subDomainList = ["la","aa","ba"];
const callPerServer = 2;
const download_array = [];

download_array[0] = function download_html(zipnumber , passlockcount) {
    download_hitomi_html(zipnumber , passlockcount);
}

download_array[1] = function download_hitomi_js(zipnumber , passlockcount ) {
    $.ajax({
        url: 'http://localhost:443/https://hitomi.la/galleries/'+ zip[zipnumber].filenumber +'.js',
        //async:false,
        success: function() {
            $.each(galleryinfo, function(i, image) {
                zip[zipnumber].pushimageurl(url_from_url(zip[zipnumber].filenumber + "/" +image.name , i));
                zip[zipnumber].pushimagename(image.name);
            });
            returnlock(passlockcount).then(isworking() , thenerror());

        },
        error: function() {
            zip[zipnumber].imageurl = ["error"];
            zip[zipnumber].imagename = ["error"];
            returnlock(passlockcount).then(isworking() , thenerror());
        }
    });
}

class zipmember{
    constructor()
    {
        this.filename = "";//for save file
        this.fileurl = "";//for save original url
        this.filenumber = "";//for download
        this.imagename = [];//for save imagefile
        this.imageurl = [];//for download
        this.zip = new JSZip();
        this.downloadcount = 0;
    }

    get filename() {return this._filename; }
    get fileurl() {return this._fileurl; }
    get filenumber() {return this._filenumber; }
    get imagename() {return this._imagename; }
    get imageurl() {return this._imageurl; }
    get zip() {return this._zip; }
    get downloadcount() {return this._downloadcount; }

    set filename(stri) {this._filename = stri; }
    set fileurl(stri) {this._fileurl = stri; }
    set filenumber(stri) {this._filenumber = stri; }
    set imagename(arra) { if(Array.isArray(arra)){this._imagename = arra;} }
    set imageurl(arra) {if(Array.isArray(arra)){this._imageurl = arra;} }
    set zip(jszi) {this._zip  = jszi; }//need block if not JSzip
    set downloadcount(inte) {this._downloadcount = inte; }

    pushimagename(stri){
        this.imagename.push(stri);
    };
    pushimageurl(stri){
        this.imageurl.push(stri);
    };
    addfinishcount(){
        this.downloadcount = this.downloadcount +1;
    };
}

function  initzipnumber(zipnumber) {
    zip[zipnumber] = new zipmember();
}


$(document).ready(function() {
    $('#getData').click(function () {
        if (datalockcount == 0 && zip.length == 0) {
            //need disable button
            printwithTime("start------------");
            download_get(all_url_stack + $('#input_url').val(), $('#input_fileName').val());
            all_url_stack = "";
        }
        else {
            all_url_stack = all_url_stack + $('#input_url').val() , $('#input_fileName').val();
            printwithTime("ready for add download url-----------");
        }
    });
});

function download_get(galleryhtml) {
        let readyhtml = galleryhtml.split("https://");
        readyhtml.shift();
        getfiledata(readyhtml);
}

function getfiledata(readyhtml){
    let linkid = 0;
    let pushnumber = zip.length;
    let readyhtmllength = readyhtml.length;
    let passlockcount = datalockcount;
    let download_arraylength = download_array.length;

    setthreadlock(readyhtmllength * download_arraylength);

    for(let zipnumber = 0; zipnumber < readyhtmllength ; zipnumber++) {
        initzipnumber(zipnumber+ pushnumber);
        let urltext = readyhtml[zipnumber].split("/");
        if(urltext[0] == "e-hentai.org" || urltext[0] == "exhentai.org") {
            if(urltext[1] == "g") {
                linkid = urltext[urltext.length-3];
            }
            else if(urltext == "s") {
                linkid = urltext[urltext.length-1].split("-")[0];
            }
        }
        else if(urltext[0] == "hitomi.la"){
            linkid = urltext[urltext.length-1].split(".")[0];
        }

        zip[zipnumber+ pushnumber].filenumber = linkid;
        zip[zipnumber+ pushnumber].fileurl = readyhtml[zipnumber];

        for(let i = 0 ; i < download_arraylength ; i++)
        {
            download_array[i](zipnumber+ pushnumber , passlockcount);
        }
    }
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
};

function returnlock(passlockcount) {
    datalockcount = datalockcount -1;
    return new Promise(function (resolve, reject) {
        if (  !  (datalockcount < passlockcount)) {
            resolve();
        }
        else {
            reject();
        }
    });
}



function download_html(zipnumber , passlockcount) {
    download_hitomi_html(zipnumber , passlockcount);
}

function download_hitomi_html(zipnumber , passlockcount)
{
        $.ajax({
            url: 'http://localhost:443/https://hitomi.la/galleries/' + zip[zipnumber].filenumber + '.html',
            //async:false,
            success: function (data) {
                let text1 = textsplit(data , "-gallery" , "gallery-info");

                let datatext = textsplit(text1 , "h1>" , "</h1");
                datatext = textsplit(datatext , ".html\">" , "</a");

                let creatertext = textsplit(text1 , "h2>" , "</h2");
                creatertext = textsplit(creatertext , ".html\">" , "</a");

                if(datatext == ""){
                    datatext = zip[zipnumber].filenumber ;
                }

                if(creatertext == ""){
                    creatertext = "N_A";
                }

                zip[zipnumber].filename = creatertext + "__" + datatext;
                returnlock(passlockcount).then(isworking() , thenerror());
            },
            error: function() {
                zip[zipnumber].filename = zip[zipnumber].filenumber;
                returnlock(passlockcount).then(isworking() , thenerror());
            }
        });
}

function textsplit(data , sp1 , sp2)
{
    if(data.indexOf(sp1) != -1 && data.indexOf(sp2) != -1){
        let text = data.split(sp1)[1].split(sp2)[0];
        return text;
    }
    else{
        return "";
    }
}

function download_hitomi_js(zipnumber , passlockcount ) {
    $.ajax({
        url: 'http://localhost:443/https://hitomi.la/galleries/'+ zip[zipnumber][1] +'.js',
        //async:false,
        success: function() {
            $.each(galleryinfo, function(i, image) {
                zip[zipnumber].pushimageurl(url_from_url(zip[zipnumber].filenumber + "/" +image.name , i));
                zip[zipnumber].pushimagename(image.name);
            });
            returnlock(passlockcount).then(isworking() , thenerror());

        },
        error: function() {
            zip[zipnumber].pushimageurl(url_from_url(zip[zipnumber].filenumber + "/" +image.name , i));
            zip[zipnumber].pushimagename(image.name);
            returnlock(passlockcount).then(isworking() , thenerror());
        }
    });
}

function url_from_url(url , i) {
    return "http://localhost:443/https://" + subdomain_from_url(i) + ".hitomi.la/galleries/"+ url;
}

function subdomain_from_url(i) {
    let retval = subDomainList[i%subDomainList.length];
    return retval;
}

function isworking()
{
    if(all_url_stack != "")
    {
        download_get(all_url_stack);
        all_url_stack = "";
    }
    else if(datalockcount == 0 && (zip.length > 0))
    {
        if(zip[0].imageurl[0] == "error")
        {
            errorzip.push(zip.shift());
            isworking();
        }
        else
        {
            getimagedata(0);
        }
    }
    else if(datalockcount == 0 && zip.length == 0 )
    {
        printwithTime("finish------");
    }
    else if(datalockcount > 0 && zip.length > 0)
    {

    }
    else
    {
        printwithTime("error in isworking - " + zip[0].fileurl + "\ndatalockcount = " + datalockcount + "\nzip.length = " + zip.length);
    }
}

function getimagedata(zipnumber) {
    for(let i = 0 ; (i < subDomainList.length * callPerServer) && (i < zip[zipnumber].imageurl.length) ; i ++){
        download_next_image(i , zipnumber);
    }
}

function download_next_image(index , zipnumber) {
    ajax_download_blob(index, zipnumber , 0);
}

function ajax_download_blob(index, zipnumber , count) {
    let xhr = new XMLHttpRequest();

    xhr.onreadystatechange = function() {
        if(this.readyState == 4) {
            if( this.status == 200 || this.status == 304) {
                image_downloaded(this.response , index, zipnumber);
            }

            else {
                if(count < 10) {
                    ajax_download_blob(index, zipnumber, count + 1);
                }
                else {
                    alert("error on picture number" + index +"-- error " + this.status);
                    //need whar file
                }
            }
        }
    }
    xhr.open('GET', zip[zipnumber].imageurl[index]);
    xhr.responseType = 'arraybuffer';
    xhr.send();
}

function image_downloaded(imgData , index, zipnumber) {
    zip[zipnumber].zip.file(zip[zipnumber].imagename[index], imgData, {base64: true});
    zip[zipnumber].addfinishcount();
        // > maybe wrong
    if (zip[zipnumber].downloadcount >= zip[zipnumber].imageurl.length) {
        let content = zip[zipnumber].zip.generateAsync({type:"blob"})
        .then(function (blob) {
            saveAs(blob, zip[zipnumber].filename+".zip")
                .then(nextcontent(blob , zipnumber) , thenerror());
        }  , thenerror());
    }
    else if (index + subDomainList.length * callPerServer < zip[zipnumber].imageurl.length){
        download_next_image(index + subDomainList.length * callPerServer , zipnumber);
    }
}

function thenerror(){}

function nextcontent(blob , zipnumber){
    var completeziplength = completezip.length
    completezip.push(zip.shift());
    completezip[completeziplength].zip = "";
    completezip[completeziplength].imageurl = [""];
    completezip[completeziplength].imagename = [""];
    printwithTime(completezip[completeziplength].filename+".zip finish");
    //blob.close();
    isworking(0)
}

function printwithTime(str) {
    $('#finished_list').val( new Date().toLocaleTimeString() + ":\n " + str + "\n\n" + $('#finished_list').val());
}













