var grades;
var rmpLink;
var next;
var bottom;
var eCISLink;
var textbookLink;
var coursename;
var profname;
var profinit;
var uniquenum;
var profurl;
var registerlink;
var department;
var course_nbr;
var datetimearr = [];
var chart;
var description;
var status;
var semesterCode;
var isIndividual = false;
var done = true;

const days = new Map([
	["M", "Monday"],
	["T", "Tuesday"],
	["W", "Wednesday"],
	["TH", "Thursday"],
	["F", "Friday"]
]);
const fadetime = 150;
const butdelay = 75;
//This extension may be super lit, but you know what's even more lit?
//Matthew Tran's twitter and insta: @MATTHEWTRANN and @matthew.trann


if (document.querySelector('#fos_fl')) {
	let params = (new URL(document.location)).searchParams;
	let dep = params.get("fos_fl");
	let level = params.get("level");
	if (dep && level) {
		if (dep.length == 3 && (level == 'U' || level == 'L' || level == 'G')) {
			document.querySelector('#fos_fl').value = dep;
			document.querySelector('#level').value = level;
		}
	}
}
next = $("#next_nav_link");
chrome.storage.sync.get('loadAll', function (data) {
	if (data.loadAll) {
		$('[title*="next listing"]').remove();
	}
});

loadDataBase();
//make heading and modal
if (!$("#kw_results_table").length) {
	$("table thead th:last-child").after('<th scope=col>Plus</th>');
	$("table").after(`<div style="text-align:center">
							  <div class="loader" id='loader' ></div>
							  <br>
							  <h1 id="nextlabel"style="color: #800000;display:none;">Loading Courses</h1>
							  <h1 id="retrylabel"style="color: #F44336;display:none;">Failed to Load Courses</h1>
							  <br>
							  <button class=matbut id="retry" style="background: #F44336;display:none;">Retry</button>
							  </div>`);
	var modhtml = `<div class=modal id=myModal>
							<div class=modal-content>
							   <span class=close>×</span>
							   <div class=card>
									<div class=cardcontainer>
									   <h2 class=title id="title">Computer Fluency (C S 302)</h2>
									   <h2 class=profname id="profname">with Bruce Porter</h2>
									   <div id="topbuttons" class=topbuttons>
											   <button class=matbut id="rateMyProf" style="background: #4CAF50;"> RMP </button>
											   <button class=matbut id="eCIS" style="background: #CDDC39;"> eCIS </button>
											   <button class=matbut id="textbook" style="background: #FFC107;"> Textbook </button>
											   <button class=matbut id="Syllabi"> Past Syllabi </button>
											   <button class=matbut id="saveCourse" style="background: #F44336;"> Save Course +</button>
										</div>
									</div>
								</div>
								<div class=card>
									<div class=cardcontainer style="">
										<ul class=description id="description" style="list-style-type:disc"></ul>
									</div>
								</div>
								<div class=card style='text-align:center'>
									<select id="semesters" style='text-align-last:center;color:#666666;fill:#666666;'>
									</select>
									<div id="chartcontainer" class=cardcontainer>
										<div id=chart></div>
									</div>
								</div>
							</div>
						</div>`;
	$("#container").prepend(modhtml);
	$("#myModal").prepend("<div id='snackbar'>defaultmessage..</div>");
	//go through all the rows in the list
	$('table').find('tr').each(function () {
		if (!($(this).find('td').hasClass("course_header")) && $(this).has('th').length == 0) {
			//if a course row, then add the extension button
			$(this).append(`<td data-th="Plus"><input type="image" class="distButton" id="distButton" style="vertical-align: bottom; display:block;" width="20" height="20" src='${chrome.extension.getURL('images/disticon.png')}'/></td>`);
			// if ($(this).find('td[data-th="Status"]').text().includes('waitlisted')) {
			// 	$(this).find('td').each(function () {
			// 		$(this).css('background-color', '#E0E0E0');
			// 	});
			// }
		}
	});
}
//update the conflicts
update(0);
/*Handle the button clicks*/
$("tbody").on('click', '#distButton', function () {
	var row = $(this).closest('tr');
	$('.modal-content').stop().animate({
		scrollTop: 0
	}, 500);
	$(this).blur();
	getCourseInfo(row);
	getDistribution();
});

