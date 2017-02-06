

var zip = [];
var subDomainList = ["la","aa","ba"];
var callPerServer = 5;
var onworking = "";

$(document).ready(function() {
    $('#getData').click(function() {
        download_get($('#input_url').val() , $('#input_fileName').val());
    });
});


function download_get(galleryhtml) {
    printwithTime("ready for download-----------");
    var ziplength = zip.length;
    var readyhtml = galleryhtml.split(".html");


    getfiledata(readyhtml);


    //getimagedata(ziplength);


}

function getfiledata(readyhtml){
    for(var zipnumber = 0; zipnumber < readyhtml.length -1 ; zipnumber++) {
        var pushnumber = zip.length;
        initzipnumber(pushnumber);

        download_request(readyhtml[zipnumber] , pushnumber);
    }
}

function  initzipnumber(zipnumber) {
    zip[zipnumber] = [];
    zip[zipnumber][0] = new JSZip();
    zip[zipnumber][1] = "";//gallery number
    zip[zipnumber][2] = "";//file name
    zip[zipnumber][3] = [];//imageURL list
    zip[zipnumber][4] = [];//js liat
    zip[zipnumber][5] = 0;//count finish download
}

function setzipnumber(zipnumber , number , data)
{
    zip[zipnumber][number] = data;
}

function isworking()
{
    var zipnumber = -1;
    if(onworking == "")
    {
        for(i = zip.length -1 ; i > -1 ; i --)
        {
            if(zip[i][5] == 0)
            {
                zipnumber = i;
            }
        }
        onworking = "working now";
        if(zipnumber != -1)
        {
            printwithTime("start------------");
            getimagedata(zipnumber);
        }
        else
        {
            printwithTime("add more download------------");
            getimagedata(zipnumber);
        }
    }
}

function getimagedata(zipnumber) {
    if(zipnumber < zip.length)
    {
        for(var i = 0 ; (i < subDomainList.length * callPerServer) && (i < zip[zipnumber][3].length) ; i ++)
        {
            download_next_image(i , zipnumber);
        }
    }
    else
    {
        onworking = "";
        printwithTime("finish--------");
    }
}

function download_request(request , zipnumber) {
    var galleryid = request.split("/");

    if (galleryid[galleryid.length - 2] == "galleries") {
        $.ajax({
            url: 'http://localhost:443/https://hitomi.la/galleries/' + galleryid[galleryid.length - 1] + '.html',
            async:false,
            success: function (data) {
                var text1 = textsplit(data , "-gallery" , "gallery-info");

                var datatext = textsplit(text1 , "h1>" , "</h1");
                datatext = textsplit(datatext , ".html\">" , "</a");

                var creatertext = textsplit(text1 , "h2>" , "</h2");
                creatertext = textsplit(creatertext , ".html\">" , "</a");

                if(datatext == "")
                {
                    datatext = galleryid[galleryid.length - 1];
                }

                if(creatertext == "")
                {
                    creatertext = "N_A";
                }

                setzipnumber(zipnumber , 1 ,  galleryid[galleryid.length - 1]);
                setzipnumber(zipnumber , 2 , creatertext + "__" + datatext);
                download_gallery(zipnumber);
            }
        });
    }
    else {
        setzipnumber(zipnumber , 1 , galleryid[galleryid.length - 1]);
        setzipnumber(zipnumber , 2 , galleryid[galleryid.length - 1]);
        download_gallery(zipnumber);
    }
}


function textsplit(data , sp1 , sp2)
{
    if(data.indexOf(sp1) != -1 && data.indexOf(sp2) != -1)
    {
        var text = data.split(sp1)[1].split(sp2)[0];
        return text;
    }
    else
    {
        return "";
    }

}

    function download_gallery(zipnumber) {

        $.ajax({
            url: 'http://localhost:443/https://hitomi.la/galleries/'+ zip[zipnumber][1] +'.js',
            async:false,
            success: function() {
                var trigger = 0;
                $.each(galleryinfo, function(i, image) {
                    zip[zipnumber][3].push(url_from_url(zip[zipnumber][1] + "/" +image.name , i));
                    zip[zipnumber][4].push(image.name);
                });
                for(var i = 0 ; i < (zip.length -1) ; i ++)
                {
                    if(zip[i][3].length == 0)
                    {
                        trigger = 1;
                    }
                }
                if(trigger == 0)
                {
                    isworking();
                }
            }
        });
    }

    function subdomain_from_url(i) {
        var retval = subDomainList[i%subDomainList.length];
        return retval;
    }
    function url_from_url(url , i) {
        return "http://localhost:443/https://" + subdomain_from_url(i) + ".hitomi.la/galleries/"+ url;
    }

    function download_next_image(index , zipnumber) {
                ajax_download_blob(index, zipnumber , 0);
    }

    function ajax_download_blob(index, zipnumber , count) {
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function() {
            if (this.readyState == 4) {
                if( this.status == 200 || this.status == 304)
                {
                    image_downloaded(this.response , index, zipnumber);
                }
                else
                {
                    if(count < 10) {
                        ajax_download_blob(index, zipnumber, count + 1);
                    }
                    else
                    {
                        alert("error on picture number" + index +"-- error " + this.status);
                    }
                }
            }
        }

        xhr.open('GET', zip[zipnumber][3][index]);
        xhr.responseType = 'arraybuffer';
        xhr.send();
    }

    function image_downloaded(imgData , index, zipnumber) {
        zip[zipnumber][0].file(zip[zipnumber][4][index], imgData, {base64: true});
        setzipnumber(zipnumber , 5 , zip[zipnumber][5] + 1);

        if (zip[zipnumber][5] >= zip[zipnumber][3].length) {
            var content = zip[zipnumber][0].generateAsync({type:"blob"}).then(function (blob) {
                saveAs(blob, zip[zipnumber][2]+".zip").then(zip[zipnumber][0] = "");
            })
            printwithTime(zip[zipnumber][2]+".zip"+ "\n");
            getimagedata(zipnumber+1);
        }
        else if (index + subDomainList.length * callPerServer < zip[zipnumber][3].length){
            download_next_image(index + subDomainList.length * callPerServer , zipnumber);
        }
    }

    function printwithTime(str) {
        $('#finished_list').val( new Date().toLocaleTimeString() + ": " + str + "\n" + $('#finished_list').val());
    }













