/*global test, equal, module, test, ok, QUnit, _jsv, viewsAndBindings */
(function(global, $, undefined) {
"use strict";

var isIE8 = window.attachEvent && !window.addEventListener;

//var	rowPagerMap = $.views.map({
//		getTgt: function(rows, options) {
//			if (options.sortby) {
//				rows = rows.slice().sort(function(a, b) {
//					return a[options.sortby].toLowerCase().localeCompare(b[options.sortby].toLowerCase());
//				});
//			}
//			var pageLen = parseInt(options.pageLength),
//				start = parseInt(options.page) * pageLen, 
//				end = start + pageLen; 
//			return rows.slice(start, end);
//		},
//		obsSrc: function(map, ev, eventArgs) {
//			var target = map.tgt;
//			switch (eventArgs.change) {
//			case "remove":
//				var index = $.inArray(eventArgs.items[0], target);
//				if (index > -1) {
//					$.observable(target).remove(index);
//				}
//				break;
//			case "insert":
//				$.observable(target).insert(eventArgs.items);
//			}
//		}
//	});

module("jsobservable");
test("dataMap", function() {
	// =============================== Arrange ===============================
	var sortMap = $.views.map(function(rows, options) {
		rows = rows.slice(); // Copy rows, then sort if sortby is provided in options
		if (options && options.sortby) {
			rows = rows.slice().sort(function(a, b) {
				return a[options.sortby].toLowerCase().localeCompare(b[options.sortby].toLowerCase());
			});
		}
		return rows; // return copied sorted rows.
	});

	var data = {
		options: {
			sortby: "name",
			page: 1,
			pageLength: 1
		},
		cols: [
			{ 
				field: "id",
				label: "Id",
				show: true
			},
			{ 
				field: "name",
				label: "Name",
				show: true
			},
			{ 
				field: "role",
				label: "Role",
				show: false
			}
		],
		newRow: {
			name: "",
			role: ""
		},
		rows: [
			{
				id: "id1",
				name: "Jeff",
				role: "Goalie"
			},
			{
				id: "id2",
				name: "Ariel",
				role: "Consultant"
			},
			{
				id: "id3",
				name: "Pete",
				role: "Assistant"
			}
		]
	};

	function getConcatenatedFields(array, field) {
		return $.map(array, function(item) {
			return item[field];
		}).join(",");
	}

	function viewSrcTgt(map, field) {
		return getConcatenatedFields(map.src, field) + "|" + getConcatenatedFields(map.tgt, field).toUpperCase();
	}

	// ................................ Act ..................................
	var map = sortMap.map(data.rows, {sortby: "name"});

	// ............................... Assert .................................
	equal(viewSrcTgt(map, "name"), "Jeff,Ariel,Pete|ARIEL,JEFF,PETE",
		'map = sortMap.map(data.rows, {sortby: "name"}) creates a map with sorted target');

	// ............................... Assert .................................
	equal(map.options.sortby, "name",
		'map.options is the initial options passed to .map(source, options)');

	// ............................... Assert .................................
	ok(map.src === data.rows,
		'map.src is the source');

	// ................................ Act ..................................
	map.update({sortby: "role"});

	// ............................... Assert .................................
	equal(viewSrcTgt(map, "role"), "Goalie,Consultant,Assistant|ASSISTANT,CONSULTANT,GOALIE",
		'map.update({sortby: "role"}) re-sorts target');

	// ............................... Assert .................................
	equal(map.options.sortby, "role",
		'map.options is the current options - as passed to .update(options)');

	// ................................ Act ..................................
	$.observable(data.rows).insert({
		id: "new",
		name: "Mary",
		role: "Broker"
	});

	// ............................... Assert .................................
	equal(viewSrcTgt(map, "role"), "Goalie,Consultant,Assistant,Broker|ASSISTANT,CONSULTANT,GOALIE",
		'If map has no obsSrc method, target does not update observably');

	// ................................ Act ..................................
	map.update({sortby: "role"});

	// ............................... Assert .................................
	equal(viewSrcTgt(map, "role"), "Goalie,Consultant,Assistant,Broker|ASSISTANT,BROKER,CONSULTANT,GOALIE",
		'map.update({sortby: "role"}) re-sorts target based on current source');

	// ................................ Act ..................................
	var myTarget = [1,2,3],
		map2 = sortMap.map(data.rows, {sortby: "name"}, myTarget);

	// ............................... Assert .................................
	ok(map2.tgt===myTarget,
		'sortMap.map(data.rows, {sortby: "name"}, myTarget) - can provide existing target array to a new map');

	// ............................... Assert .................................
	equal(viewSrcTgt(map2, "name"), "Jeff,Ariel,Pete,Mary|ARIEL,JEFF,MARY,PETE",
		'sortMap.map(data.rows, {sortby: "name"}, myTarget) replaces contents of myTarget array with sorted copy of source array');

	// ................................ Act ..................................
	$.observable(data.rows).remove();

	// ............................... Assert .................................
	equal(viewSrcTgt(map, "role") + "/" + viewSrcTgt(map2, "name"),
		"Goalie,Consultant,Assistant|ASSISTANT,BROKER,CONSULTANT,GOALIE/Jeff,Ariel,Pete|ARIEL,JEFF,MARY,PETE",
		'If map has no obsSrc method, target does not update observably');

	map.update();

	// ............................... Assert .................................
	equal(viewSrcTgt(map, "role") + "/" + viewSrcTgt(map2, "name"),
		"Goalie,Consultant,Assistant|ASSISTANT,CONSULTANT,GOALIE/Jeff,Ariel,Pete|ARIEL,JEFF,MARY,PETE",
		'map.update() will update target to current source using current options (sortby is now "role")');

	// ............................... Assert .................................
	equal(map.options.sortby, "role",
		'map.options is still the current options - as passed previously to .map(source, options) or .update(options)');

	var tgt = map.tgt;

	// ................................ Act ..................................
	map.unmap();

	// ............................... Assert .................................
	ok(map.src === undefined, 'map.unmap() removes src');

	// ................................ Act ..................................
	map.map(data.rows, {sortby: "id"}, tgt);

	// ............................... Assert .................................
	equal(viewSrcTgt(map, "id"), "id1,id2,id3|ID1,ID2,ID3",
		'map.map(source, options, target) will remap to chosen source, options, and target');

	// ................................ Act ..................................
	map.map(data.rows, {sortby: "name"});

	after = (map.tgt === tgt);

	// ............................... Assert .................................
	equal(viewSrcTgt(map, "name") + " " + after, "Jeff,Ariel,Pete|ARIEL,JEFF,PETE true",
		'map.map(source, options) will remap to chosen source and options, and keep target');

	// ................................ Act ..................................
	var otherRows =  [
			{
				id: "idOther1",
				name: "OtherGuy",
				role: "OtherRole"
			},
			{
				id: "idOther2",
				name: "Abel",
				role: "Actor"
			}
		];
	
	tgt = map.tgt;
	
	map.map(otherRows);

	after = (tgt === map.tgt);

	// ............................... Assert .................................
	equal(viewSrcTgt(map, "name") + " " + after, "OtherGuy,Abel|ABEL,OTHERGUY true",
		'map.map(newSource) will remap new source, using current options and target');

	// ................................ Act ..................................
	map.unmap();
	map2.unmap();

	// =============================== Arrange ===============================

	var observableSortMap = $.views.map({
		baseMap: sortMap,
		obsSrc: function(map, ev, eventArgs) {
			var i, l, item, items,
				target = map.tgt;
			switch (eventArgs.change) {
			case "remove":
				items = eventArgs.items;
				for (i=0, l=items.length; i<l; i++) {
					item = items[i];
					var index = $.inArray(item, target);
					if (index > -1) {
						$.observable(target).remove(index); // Remove corresponding target. No need to resort
					}
				}
				break;
			case "insert":
				map.update(); // Need not only to insert in target, but to sort result - so simply call update
			}
		}
	});

	// ................................ Act ..................................
	map = observableSortMap.map(data.rows, {sortby: "name"});

	// ............................... Assert .................................
	equal(viewSrcTgt(map, "name"), "Jeff,Ariel,Pete|ARIEL,JEFF,PETE",
		'map = observableSortMap.map(data.rows, {sortby: "name"}) creates a map with sorted target');

	// ............................... Assert .................................
	equal(map.options.sortby, "name",
		'map.options is the initial options passed to .map(source, options)');

	// ............................... Assert .................................
	ok(map.src === data.rows,
		'map.src is the source');

	// ................................ Act ..................................
	map.update({sortby: "role"});

	// ............................... Assert .................................
	equal(viewSrcTgt(map, "role"), "Goalie,Consultant,Assistant|ASSISTANT,CONSULTANT,GOALIE",
		'map.update({sortby: "role"}) re-sorts target');

	// ............................... Assert .................................
	equal(map.options.sortby, "role",
		'map.options is the current options - as passed to .update(options)');

	// ................................ Act ..................................
	$.observable(data.rows).insert({
		id: "new",
		name: "Mary",
		role: "Broker"
	});

	// ............................... Assert .................................
	equal(viewSrcTgt(map, "role"), "Goalie,Consultant,Assistant,Broker|ASSISTANT,BROKER,CONSULTANT,GOALIE",
		'If map has an obsSrc method, observable changes to source trigger observable target updates too');

	// ................................ Act ..................................
	map.update({sortby: "role"});

	// ............................... Assert .................................
	equal(viewSrcTgt(map, "role"), "Goalie,Consultant,Assistant,Broker|ASSISTANT,BROKER,CONSULTANT,GOALIE",
		'map.update({sortby: "role"}) re-sorts target based on current source');

	// ................................ Act ..................................
	myTarget = [1,2,3];
	map2 = observableSortMap.map(data.rows, {sortby: "name"}, myTarget);

	// ............................... Assert .................................
	ok(map2.tgt===myTarget,
		'observableSortMap.map(data.rows, {sortby: "name"}, myTarget) - can provide existing target array to a new map');

	// ............................... Assert .................................
	equal(viewSrcTgt(map2, "name"), "Jeff,Ariel,Pete,Mary|ARIEL,JEFF,MARY,PETE",
		'observableSortMap.map(data.rows, {sortby: "name"}, myTarget) replaces contents of myTarget array with sorted copy of source array');

	// ................................ Act ..................................
	$.observable(data.rows).remove(2, 2);

	// ............................... Assert .................................
	equal(viewSrcTgt(map, "role") + "/" + viewSrcTgt(map2, "name"),
		"Goalie,Consultant|CONSULTANT,GOALIE/Jeff,Ariel|ARIEL,JEFF",
		'If map has an obsSrc method, observable changes to source trigger observable target updates too');

	// ................................ Act ..................................
	data.rows.splice(1, 0, {
		id: "inserted",
		name: "Amadeus",
		role: "Musician"
	});
	map.update();

	// ............................... Assert .................................
	equal(viewSrcTgt(map, "role"),
		"Goalie,Musician,Consultant|CONSULTANT,GOALIE,MUSICIAN",
		'map.update() will update target to current source using current options (sortby is now "role")');

	// ................................ Act ..................................
	var before = viewSrcTgt(map2, "name");

	map2.update();
	
	// ............................... Assert .................................
	equal(before + "/" + viewSrcTgt(map2, "name"),
		"Jeff,Amadeus,Ariel|ARIEL,JEFF/Jeff,Amadeus,Ariel|AMADEUS,ARIEL,JEFF",
		'map2.update() will update target to current source using current options (sortby is now "name")');

	// ............................... Assert .................................
	equal(map.options.sortby, "role",
		'map.options is still the current options - as passed previously to .map(source, options) or .update(options)');

	tgt = map.tgt;
	before = $._data(data.rows).events.arrayChange.length + "-" + ($._data(map.tgt).events === undefined);

	// ................................ Act ..................................
	map.unmap();

	var after = $._data(data.rows).events.arrayChange.length + "-" + ($._data(map.tgt).events === undefined);

	// ............................... Assert .................................
	ok(map.src === undefined,
		'map.unmap() removes src');

	// ............................... Assert .................................
	equal(before + "|" + after, "2-true|1-true",
		'map.unmap() removes dataMap observe bindings from src. (Note: map.tgt has no bindings since obsTgt not defined for this dataMap)');

	// ................................ Act ..................................
	map.map(data.rows, {sortby: "id"}, tgt);

	after = $._data(data.rows).events.arrayChange.length;
	
	// ............................... Assert .................................
	equal(viewSrcTgt(map, "id") + " events: " + after, "id1,inserted,id2|ID1,ID2,INSERTED events: 2",
		'map.map(source, options, target) will remap to chosen source, options, and target');

	// ................................ Act ..................................

	map.map(data.rows, {sortby: "name"});

	after = $._data(data.rows).events.arrayChange.length + "-" + (map.tgt === tgt);

	// ............................... Assert .................................
	equal(viewSrcTgt(map, "name") + " events: " + after, "Jeff,Amadeus,Ariel|AMADEUS,ARIEL,JEFF events: 2-true",
		'map.map(source, options) will remap to chosen source and options, keep target - and remove previous bindings');

	// ................................ Act ..................................
	otherRows =  [
			{
				id: "idOther1",
				name: "OtherGuy",
				role: "OtherRole"
			},
			{
				id: "idOther2",
				name: "Abel",
				role: "Actor"
			}
		];
	
	tgt = map.tgt;
	
	map.map(otherRows);

	$.observable(otherRows).insert(1, [
		{
			id: "idOther3",
			name: "Isabel",
			role: "Director"
		},
		{
			id: "idOther4",
			name: "Xavier",
			role: "Cook"
		}
	]);

	// ............................... Assert .................................
	equal(viewSrcTgt(map, "name") + " " + after, "OtherGuy,Isabel,Xavier,Abel|ABEL,ISABEL,OTHERGUY,XAVIER 2-true",
		'map.map(newSource) will remap new source, using current options and target');

	// ................................ Act ..................................
	map.unmap();
	map2.unmap();

	// =============================== Arrange ===============================

	var observableSortMap2 = $.views.map({
		baseMap: observableSortMap,
		obsTgt: function(map, ev, eventArgs) {
			var i, l, item, items,
				source = map.src;
			switch (eventArgs.change) {
			case "remove":
				items = eventArgs.items;
				for (i=0, l=items.length; i<l; i++) {
					item = items[i];
					var index = $.inArray(item, source);
					if (index > -1) {
						$.observable(source).remove(index); // Remove corresponding source. No need to resort
					}
				}
				break;
			case "insert":
				$.observable(source).insert(eventArgs.items); // Insert into source
				map.update(); // Re-sort target - by calling update
			}
		}
	});

	// ................................ Act ..................................
	map = observableSortMap2.map(data.rows, {sortby: "name"});

	// ............................... Assert .................................
	equal(viewSrcTgt(map, "name"), "Jeff,Amadeus,Ariel|AMADEUS,ARIEL,JEFF",
		'map = observableSortMap2.map(data.rows, {sortby: "name"}) with obsTgt creates a map with sorted target');

	$.observable(map.tgt).insert(1, [
		{
			id: "new",
			name: "Mary",
			role: "Broker"
		},
		{
			id: "new2",
			name: "Jane",
			role: "Fixer"
		}
	]);

	equal(viewSrcTgt(map, "name"), "Jeff,Amadeus,Ariel,Mary,Jane|AMADEUS,ARIEL,JANE,JEFF,MARY",
		'If map has an obsTgt method, observable changes to target trigger observable source updates too');

	$.observable(map.tgt).remove(1, 2);

	equal(viewSrcTgt(map, "name"), "Jeff,Amadeus,Mary|AMADEUS,JEFF,MARY",
		'If map has an obsTgt method, observable changes to target trigger observable source updates too');

	map.unmap();
});

})(this, this.jQuery);