$(window).scroll(function () {
	if ($(document).height() <= $(window).scrollTop() + $(window).height() + 150) {
		loadNextPages();
	}
});

$("#myModal").on('click', '#saveCourse', function () {
	setTimeout(function () {
		saveCourse();
	}, 0);
});

$("#Syllabi").click(function () {
	setTimeout(function () {
		window.open(`https://utdirect.utexas.edu/apps/student/coursedocs/nlogon/?semester=&department=${department}&course_number=${course_nbr}&course_title=&unique=&instructor_first=&instructor_last=${profname}&course_type=In+Residence&search=Search`);
	}, butdelay);
});
$("#rateMyProf").click(function () {
	setTimeout(function () {
		window.open(rmpLink);
	}, butdelay);
});
$("#eCIS").click(function () {
	setTimeout(function () {
		window.open(eCISLink);
	}, butdelay);
});
$("#textbook").click(function () {
	setTimeout(function () {
		window.open(textbookLink);
	}, butdelay);
});
$("#semesters").on('change', function () {
	var sem = $(this).val();
	sem = sem == "Aggregate" ? undefined : sem;
	getDistribution(sem);
});

$("#retry").click(function () {
	$("#retrylabel").hide();
	$(this).hide();
	loadNextPages();
});
$(document).keydown(function (e) {
	/*Close Modal when hit escape*/
	if (e.keyCode == 27) {
		close();
	} else if (e.keyCode == 13 && $('#myModal').is(':visible')) {
		/*save course when hit enter*/
		saveCourse();
	}
});
/*Listen for update mssage coming from popup*/
chrome.runtime.onMessage.addListener(
	function (request, sender, sendResponse) {
		if (request.command == "updateCourseList") {
			update(0);
		}
	});

function loadNextPages() {
	chrome.storage.sync.get('loadAll', function (data) {
		if (data.loadAll) {
			let link = next.prop('href');
			if (done && next && link) {
				$("#nextlabel").css('display', 'inline-block');
				$('#loader').css('display', 'inline-block');
				done = false;
				$.get(link, function (response) {
					if (response) {
						var nextpage = $('<div/>').html(response).contents();
						var current = $('tbody');
						var oldlength = $('tbody tr').length;
						// console.log(oldlength);
						var last = current.find('.course_header>h2:last').text();
						// console.log(last);
						next = nextpage.find("#next_nav_link");
						done = true;
						$("#nextlabel").hide();
						$('#loader').hide();
						var newrows = [];
						nextpage.find('tbody>tr').each(function () {
							let hasCourseHead = $(this).find('td').hasClass("course_header");
							if (!(hasCourseHead && $(this).has('th').length == 0)) {
								$(this).append(`<td data-th="Plus"><input type="image" class="distButton" id="distButton" style="vertical-align: bottom; display:block;" width="20" height="20" src='${chrome.extension.getURL('images/disticon.png')}'/></td>`);
								// if ($(this).find('td[data-th="Status"]').text().includes('waitlisted')) {
								// 	$(this).find('td').each(function () {
								// 		$(this).css('background-color', '#E0E0E0');
								// 	});
								// }
							}
							if (!(hasCourseHead && last == $(this).find('td').text())) {
								newrows.push($(this));
							}
						});
						current.append(newrows);
						// console.log($('tbody tr').length + " " + $('tr>td.course_header').length);
						// update(oldlength + 1);
						update(oldlength + 1)
					}
				}).fail(function () {
					done = true;
					$("#nextlabel").hide();
					$('#loader').hide();
					$("#retrylabel").css('display', 'inline-block');
					$('#retry').css('display', 'inline-block');
				});
			}
		}
	});
}

function saveCourse() {
	var c = new Course(coursename, uniquenum, profname, datetimearr, status, profurl, registerlink);
	chrome.runtime.sendMessage({
		command: "courseStorage",
		course: c,
		action: $("#saveCourse").text().substring(0, $("#saveCourse").text().indexOf(" ")).toLowerCase()
	}, function (response) {

		$("#saveCourse").text(response.label);
		$("#snackbar").text(response.done);
		setTimeout(function () {
			$("#snackbar").attr("class", "show");
		}, 200);
		setTimeout(function () {
			$("#snackbar").attr("class", "");
		}, 3000);
		chrome.runtime.sendMessage({
			command: "updateCourseList"
		});
	});
}

