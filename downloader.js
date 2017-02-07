

var zip = [];
var subDomainList = ["la","aa","ba"];
var callPerServer = 2;
var onworking = "";
var countajaxthread = 0;

$(document).ready(function() {
    $('#getData').click(function() {
        download_get($('#input_url').val() , $('#input_fileName').val());
    });
});

function startajax()
{
    countajaxthread = countajaxthread +1;
}

function endajax() {
    countajaxthread = countajaxthread -1;
    if(countajaxthread < 0)
    {
        alert("작가,압축파일 이름,그림파일 목록들을 불러오는데 에러가 있었습니다.");
        return false;
    }
    else if(countajaxthread == 0)
    {
        return true;
    }
    else
    {
        return false;
    }

}

function download_get(galleryhtml) {
    printwithTime("start------------");
    var ziplength = zip.length;
    var readyhtml = galleryhtml.split(".html");


    getfiledata(readyhtml);


    //getimagedata(ziplength);


}

function getfiledata(readyhtml){
    var pushnumber = zip.length;
    for(var zipnumber = 0; zipnumber < readyhtml.length -1 ; zipnumber++) {
        initzipnumber(zipnumber+ pushnumber);

        var galleryid = readyhtml[zipnumber].split("/");

        setzipnumber(zipnumber+ pushnumber , 1 , galleryid[galleryid.length - 1]);
        setzipnumber(zipnumber+ pushnumber , 2 , galleryid[galleryid.length - 1]);
        setzipnumber(zipnumber+ pushnumber , 3 , readyhtml[zipnumber]);

        download_request(zipnumber+ pushnumber);
        download_gallery(zipnumber+ pushnumber);

    }

    //download_request(pushnumber);
    //download_gallery(pushnumber);

}

function  initzipnumber(zipnumber) {
    zip[zipnumber] = [];
    zip[zipnumber][0] = new JSZip();
    zip[zipnumber][1] = "";//gallery number
    zip[zipnumber][2] = "";//file name
    zip[zipnumber][3] = ""
    zip[zipnumber][4] = [];//imageURL list
    zip[zipnumber][5] = [];//js liat
    zip[zipnumber][6] = 0;//count finish download
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
            if(zip[i][6] == 0)
            {
                zipnumber = i;
            }
        }
        onworking = "working now";
        if(zipnumber != -1)
        {
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
        for(var i = 0 ; (i < subDomainList.length * callPerServer) && (i < zip[zipnumber][4].length) ; i ++)
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

function download_request(zipnumber) {
    var galleryid = zip[zipnumber][3].split("/");

    if (galleryid[galleryid.length - 2] == "galleries") {
        startajax();
        $.ajax({
            url: 'http://localhost:443/https://hitomi.la/galleries/' + zip[zipnumber][1] + '.html',
            //async:false,
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

                setzipnumber(zipnumber , 2 , creatertext + "__" + datatext);
                setzipnumber(zipnumber , 3 , "");
                if(endajax())
                {
                    isworking();
                }
            }
        });
    }
    else {
        setzipnumber(zipnumber , 3 , "");
       // if(zipnumber != zip.length -1)
        //{
        //    download_request(zipnumber+1);
       // }
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
        startajax();
        $.ajax({
            url: 'http://localhost:443/https://hitomi.la/galleries/'+ zip[zipnumber][1] +'.js',
            //async:false,
            success: function() {
                $.each(galleryinfo, function(i, image) {
                    zip[zipnumber][4].push(url_from_url(zip[zipnumber][1] + "/" +image.name , i));
                    zip[zipnumber][5].push(image.name);
                });
                //if(zipnumber != zip.length -1)
               // {
                //    download_gallery(zipnumber+1);
                //}
                if(jQuery.active == 1)
                {
                    isworking();
                }
            }
        });
        if(endajax())
        {
            isworking();
        }
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

        xhr.open('GET', zip[zipnumber][4][index]);
        xhr.responseType = 'arraybuffer';
        xhr.send();
    }

    function image_downloaded(imgData , index, zipnumber) {
        zip[zipnumber][0].file(zip[zipnumber][5][index], imgData, {base64: true});
        setzipnumber(zipnumber , 6 , zip[zipnumber][6] + 1);

        if (zip[zipnumber][6] >= zip[zipnumber][4].length) {
            var content = zip[zipnumber][0].generateAsync({type:"blob"}).then(function (blob) {
                saveAs(blob, zip[zipnumber][2]+".zip").then(freecontent(blob , zipnumber) , thenerror())
            } , thenerror());
            printwithTime(zip[zipnumber][2]+".zip");
            getimagedata(zipnumber+1);
        }
        else if (index + subDomainList.length * callPerServer < zip[zipnumber][4].length){
            download_next_image(index + subDomainList.length * callPerServer , zipnumber);
        }
    }

    function thenerror()
    {}

    function resetziparray(zipnumber)
    {
        setzipnumber(zipnumber , 4 , "");
        setzipnumber(zipnumber , 5 , "");
    }

    function freecontent(blob , zipnumber)
    {
        setzipnumber(zipnumber , 0 , "");
        resetziparray(zipnumber);
        //blob.close();
        //var content = window.URL.createObjectURL(blob);
        //var url = (window.URL || window.webkitURL);
        //var objectUrl = url.createObjectURL(blob);
        //url.revokeObjectURL(objectUrl);
    }

    function printwithTime(str) {
        $('#finished_list').val( new Date().toLocaleTimeString() + ":\n " + str + "\n\n" + $('#finished_list').val());
    }













