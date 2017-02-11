

let zip = [];
let completezip = [];
let errorzip = [];
const subDomainList = ["la","aa","ba"];
const callPerServer = 2;
let all_url_stack = "";//lock
let datalockcount = 0;

$(document).ready(function() {
    $('#getData').click(function () {
        if (datalockcount == 0 && zip.length == 0) {
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

        setzipnumber(linkid , zipnumber+ pushnumber , 1 );
        //setzipnumber(linkid , zipnumber+ pushnumber , 2 );
        setzipnumber(readyhtml[zipnumber] , zipnumber+ pushnumber , 3 );

        download_html(zipnumber+ pushnumber , passlockcount);
        setthreadlock(1).then(download_hitomi_js(zipnumber+ pushnumber  , passlockcount) , thenerror());
    }
}

function  initzipnumber(zipnumber) {
    zip[zipnumber] = [];
    zip[zipnumber][0] = new JSZip();
    zip[zipnumber][1] = "";//gallery number
    zip[zipnumber][2] = "";//file name
    zip[zipnumber][3] = ""//save original url info.
    zip[zipnumber][4] = [];//imageURL list
    zip[zipnumber][5] = [];//image name list
    zip[zipnumber][6] = 0;//count finish download
}

function setzipnumber( data, zipnumber , number ,arraynumber){
    if(Array.isArray(zip[zipnumber][number]) && !(arraynumber === undefined)){
        zip[zipnumber][number][arraynumber] = data;
    }
    else//maybe danger
    {
        zip[zipnumber][number] = data;
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
    setthreadlock(1).then(download_hitomi_html(zipnumber , passlockcount) , thenerror());
}

function download_hitomi_html(zipnumber , passlockcount)
{
        $.ajax({
            url: 'http://localhost:443/https://hitomi.la/galleries/' + zip[zipnumber][1] + '.html',
            //async:false,
            success: function (data) {
                let text1 = textsplit(data , "-gallery" , "gallery-info");

                let datatext = textsplit(text1 , "h1>" , "</h1");
                datatext = textsplit(datatext , ".html\">" , "</a");

                let creatertext = textsplit(text1 , "h2>" , "</h2");
                creatertext = textsplit(creatertext , ".html\">" , "</a");

                if(datatext == ""){
                    datatext = zip[zipnumber][1];
                }

                if(creatertext == ""){
                    creatertext = "N_A";
                }

                setzipnumber(creatertext + "__" + datatext , zipnumber , 2 );
                returnlock(passlockcount).then(isworking() , thenerror());
            },
            error: function() {
                setzipnumber(zip[zipnumber][1] , zipnumber , 2 );
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

function download_hitomi_js(zipnumber , passlockcount) {
    $.ajax({
        url: 'http://localhost:443/https://hitomi.la/galleries/'+ zip[zipnumber][1] +'.js',
        //async:false,
        success: function() {
            $.each(galleryinfo, function(i, image) {
                setzipnumber( url_from_url(zip[zipnumber][1] + "/" +image.name , i) , zipnumber , 4 ,zip[zipnumber][4].length);
                setzipnumber( image.name , zipnumber , 5 ,zip[zipnumber][5].length);
            });
            returnlock(passlockcount).then(isworking() , thenerror());
        },
        error: function() {
            setzipnumber("error", zipnumber , 4 ,0);
            setzipnumber("error", zipnumber , 5 ,0);
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
        if(zip[0][4][0] == "error")
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
        printwithTime("error in isworking - " + zip[0][3] + "\ndatalockcount = " + datalockcount + "\nzip.length = " + zip.length);
    }
}

function getimagedata(zipnumber) {
    for(let i = 0 ; (i < subDomainList.length * callPerServer) && (i < zip[zipnumber][4].length) ; i ++){
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
    xhr.open('GET', zip[zipnumber][4][index]);
    xhr.responseType = 'arraybuffer';
    xhr.send();
}

function image_downloaded(imgData , index, zipnumber) {
    zip[zipnumber][0].file(zip[zipnumber][5][index], imgData, {base64: true});
    setzipnumber(zip[zipnumber][6] + 1 , zipnumber , 6 );
        // > maybe wrong
    if (zip[zipnumber][6] >= zip[zipnumber][4].length) {
        let content = zip[zipnumber][0].generateAsync({type:"blob"})
        .then(function (blob) {
            saveAs(blob, zip[zipnumber][2]+".zip")
                .then(nextcontent(blob , zipnumber) , thenerror());
        }  , thenerror());
    }
    else if (index + subDomainList.length * callPerServer < zip[zipnumber][4].length){
        download_next_image(index + subDomainList.length * callPerServer , zipnumber);
    }
}

function thenerror(){}

function nextcontent(blob , zipnumber){
    var completeziplength = completezip.length
    completezip.push(zip.shift());
    completezip[completeziplength][0] = "";
    completezip[completeziplength][4] = "";
    completezip[completeziplength][5] = "";
    printwithTime(completezip[completeziplength][2]+".zip finish");
    //blob.close();
    isworking(0)
}

function printwithTime(str) {
    $('#finished_list').val( new Date().toLocaleTimeString() + ":\n " + str + "\n\n" + $('#finished_list').val());
}