/* Update the course list to show if the row contains a course that conflicts with the saved course is one of the saved courses */
function update(start) {
	chrome.storage.sync.get('courseConflictHighlight', function (data) {
		var red = 0;
		var black = 0;
		var green = 0;
		$('table').find('tr').each(function (i) {
			if (i >= start) {
				if (!($(this).find('td').hasClass("course_header")) && $(this).has('th').length == 0) {
					var thisForm = this;
					var uniquenum = $(this).find('td[data-th="Unique"]').text();
					// console.log(uniquenum);
					chrome.runtime.sendMessage({
						command: "isSingleConflict",
						dtarr: getDtarr(this),
						unique: uniquenum
					}, function (response) {
						var tds = $(thisForm).find('td');
						// console.log(tds.css('color'));
						if (response.isConflict && data.courseConflictHighlight && !response.alreadyContains) {
							if (tds.css('color') != 'rgb(244, 67, 54)') {
								console.log('made red ' + uniquenum);
								red++;
								tds.css('color', '#F44336').css('text-decoration', 'line-through').css('font-weight', 'normal');
							}
						} else if (!response.alreadyContains) {
							if (tds.css('color') != 'rgb(51, 51, 51)') {
								console.log('made black ' + uniquenum);
								black++;
								tds.css('color', 'black').css('text-decoration', 'none').css('font-weight', 'normal');
							}
						}
						if (response.alreadyContains) {
							if (tds.css('color') != 'rgb(76, 175, 80)') {
								green++;
								console.log('made green ' + uniquenum);
								tds.css('color', '#4CAF50').css('text-decoration', 'none').css('font-weight', 'bold');
							}
						}
					});
				}
			}
		});
		//console.log(`red: ${red} black: ${black} green: ${green}`);
	});
}

/* For a row, get the date-time-array for checking conflicts*/
function getDtarr(row) {
	var numlines = $(row).find('td[data-th="Days"]>span').length;
	var dtarr = [];
	for (var i = 0; i < numlines; i++) {
		var date = $(row).find('td[data-th="Days"]>span:eq(' + i + ')').text();
		var time = $(row).find('td[data-th="Hour"]>span:eq(' + i + ')').text();
		var place = $(row).find('td[data-th="Room"]>span:eq(' + i + ')').text();
		for (var j = 0; j < date.length; j++) {
			var letter = date.charAt(j);
			var day = "";
			if (letter == "T" && j < date.length - 1 && date.charAt(j + 1) == "H") {
				dtarr.push(["TH", convertTime(time), place]);
			} else {
				if (letter != "H") {
					dtarr.push([letter, convertTime(time), place]);
				}
			}
		}
	}
	return dtarr;
}

/*Course object for passing to background*/
function Course(coursename, unique, profname, datetimearr, status, link, registerlink) {
	this.coursename = coursename;
	this.unique = unique;
	this.profname = profname;
	this.datetimearr = datetimearr;
	this.status = status;
	this.link = link;
	this.registerlink = registerlink;
}

/*For a row, get all the course information and add the date-time-lines*/
function getCourseInfo(row) {
	console.log('WHAT');
	semesterCode = new URL(window.location.href).pathname.split('/')[4];
	$("h2.dateTimePlace").remove();
	$('table').find('tr').each(function () {
		if ($(this).find('td').hasClass("course_header")) {
			coursename = $(this).find('td').text() + "";
		}
		if ($(this).is(row)) {
			profurl = $(this).find('td[data-th="Unique"] a').prop('href');
			registerlink = $(this).find('td[data-th="Add"] a').prop('href');
			//	console.log(registerlink);
			uniquenum = $(this).find('td[data-th="Unique"]').text();
			status = $(this).find('td[data-th="Status"]').text();
			profname = $(this).find('td[data-th="Instructor"]').text().split(', ')[0];
			profinit = $(this).find('td[data-th="Instructor"]').text().split(', ')[1];
			if (profname.indexOf(" ") == 0) {
				profname = profname.substring(1);
			}
			var numlines = $(this).find('td[data-th="Days"]>span').length;
			datetimearr = [];
			var lines = [];
			for (var i = 0; i < numlines; i++) {
				var date = $(this).find('td[data-th="Days"]>span:eq(' + i + ')').text();
				var time = $(this).find('td[data-th="Hour"]>span:eq(' + i + ')').text();
				var place = $(this).find('td[data-th="Room"]>span:eq(' + i + ')').text();
				lines.push($(`<h2 class="dateTimePlace">${makeLine(date, time, place)}</th>`));
			}
			$("#topbuttons").before(lines);
			return false;
		}
	});
	/*Handle if on the individual course page, ie if the textbook button exists*/
	if ($("#textbook_button").length) {
		coursename = $("#details h2").text();
		var gotname = $("table").find("td[data-th='Instructor']").text();
		if (gotname != "") {
			profinit = gotname.split(", ")[1].substring(0, 1);
		} else {
			profinit = "";
		}
		profurl = document.URL;
		//	console.log(profurl);
	}
	getDescription();
	department = coursename.substring(0, coursename.search(/\d/) - 2);
	course_nbr = coursename.substring(coursename.search(/\d/), coursename.indexOf(" ", coursename.search(/\d/)));
	textbookLink = `https://www.universitycoop.com/adoption-search-results?sn=${semesterCode}__${department}__${course_nbr}__${uniquenum}`
}

