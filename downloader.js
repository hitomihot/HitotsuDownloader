// ==UserScript==
// @name         02
// @namespace    http://tampermonkey.net/
// @version      0.11
// @description  try to take over the world!
// @author       You
// @include      https://hitomi.la/galleries/*.html
// @include      https://hitomi.la/reader/*.html
// @include      https://e-hentai.org/g/*
// @include      https://e-hentai.org/s/*
// @include      https://exhentai.org/g/*
// @include      https://exhentai.org/s/*
// @require      http://code.jquery.com/jquery-latest.js
// @require      https://rawgit.com/Stuk/jszip/master/dist/jszip.js
// @require      https://rawgit.com/eligrey/FileSaver.js/master/FileSaver.js
// @require      https://cdn.jsdelivr.net/bluebird/latest/bluebird.js
// @require      https://rawgit.com/johnkpaul/jquery-ajax-retry/master/dist/jquery.ajax-retry.js
// @grant       GM_xmlhttpRequest
// @connect      *
// ==/UserScript==

(function() {
	'use strict';


	let zip = [];
	let completezip = [];
	let errorzip = [];
	let db = 0;


	const subDomainList = ["la", "ba", "aa"];//la,aa,ba
	const proxyurl = ""; //

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
						if(temp_buffer.length == 1){
							return clas.make_savefile(save_zip, filename);
						}
						else{
							return clas.make_savefile(save_zip, filename + "_" + add_number);			
						}
						add_number = add_number + 1;
					});
				}).then(function () {
					resolve("success");
				}).catch(function () {
					console.log("error " + ":  h_set_download: " + filename + "\n\n" + "\n\n" + sync_count1 + "\n\n" + clas);
					reject("error " + ":  h_set_download: " + filename + "\n\n"+ "\n\n" + sync_count1 + "\n\n" + clas);
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
						galleryname = removetext(galleryname , "[" , "]");
						galleryname = removetext(galleryname , "(" , ")");
						galleryname = removetext(galleryname , "{" , "}");
					}
					//this code maybe problem when real_title have [],{},(). cause cannot evaluate added text or original title

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
							if(temp_buffer.length == 1){
								return clas.make_savefile(save_zip, filename);
							}
							else{
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

	let titletext = window.location.href.split("/")[2];
	$('body').prepend('<div style="text-align:center">'+
					  '<p>'+ titletext+ ' downloader</p>' +
					  '<input id=\'input_url\' value=\'\'>' +
					  '<button id = \'getData\' >start</button>' +
					  '<button id = \'pushurl\' >url</button>' +
					  '<br><br><textarea id=\'finished_list\'rows="5" cols="50">print log place </textarea>'+
					  '<textarea id=\'loading_list\'rows="5" cols="50">print log place </textarea> <br>'+
					  '</div>');

	create_opendb("url_array", 1)
		.then(function (retur) {db = retur;})
		.catch(function (event) {
		console.log("error " + ":  document_ready_create_opendb: " + "url_array" + "\n\n" + "1");
	});

	$.ajaxPrefilter(function (options) {
		if (options.crossDomain && jQuery.support.cors) {
			var http = (window.location.protocol === 'http:' ? 'http:' : 'https:');
			if (options.url.indexOf(proxyurl) != -1) {
				options.url = options.url;
			}
			else {
				options.url = proxyurl + options.url;//if proxy use. error with ajax-retry , prox->prox+prox->prox+prox+prox......
			}
		}
	});

	$('#getData').click(function () {
		if (zip.length <= 0) {
			printwithTime("start------------" , '#finished_list');
			db_get_rw(db, "url_array", 1, "url").then(function (urls) {
				if (urls != "" || urls != undefined) {
					download_get(urls + $('#input_url').val());
					return db_put(db, "url_array", "", 1);
				}
				else {
					download_get($('#input_url').value);
				}
			}).catch(function (event) {
				console.log("error " + ":  #getData_clickevent: " + zip.length);
			});
		}
	});

	$('#pushurl').click(function () {
		db_get_rw(db, "url_array", 1, "url").then(function (value) {
			printwithTime("add download list" +"\n"+ window.location.href , '#finished_list');
			return db_put(db, "url_array", {url: value + window.location.href}, 1);
		}).catch(function (event) {
			console.log("error " + ":  #pushurl_clickevent: " + db +"\n\n" +  "url_array" + "\n\n" + "1" + "\n\n" +  "url");
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
		else {/*end or error*/
			let temp = db_get_rw(db, "url_array", 1, "url").then(function (urls) {
				if (urls != "") {
					download_get(urls);
					return db_put(db, "url_array", "", 1);
				}
				else {
					//reject("nextstart");
				}
			}).catch(function (event) {
				console.log("error " + ":  nextstart: " + db +"\n\n" +  "url_array" + "\n\n" + "1" + "\n\n" +  "url");
			});
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

	function removetext(data , text1 , text2){
		let temp = data;
		while(true){
			let i = temp.indexOf(text1);
			let j = temp.indexOf(text2);
			let templength = temp.length;
			if(i == -1 && j == -1){
				break;
			}
			else if(i != -1 && j != -1 &&  i < j){
				temp =  temp.substring(0, i ) + temp.substring(j+1 , templength);
				continue;
			}
			else if(i != -1 || i > j){
				temp = temp.substring(0 , j) + temp.substring(j+1 , templength);
				continue;
			}
			else if(j != -1){
				temp = temp.substring(0 , i) + temp.substring(i+1 , templength);
				continue;
			}
			else{
				printwithTime("error in title edit" + data + "\n" , '#finished_list');
				break;
			}
		}
		return temp;
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

	function db_get_rw(datab, schim, id, stri) {
		return new Promise(function (resolve, reject) {
			var request = datab.transaction(schim, "readwrite")
			.objectStore(schim)
			.get(id);
			request.onsuccess = function (event) {
				if (event.target.result == undefined||event.target.result == "") {
					resolve("");
				}
				else {
					resolve(event.target.result[stri]);
				}
			};
			request.onerror = function (event) {
				console.log("error " + event.target.errorCode + ":  db_get_rw: " + datab + "\n\n" + schim + "\n\n" + id + "\n\n" + stir + "\n\n");
				reject("error " + event.target.errorCode + ":  db_get_rw: " + datab + "\n\n" + schim + "\n\n" + id + "\n\n" + stir + "\n\n");
			};
		});
	}

	function db_put(datab, schim, array, id) {
		return new Promise(function (resolve, reject) {
			var reque = datab.transaction(schim, "readwrite");
			var reques = reque.objectStore(schim);
			var request = reques.put(array, id);
			request.onsuccess = function (event) {
				resolve("");
			};
			request.onerror = function (event) {
				console.log("error " + event.target.errorCode + ":  db_get_rw: " + datab + "\n\n" + schim + "\n\n" + id + "\n\n" + stir + "\n\n");
				reject("error " + event.target.errorCode + ":  db_get_rw: " + datab + "\n\n" + schim + "\n\n" + id + "\n\n" + stir + "\n\n");
			};
		});
	}

	function db_get_ro(datab, schim, id, stri) {
		return new Promise(function (resolve, reject) {
			var request = datab.transaction(schim, "readonly")
			.objectStore(schim)
			.get(id);
			request.onsuccess = function (event) {
				if (event.target.result == undefined||event.target.result == "") {
					resolve("");
				}
				else {
					resolve(event.target.result[stri]);
				}
			};
			request.onerror = function (event) {
				console.log("error " + event.target.errorCode + ":  db_get_ro: " + datab + "\n\n" + schim + "\n\n" + id + "\n\n" + stir + "\n\n");
				reject("error " + event.target.errorCode + ":  db_get_ro: " + datab + "\n\n" + schim + "\n\n" + id + "\n\n" + stir + "\n\n");
			};
		});
	}

	function create_opendb(dbname, version) {
		return new Promise(function (resolve, reject) {
			//maybe before success. onupgrade finish. so no need 2 resolve
			var indexedDBB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB || window.shimIndexedDB;
			var request = indexedDBB.open(dbname, version);
			var databas = "";

			request.onupgradeneeded = function (event) {
				databas = event.target.result;
				var store = databas.createObjectStore("url_array");
				store.createIndex("url_index", ["url"]);
			};
			request.onerror = function (event) {
				alert("Database error: " + event.target.errorCode);
				reject();
			};
			request.onsuccess = function (event) {
				databas = request.result;
				resolve(databas);
			};
		});
	}



})();
