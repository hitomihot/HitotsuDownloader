// ==UserScript==
// @name         02
// @namespace    http://tampermonkey.net/
// @version      1
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

	class hitom_clas{
		// constructor() {}
		start(url){
			let clas = this;
			return new Promise(function (resolve, reject) {
				clas.h_set_gallery_info(url).then(function (info_array) {
					return clas.h_set_download(info_array[0], info_array[1], 100);//filename , imagearray
				}).then(function () {
					resolve();
				}).catch(function (e) {
					console.log("h_set_gallery_info: " + e + "\n------\n" + url + "\n------\n" + clas);
					reject("h_set_gallery_info: "  +e + "\n------\n" + url + "\n------\n" + clas);
				});
			});
		}

		h_set_gallery_info(fromurl) {
			let clas = this;
			let temp_id = fromurl.split("/")[4].split(".html")[0];
			return new Promise(function (resolve, reject) {
				//let tempfilename = "";
				let temp_array = [[temp_id , clas.h_find_gallery_info] , [temp_id , clas.h_get_gallery_js]];
				promis_map(temp_array, function(temp){
					return temp[1](temp[0]);
				}, temp_array.length)
					.then(function (retur_array) {
					resolve(retur_array);
				}).catch(function (e) {
					console.log("h_set_gallery_info: "  + e + "\n------\n" + fromurl + "\n\n" + clas);
					reject("h_set_gallery_info: "  + e + "\n------\n" + fromurl + "\n\n" + clas);
				});
			});
		}

		h_find_gallery_info(fromid) {
			//let clas = this; not able in promis_map
			return new Promise(function (resolve, reject) {
				let tempname = "";
				let temp_title = "";
				let temp_artist = "";
				let temp_group = "";
				promis_retry_timeout(ajax_call , 3,300001, "https://hitomi.la/galleries/" + fromid + ".html")
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
					resolve(tempname);
				}, function () {
					tempname = "N/A_N/A_" + fromid;
					resolve(tempname);
				}).catch(function (e) {
					console.log(" h_find_gallery_info: "  + e + "\n------\n" + fromid);
					reject("h_find_gallery_info: "  + e + "\n------\n" + fromid);
				});
			});
		}

		h_get_gallery_js(fromid) {
			//let clas = this; not able in promis_map
			return new Promise(function (resolve, reject) {
				let temp_array = [];
				let subDomainListlength = subDomainList.length;
				promis_retry_timeout(ajax_call , 3 , 300001 ,  "https://hitomi.la/galleries/" + fromid + ".js").then(function (data) {
					let temp_array2 = data.split("name\"\:\"");
					temp_array2.shift();
					let temp_array2length = temp_array2.length;
					let temp_3 = [];
					for(var i = 0 ; i < temp_array2length; i++){
						temp_3 = temp_array2[i].split("\"");
						temp_array[i] = [];
						temp_array[i][0] = "https://" + subDomainList[i % subDomainListlength] + ".hitomi.la/galleries/" + fromid + "/";
						temp_array[i][0] = temp_array[i][0] + temp_3[0];
						temp_array[i][1] = "https://" + subDomainList[(i+1) % subDomainListlength] + ".hitomi.la/galleries/" + fromid + "/";
						temp_array[i][1] = temp_array[i][1] + temp_3[0];
					}
					resolve(temp_array);
				}).catch(function (e) {
					console.log("h_get_gallery_js: "  + e + "\n------\n" + fromid);
					reject("h_get_gallery_js: "  + e + "\n------\n" + fromid);
				});
			});
		}

		h_set_download(filename, image_array, split_count1) {
			let clas = this;
			return new Promise(function (resolve, reject) {
				let image_arraylength = image_array.length;
				let temp_buffer = [];//per 100 image url
				let add_number = 0;//zip name + per 100 image split
				while (image_arraylength > 0) {
					temp_buffer.push(image_array.splice(0, split_count1));
					image_arraylength = image_arraylength - split_count1;
				}

				Promise.mapSeries(temp_buffer, function (image_subarray) {
					add_number = add_number + 1;
					return clas.h_request_all_image(image_subarray, new JSZip())
						.then(function (save_zip) {
						if(temp_buffer.length == 1){
							return make_savefile(save_zip, filename);
						}
						else{
							return make_savefile(save_zip, filename + "_" + add_number);
						}
						add_number = add_number + 1;
					});
				}).then(function () {
					resolve("success");
				}).catch(function (e) {
					console.log("h_set_download: " + e + "\n------\n" + filename + "\n\n" + "\n\n" + split_count1 + "\n\n" + clas);
					reject("h_set_download: " + e + "\n------\n" + filename + "\n\n" + "\n\n" + split_count1 + "\n\n" + clas);
				});
			});
		}

		h_request_all_image(fromurlarray, save_zip) {
			let progress = [];
			let fromurlarraylength = fromurlarray.length;
			for (var i = 0; i < fromurlarraylength; i++) {
				progress[i] = fromurlarray[i][0].split("/").pop();
			}
			let clas = this;
			return new Promise(function (resolve, reject) {
				promis_map(fromurlarray, function (fromurl) {
					return clas.h_request_image(fromurl).then(function (data) {
						let filename = fromurl[0].split("/").pop();
						save_image(save_zip, data, filename);
						progress.splice(progress.indexOf(fromurl[0].split("/").pop()), 1, "");
						changewithTime("remain" + progress, '#loading_list');
					}).catch(function (e) {
						console.log("h_request_all_image_inmap: "+ e + "\n------\n" + fromurlarray + "\n\n" + save_zip);
						reject("h_request_all_image: "+ e + "\n------\n" + fromurlarray + "\n\n" + save_zip);
					});
				}, 5).then(function () {
					resolve(save_zip);
				}).catch(function (e) {
					console.log("h_request_all_image: " + e + "\n------\n" +  fromurlarray + "\n\n" + save_zip);
					reject("h_request_all_image: " + e + "\n------\n" +  fromurlarray + "\n\n" + save_zip);
				});
			});
		}

		h_request_image(...args) {
			//let clas = this; not work in promis_map
			return new Promise(function (resolve, reject) {
				promis_retry_timeout(request_image, 3, 300001, ...args[0])
					.then(function (data) {
					resolve(data);
				})
					.catch(function (e) {
					console.log("_request_image: " + e + "\n------\n" +  args);
					reject("h_request_image: " + e + "\n------\n" +  args);
				});
			});
		}

	}

	class ehen_clas{
		start(url){
			let clas = this;
			return new Promise(function (resolve, reject) {
				let s = clas.e_set_gallery_info(url).then(function (info_array) {
					return clas.e_set_download(info_array[0], info_array[1], 100);//filename , imagearray
				}).then(function () {
					resolve();
				}).catch(function (e) {
					console.log("ehen_clas.start: " + e + "\n------\n" + url + "\n\n" + clas);
					reject("ehen_clas.start: " + e + "\n------\n" + url + "\n\n" + clas);
				});
			});
		}

		e_set_gallery_info(fromurl) {
			let clas = this;
			return new Promise(function (resolve, reject) {
				let tempfilename = "";
				return clas.e_find_gp0(fromurl)
					.then(function (fromurl) {
					return clas.e_find_gallery_info(fromurl);
				}).then(function (temp_array) {
					tempfilename = temp_array[0];//filename , gallery_array
					return clas.e_find_s_from_all_g(temp_array[1], clas.e_find_s_from_g);
				}).then(function (s_array) {
					resolve([tempfilename, s_array]);
				}).catch(function (e) {
					console.log("e_set_download: "  + e + "\n------\n" +  fromurl + "\n\n" + clas);
					reject("e_set_download: "  + e + "\n------\n" +  fromurl + "\n\n" + clas);
				});
			});
		}

		e_find_gp0(fromurl) {
			//find title,artist,group from e_hen or ex_hen
			let clas = this;
			return new Promise(function (resolve, reject) {
				let temp_text = fromurl.split("/");
				let g_url = "";
				if (temp_text[3] == "s") {
					let temp_gallery = temp_text[0] + "//" + temp_text[2] + "/g/";//galleryURL[0,1,2,3] need3
					let temp_id = temp_text.pop();
					temp_id = temp_id.split("-")[0];
					let temp_search_keyword = temp_gallery + temp_id + "/";//galleryURL[0,1,2,3,4] need2

					promis_retry_timeout(ajax_call , 3 , 300001 ,  fromurl).then(function (data) {
						let temp_key = textsplit(data, temp_search_keyword, "/");
						if (temp_key != "") {
							resolve(temp_search_keyword + temp_key + "/?p=0");//galleryURL[0,1,2,3,4,5,6] full_url
						}
						else {
							console.log("error " + ":   e_find_gp0: " + fromurl);
							reject("error " + ":   e_find_gp0: " + fromurl);
						}
					}).catch(function (e) {
						console.log("e_find_gp0: " + e + "\n------\n" + fromurl);
						reject("e_find_gp0: " + e + "\n------\n" + fromurl);
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
			let clas = this;
			return new Promise(function (resolve, reject) {
				let filename = "";
				promis_retry_timeout(ajax_call , 3 , 300001 ,  fromurl).then(function (data) {
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
				}).catch(function (e) {
					console.log("e_find_gallery_info: " + e + "\n------\n" + fromurl);
					reject("e_find_gallery_info: " + e + "\n------\n" + fromurl);
				});
			});
		}

		e_find_s_from_all_g(fromurlarray) {
			let clas = this;
			return new Promise(function (resolve, reject) {
				let s_array = [];
				return promis_map(fromurlarray, clas.e_find_s_from_g, 5)
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
				}).catch(function (e) {
					console.log(" e_find_s_from_all_g: " + e + "\n------\n" + fromurlarray + "\n\n" + loop_func);
					reject("e_find_s_from_all_g: " + e + "\n------\n" + fromurlarray + "\n\n" + loop_func);
				});
			});
		}

		e_find_s_from_g(fromurl) {
			let clas = this;
			return new Promise(function (resolve, reject) {
				let mainurl = fromurl.split("/");
				mainurl = mainurl[0] + "//" + mainurl[2] + "/s/";
				promis_retry_timeout(ajax_call , 3 , 300001 ,  fromurl).then(function (data) {
					let s_array = textsplit(data, "id=\"gdt\">", "class=\"c\">");
					s_array = s_array.split(mainurl);
					s_array.shift();
					let s_arraylength = s_array.length;
					for (let i = 0; i < s_arraylength; i++) {
						s_array[i] = mainurl + s_array[i].split("\"")[0];
					}
					resolve(s_array);
				}).catch(function (e) {
					console.log("e_find_s_from_g: " + e + "\n------\n" + fromurl);
					reject("e_find_s_from_g: " + e + "\n------\n" + fromurl);
				});
			});
		}

		e_set_download(filename, s_array, sync_count1) {
			let clas = this;
			return new Promise(function (resolve, reject) {
				let s_arraylength = s_array.length;
				let temp_buffer = [];
				let add_number = 0;
				while (s_arraylength > 0) {
					temp_buffer.push(s_array.splice(0, sync_count1));
					s_arraylength = s_arraylength - sync_count1;
				}
				Promise.mapSeries(temp_buffer, function (s_subarray) {
					add_number = add_number + 1;
					return clas.e_find_image_from_all_s(s_subarray , clas.e_find_image_from_s)
						.then(function (image_array) {
						return clas.e_request_all_image(image_array, new JSZip())
							.then(function (save_zip) {
							if(temp_buffer.length == 1){
								return make_savefile(save_zip, filename);
							}
							else{
								return make_savefile(save_zip, filename + "_" + add_number);
							}
						});
					});
				}).then(function () {
					resolve("success");
				}).catch(function (e) {
					console.log("e_set_download: "  + e + "\n------\n" +   filename + "\n\n" + s_array + "\n\n" + sync_count1 + "\n\n" + clas);
					reject("e_set_download: "  + e + "\n------\n" +   filename + "\n\n" + s_array + "\n\n" + sync_count1 + "\n\n" + clas);
				});
			});
		}

		e_find_image_from_all_s(fromurlarray , loop_func) {
			let clas = this;
			return new Promise(function (resolve, reject) {
				let image_array = [];
				promis_map(fromurlarray, loop_func, 5)
					.then(function (temp_array) {
					let temp_arraylength = temp_array.length;
					for (let i = 0; i < temp_arraylength; i++) {
						image_array.push(temp_array[i]);
					}
					resolve(image_array);
				}).catch(function (e) {
					console.log("e_find_image_from_all_s: " + e + "\n------\n" + fromurlarray);
					reject("e_find_image_from_all_s: " + e + "\n------\n" + fromurlarray);
				});
			});
		}

		e_find_image_from_s(fromurl) {
			//let clas = this;
			return new Promise(function (resolve, reject) {
				promis_retry_timeout(ajax_call , 3 , 300001 ,  fromurl).then(function (data) {
					let image_url = [];
					image_url[0] = textsplit(data, "id=\"img\"", "style");
					image_url[0] = textsplit(image_url[0], "src=\"", "\"");
					image_url[1] = textsplit(data, "return nl(\'", "\')\"");
					image_url[1] = fromurl + "?nl=" + image_url[1];
					resolve(image_url);//main,suburl
				}).catch(function (e) {
					console.log("e_find_image_from_s: " + e + "\n------\n" + fromurl);
					reject("e_find_image_from_s: " + e + "\n------\n" + fromurl);
				});
			});
		}

		e_request_all_image(fromurlarray, save_zip) {
			let progress = [];
			let fromurlarraylength = fromurlarray.length;
			for (var i = 0; i < fromurlarraylength; i++) {
				progress[i] = fromurlarray[i][0].split("/").pop();
			}
			let clas = this;
			return new Promise(function (resolve, reject) {
				return promis_map(fromurlarray, function (fromurl) {//why pass object?
					return clas.e_request_image(fromurl[1] , clas.e_find_image_from_s , fromurl[0]).then(function (data) {
						let filename = fromurl[0].toString().split("/").pop();
						save_image(save_zip, data, filename);
						progress.splice(progress.indexOf(filename), 1, "");
						changewithTime("remain: " + progress , '#loading_list');
					});}, 5)
					.then(function () {
					resolve(save_zip);
				}).catch(function (e) {
					console.log("e_request_all_image: " + e + "\n------\n" + fromurlarray + "\n\n" + save_zip + "\n\n");
					reject("e_request_all_image: " + e + "\n------\n" + fromurlarray + "\n\n" + save_zip + "\n\n");
				});
			});
		}

		e_request_image(suburl , subfunc , ...args) {
			//let recal = arguments.callee;
			return new Promise(function (resolve, reject) {
				promis_retry_timeout(request_image, 1, 300001, ...args)
					.then(function (data) {
					resolve(data);
				} , function(){
					console.log("call suburl: "  + "\n------\n" +  suburl);
					subfunc(suburl).then(function(url){
						resolve(e_request_image("","",url[0]));
					});

				})
					.catch(function (e) {
					console.log("_request_image: " + e + "\n------\n" +  args);
					reject("h_request_image: " + e + "\n------\n" +  args);
				});
			});
		}


	}

	class zipmember {
		constructor() {
			this.originurl = "";//for save original url
			this.mainurl = "";
			this.functio_clas = "";
		}

		get originurl() {
			return this._originurl;
		}

		get mainurl() {
			return this._mainurl;
		}

		get functio_clas() {
			return this._functio_clas;
		}

		set originurl(strin) {
			let text = strin.split("/");
			this._originurl = strin;
			this._mainurl = text[0] + "//" + text[2];
		}

		set mainurl(strin) {
			this._mainurl = this._mainurl;
		}

		set functio_clas(clas) {
			this._functio_clas = clas;
		}

		start() {
			if (this.mainurl == "https://hitomi.la") {
				this.functio_clas = new hitom_clas();
				this.functio_clas.start(this.originurl)
					.then(function () {
					completezip.push(zip.shift());
					nextstart();
					return null;
				}).catch(function (e) {
					errorzip.push(zip.shift());
					nextstart();
					console.log("zipmember.start: " + e + "\n------\n" + this.originurl);
					return null;
				});
			}

			else if (this.mainurl == "https://exhentai.org" || this.mainurl == "https://e-hentai.org") {
				this.functio_clas = new ehen_clas();
				this.functio_clas.start(this.originurl)
					.then(function () {
					completezip.push(zip.shift());
					nextstart();
					return null;
				}).catch(function (e) {
					errorzip.push(zip.shift());
					nextstart();
					console.log("zipmember.start: " + e + "\n------\n" + this.originurl);
					return null;
				});
			}
			else{
				console.log("error wrong url");
			}
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
		.catch(function (e) {
		console.log("document_ready_create_opendb: " + e + "\n------\n" + "\"url_array\"" + "\n\n" + "1");
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
		let ziplength = zip.length;
		if (ziplength == 0) {
			printwithTime("start------------" , '#finished_list');
			db_get_rw(db, "url_array", 1, "url").then(function (urls) {
				if (urls != "" || urls != undefined) {
					download_get(urls + $('#input_url').val());
					return db_put(db, "url_array", "", 1);
				}
				else {
					download_get($('#input_url').value);
				}
			}).catch(function (e) {
				console.log("#getData_clickevent: " + e + "\n------\n" + zip.length);
			});
		}
		else if(ziplength > 0){
			db_get_rw(db, "url_array", 1, "url").then(function (urls) {
				if (urls != "" || urls != undefined) {
					return db_put(db, "url_array", ursl + $('#input_url').val(), 1);
				}
				else {
					return db_put(db, "url_array", $('#input_url').val(), 1);
				}
				let inputurl = urls.split("http");
				inputurl.shift();
				let inputurllength = inputurl.length;
				for (let i = 0; i < inputurllength; i++) {
					printwithoutTime("\n"+ "http" + inputurl[i] + "\n" , '#finished_list');
				}
				printwithoutTime("added url list:" , '#finished_list');
			}).catch(function (e) {
				console.log("#getData_clickevent: " + e + "\n------\n" + zip.length);
			});
		}
		else{
			printwithTime("error:download queue's length < 0 WTF?" , '#finished_list');
		}
	});

	$('#pushurl').click(function () {
		db_get_rw(db, "url_array", 1, "url").then(function (value) {
			printwithTime("add download list" +"\n"+ window.location.href , '#finished_list');
			return db_put(db, "url_array", {url: value + window.location.href}, 1);
		}).catch(function (e) {
			console.log("#pushurl_clickevent: "+ e + "\n------\n" + db +"\n\n" +  "\"url_array\"" + "\n\n" + "1" + "\n\n" +  "url");
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
			changewithTime("ready for file download" , '#loading_list');
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
			}).catch(function (e) {
				console.log("nextstart: " + e + "\n------\n" + db +"\n\n" +  "\"url_array\"" + "\n\n" + "1" + "\n\n" +  "url");
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
				}})
				.done(function (data) {
				console.log(fromurl);
				resolve(data);
			});
		});
	}

	function promis_map(loop_array, loop_func, max_async) {
		return new Promise(function (resolve, reject) {
			Promise.map(loop_array, loop_func, {concurrency: max_async})
				.then(function (retur_array) {
				if (retur_array != "") {
					resolve(retur_array);
				}
				else {
					console.log("error " + ":  promis_map: " + loop_array + "\n\n" + loop_func + "\n\n" + max_async);
					reject("error " + ":  promis_map: " + loop_array + "\n\n" + loop_func + "\n\n" + max_async);
				}
			}).catch(function (e) {
				console.log("promis_map: " + e + "\n------\n" + loop_array + "\n\n" + loop_func + "\n\n" + max_async + "\n\n");
				reject("promis_map: " + e + "\n------\n" + loop_array + "\n\n" + loop_func + "\n\n" + max_async);
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
				console.log("error " + ":  db_get_rw: " + event.target.errorCode + datab + "\n\n" + schim + "\n\n" + id + "\n\n" + stir + "\n\n");
				reject("error " + ":  db_get_rw: " + event.target.errorCode + datab + "\n\n" + schim + "\n\n" + id + "\n\n" + stir + "\n\n");
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
				console.log("error "  + ":  db_put: " + event.target.errorCod + datab + "\n\n" + schim + "\n\n" + id + "\n\n");
				reject("error "  + ":  db_put" + event.target.errorCode + datab + "\n\n" + schim + "\n\n" + id + "\n\n");
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
				console.log("error "  + ":  db_get_ro: " + event.target.errorCode + datab + "\n\n" + schim + "\n\n" + id + "\n\n" + stir + "\n\n");
				reject("error " + ":  db_get_ro: " + event.target.errorCode + datab + "\n\n" + schim + "\n\n" + id + "\n\n" + stir + "\n\n");
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
				console.log("Database error: " + event.target.errorCode);
				reject("Database error: " + event.target.errorCode);
			};
			request.onsuccess = function (event) {
				databas = request.result;
				resolve(databas);
			};
		});
	}

	function promis_retry_timeout(func, max_try, max_time, ...args) {
		return new Promise(function (resolve, reject) {
			func(...args).timeout(max_time)
				.then(function (data) {
				if (data != "")
					resolve(data);
			} , function(){
				if (max_try > 0) {
					console.log("promis_retry_timeout: " + args + "\n\n" + max_try + "\n\n" + max_time);
					return promis_retry_timeout(func, max_try - 1, max_time, ...args)
						.then(function(data){
						resolve(data);
					});
				}
				else {
					console.log("promis_retry_timeout: " + args + "\n\n" + max_try + "\n\n" + max_time);
					reject("promis_retry_timeout: " + args + "\n\n" + max_try + "\n\n" + max_time);
				}
			})
				.catch(function (e) {
				console.log("promis_retry_timeout: " + e + "\n------\n" +  args + "\n\n" + max_try + "\n\n" + func + "\n\n");
				reject("promis_retry_timeout: " + e + "\n------\n" +  args + "\n\n" + max_try + "\n\n" + func + "\n\n");

			});
		});
	}
	function save_image(save_zip, data, filename){
		save_zip.file(filename, data, {base64: true});
	}

	function request_image(fromurl) {
		let filename = fromurl.split("/").pop();
		console.log("\n"+"try download: "+filename);
		return new Promise(function (resolve, reject) {
			var ret = GM_xmlhttpRequest({
				method: "GET",
				url: proxyurl + fromurl,
				ignoreCache: false,
				responseType: 'arraybuffer',
				redirectionLimit: 0, // this is equivalent to 'failOnRedirect: true'
				onload:function(){
					//let filename = fromurl[0].split("/").pop();
					console.log("\n"+"finishdownload: "+filename);
					resolve(this.response);
				},
				onreadystatechange: function () {
					if (this.readyState == 4) {
						if (this.status == 200 || this.status == 304) {}
						else {
							console.log("error " + ":  request_image: in " + fromurl);
							reject("error " + ":  request_image: in " + fromurl);
						}
					}
				}
			});
		});
	}

	function make_savefile(save_zip, filename) {
		return new Promise(function (resolve, reject) {
			let content = save_zip.generateAsync({type: "blob"})
			.then(function (blob) {
				saveAs(blob, filename + ".zip");
				printwithTime("finish download " + filename + ".zip" , '#finished_list');
				resolve("success");
			})
			.catch(function (e) {
				console.log(" make_savefile: " + e + "\n------\n" +save_zip + "\n\n" + filename);
				reject("make_savefile: " + e + "\n------\n" + save_zip + "\n\n" + filename);
			});
		});
	}

})();