/* Make the day-time-arr and make the text for the date-time-line*/
function makeLine(date, time, place) {
	var arr = [];
	var output = "";
	for (var i = 0; i < date.length; i++) {
		var letter = date.charAt(i);
		var day = "";
		if (letter == "T" && i < date.length - 1 && date.charAt(i + 1) == "H") {
			arr.push(days.get("TH"));
			datetimearr.push(["TH", convertTime(time), place]);
		} else {
			if (letter != "H") {
				arr.push(days.get(letter));
				datetimearr.push([letter, convertTime(time), place]);
			}
		}
	}
	if (arr.length > 2) {
		for (var i = 0; i < arr.length; i++) {
			if (i < arr.length - 1) {
				output += arr[i] + ", "
			}
			if (i == arr.length - 2) {
				output += "and ";
			}
			if (i == arr.length - 1) {
				output += arr[i];
			}
		}
	} else if (arr.length == 2) {
		output = arr[0] + " and " + arr[1];
	} else {
		output += arr[0];
	}
	var building = place.substring(0, place.search(/\d/) - 1);
	if (building == "") {
		building = "Undecided Location";
	}
	return `${output} at ${time.replace(/\./g, '').replace(/\-/g, ' to ')} in <a style='font-size:medium' target='_blank' href='https://maps.utexas.edu/buildings/UTM/${building}'>${building}</>`;
}

/*Convert time to 24hour format*/
function convertTime(time) {
	var converted = time.replace(/\./g, '').split("-");
	for (var i = 0; i < 2; i++) {
		converted[i] = moment(converted[i], ["h:mm A"]).format("HH:mm");
	}
	return converted;
}

/*Query the grades database*/
function getDistribution(sem) {
	var query;
	if (!sem) {
		query = "select * from agg";
	} else {
		query = "select * from grades";
	}
	query += " where dept like '%" + department + "%'";
	query += " and prof like '%" + profname.replace(/'/g, "") + "%'";
	query += " and course_nbr like '%" + course_nbr + "%'";
	if (sem) {
		query += "and sem like '%" + sem + "%'";
	}
	query += "order by a1+a2+a3+b1+b2+b3+c1+c2+c3+d1+d2+d3+f desc";
	var res = grades.exec(query)[0];
	var output = "";
	if (!sem) {
		openDialog(department, coursename, "aggregate", profname, res);
	} else {
		var data;
		if (typeof res == 'undefined' || profname == "") {
			data = [];
		} else {
			data = res.values[0];
		}
		setChart(data);
	}
}

/*Open the modal and show all the data*/
function openDialog(dep, cls, sem, professor, res) {
	$("#myModal").fadeIn(fadetime);
	//initial text on the "save course button"


	chrome.runtime.sendMessage({
		command: "alreadyContains",
		unique: uniquenum
	}, function (response) {
		if (response.alreadyContains) {
			$("#saveCourse").text("Remove Course -");
		} else {
			$("#saveCourse").text("Add Course +");
		}
	});
	//set if no grade distribution
	var data;
	$("#semesters").empty();
	if (typeof res == 'undefined' || profname == "") {
		data = [];
		$("#semesters").append("<option>No Data</option>")
	} else {
		var semesters = res.values[0][18].split(",");
		semesters.sort(function (a, b) {
			var as = a.split(' ')[0];
			var ay = parseInt(a.split(' ')[1]);
			var bs = b.split(' ')[0];
			var by = parseInt(b.split(' ')[1]);
			if (ay < by) {
				return -1;
			}
			if (ay > by) {
				return 1;
			}
			var seas = {
				"Spring": 0,
				"Fall": 1,
				"Summer": 2,
				"Winter": 3
			}
			if (seas[as] < seas[bs]) {
				return -1;
			}
			if (seas[as] > seas[bs]) {
				return 1;
			}
			return 0;
		});
		semesters.reverse().unshift('Aggregate');
		var sems = [];
		for (var i = 0; i < semesters.length; i++) {
			sems.push($(`<option value="${semesters[i]}">${semesters[i]}</option>`));
		}
		$("#semesters").append(sems);
		data = res.values[0];
	}
	var modal = document.getElementById('myModal');
	var span = document.getElementsByClassName("close")[0];
	modal.style.display = "block";

	var color = "black";
	if (status.includes("open")) {
		color = "#4CAF50";
	} else if (status.includes("waitlisted")) {
		color = "#800000"
	} else if (status.includes("closed") || status.includes("cancelled")) {
		color = "#FF5722";
	}
	$("#title").text(prettifyTitle()).append("<span style='color:" + color + ";font-size:medium;'>" + " #" + uniquenum + "</>");

	if (typeof profinit != "undefined" && profinit.length > 1) {
		profinit = profinit.substring(0, 1);
	}
	var name;
	if (profname == "") {
		name = "Undecided Professor ";
	} else {
		name = prettifyName();
	}
	$("#profname").text("with " + name);
	//close button
	span.onclick = function () {
		close();
	}
	setChart(data);
	// When clicks anywhere outside of the modal, close it
	window.onclick = function (event) {
		if (event.target == modal) {
			close();
		}
	}
}

function close() {
	$("#myModal").fadeOut(fadetime);
	$("#snackbar").attr("class", "");
}

function setChart(data) {
	//set up the chart
	chart = Highcharts.chart('chart', {
		chart: {
			type: 'column',
			backgroundColor: ' #fefefe',
			spacingLeft: 10
		},
		title: {
			text: null
		},
		subtitle: {
			text: null
		},
		legend: {
			enabled: false
		},
		xAxis: {
			title: {
				text: 'Grades'
			},
			categories: [
				'A',
				'A-',
				'B+',
				'B',
				'B-',
				'C+',
				'C',
				'C-',
				'D+',
				'D',
				'D-',
				'F'
			],
			crosshair: true
		},
		yAxis: {
			min: 0,
			title: {
				text: 'Students'
			}
		},
		credits: {
			enabled: false
		},
		lang: {
			noData: "The professor hasn't taught this class :("
		},
		tooltip: {
			headerFormat: '<span style="font-size:small; font-weight:bold">{point.key}</span><table>',
			pointFormat: '<td style="color:{black};padding:0;font-size:small; font-weight:bold;"><b>{point.y:.0f} Students</b></td>',
			footerFormat: '</table>',
			shared: true,
			useHTML: true
		},
		plotOptions: {
			bar: {
				pointPadding: 0.2,
				borderWidth: 0
			},
			series: {
				animation: {
					duration: 700
				}
			}
		},
		series: [{
			name: 'Grades',
			data: [{
				y: data[6],
				color: '#4CAF50'
			}, {
				y: data[7],
				color: '#8BC34A'
			}, {
				y: data[8],
				color: '#CDDC39'
			}, {
				y: data[9],
				color: '#FFEB3B'
			}, {
				y: data[10],
				color: '#FFC107'
			}, {
				y: data[11],
				color: '#FFA000'
			}, {
				y: data[12],
				color: '#F57C00'
			}, {
				y: data[13],
				color: '#FF5722'
			}, {
				y: data[14],
				color: '#FF5252'
			}, {
				y: data[15],
				color: '#E64A19'
			}, {
				y: data[16],
				color: '#F44336'
			}, {
				y: data[17],
				color: '#D32F2F'
			}]
		}]
	}, function (chart) { // on complete
		if (data.length == 0) {
			//if no data, then show the message and hide the series
			chart.renderer.text('Could not find data for this Instructor teaching this Course.', 100, 120)
				.css({
					fontSize: '20px',
					width: '300px',
					align: 'center',
					left: '160px'
				})
				.add();
			$.each(chart.series, function (i, ser) {
				ser.hide();
			});
		}

	});
}

/*Format the title*/
function prettifyTitle() {
	val = department.length + course_nbr.length + 3;
	output = coursename.substring(val).replace(/\b\w*/g, function (txt) {
		return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
	});
	return output + " (" + department + " " + course_nbr + ")";
}
/* Format the Professor Name */
function prettifyName() {
	var fixedprofinit = "";
	if (profinit) {
		fixedprofinit = profinit + ". ";
	}
	return fixedprofinit + profname.replace(/\w\S*/g, function (txt) {
		return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
	});
}

/*Get the course description from the profurl and highlight the important elements, as well as set the eCIS, and rmp links.*/
function getDescription() {
	// console.log(window.location.href);
	// console.log(profurl);
	console.log('hello');
	chrome.runtime.sendMessage({
		method: "GET",
		action: "xhttp",
		url: profurl,
		data: ""
	}, function (response) {
		if (response) {
			// console.log(response);
			var output = "";
			var object = $('<div/>').html(response).contents();
			object.find('#details > p').each(function () {
				var sentence = $(this).text();
				if (sentence.indexOf("Prerequisite") == 0) {
					sentence = "<li style='font-weight: bold;' class='descriptionli'>" + sentence + "</li>";
				} else if (sentence.indexOf("May be") >= 0) {
					sentence = "<li style='font-style: italic;' class='descriptionli'>" + sentence + "</li>";
				} else if (sentence.indexOf("Restricted to") == 0) {
					sentence = "<li style='color:red;' class='descriptionli'>" + sentence + "</li>";
				} else {
					sentence = "<li class='descriptionli'>" + sentence + "</li>";
				}
				output += sentence;
			});
			description = output;
			if (!description) {
				description = "<p style='color:red;font-style:bold'>You have been logged out. Please refresh the page and log back in using your UT EID and password.</p>"
			}
			$("#description").animate({
				'opacity': 0
			}, 200, function () {
				$(this).html(description).animate({
					'opacity': 1
				}, 200);
			});
			var first = object.find('td[data-th="Instructor"]').text();
			first = first.substring(first.indexOf(", "), first.indexOf(" ", first.indexOf(", ") + 2));
			first = first.substring(2);
			rmpLink = `http://www.ratemyprofessors.com/search.jsp?queryBy=teacherName&schoolName=university+of+texas+at+austin&queryoption=HEADER&query=${first} ${profname};&facetSearch=true`;
			if (profname == "") {
				eCISLink = `http://utdirect.utexas.edu/ctl/ecis/results/index.WBX?s_in_action_sw=S&s_in_search_type_sw=C&s_in_max_nbr_return=10&s_in_search_course_dept=${department}&s_in_search_course_num=${course_nbr}`;
			} else {
				eCISLink = `http://utdirect.utexas.edu/ctl/ecis/results/index.WBX?&s_in_action_sw=S&s_in_search_type_sw=N&s_in_search_name=${profname.substring(0, 1) + profname.substring(1).toLowerCase()}%2C%20${first.substring(0, 1) + first.substring(1).toLowerCase()}`;
			}
		} else {
			description = "<p style='color:red;font-style:bold'>You have been logged out. Please refresh the page and log back in using your UT EID and password.</p>"
			$("#description").animate({
				'opacity': 0
			}, 200, function () {
				$(this).html(description).animate({
					'opacity': 1
				}, 200);
			});
			rmpLink = "http://www.ratemyprofessors.com/campusRatings.jsp?sid=1255";
			eCISLink = "http://utdirect.utexas.edu/ctl/ecis/results/index.WBX?";
		}
	});
}
/* Load the database*/
function loadDataBase() {
	sql = window.SQL;
	loadBinaryFile('grades.db', function (data) {
		var sqldb = new SQL.Database(data);
		grades = sqldb;
	});
}
/* load the database from file */
function loadBinaryFile(path, success) {
	var xhr = new XMLHttpRequest();
	xhr.open("GET", chrome.extension.getURL(path), true);
	xhr.responseType = "arraybuffer";
	xhr.onload = function () {
		var data = new Uint8Array(xhr.response);
		var arr = new Array();
		for (var i = 0; i != data.length; ++i) arr[i] = String.fromCharCode(data[i]);
		success(arr.join(""));
	};
	xhr.send();
};