var map, geojson, featureOverlay, overlays, style;
var selected, features, layer_name, layerControl;
var content;
var selectedFeature;

//initializes a new map view object
var view = new ol.View({
    projection: 'EPSG:4326',
    center: [82.00, 23.00], //sets the initial center of the map view.
    zoom: 5, //sets the initial zoom level of the map view
});  
//initializes a new layer group object named base_maps
var base_maps = new ol.layer.Group({
    'title': 'Base maps',
    layers: [
        new ol.layer.Tile({
            title: 'Satellite',
            type: 'base',
            visible: true,
            source: new ol.source.XYZ({
                attributions: ['<b>Developed by<a href="https://nium.org.in/" target="_blank">NIUM</a></b>'
                ],
                attributionsCollapsible: false,
                url: 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
                maxZoom: 23
            })
        }),
        new ol.layer.Tile({
            title: 'OSM',
            type: 'base',
            visible: true,
            source: new ol.source.OSM()
        })
    ]
});
//creates a tile layer named "OSM" that fetches map tiles
var OSM = new ol.layer.Tile({
    source: new ol.source.OSM(),
    type: 'base',
    title: 'OSM',
});
//creates an empty layer group named "Overlays".
overlays = new ol.layer.Group({
    'title': 'Overlays',
    layers: []
});

var vectorSource = new ol.source.TileWMS({
    url: 'http://localhost:8082/geoserver/wms?request=getCapabilities',
    params: {'LAYERS': 'roads'}, // Replace 'your_wms_layer_name' with 'test'
    serverType: 'geoserver', // adjust this based on your WMS server type
    crossOrigin: 'anonymous'
});

vectorLayer = new ol.layer.Tile({
    source: vectorSource
});

map = new ol.Map({
    target: 'map',
    view: view,
    // controls:[],
    // overlays: [overlay]
});

map.addLayer(base_maps);
map.addLayer(overlays);

var popup = new Popup();
map.addOverlay(popup);

// ----------------------- Mouse Position -----------------------//
var mousePosition = new ol.control.MousePosition({
    className: 'mousePosition',
    projection: 'EPSG:4326',
    coordinateFormat: function(coordinate){return ol.coordinate.format(coordinate,'{y}, {x}', 4);}
});

map.addControl(mousePosition);
// -------------------------------------------------------------//
//var slider = new ol.control.ZoomSlider();
//map.addControl(slider);

var zoom_ex = new ol.control.ZoomToExtent({
    extent: [
        65.90, 7.48,
        98.96, 40.30
    ]
});
map.addControl(zoom_ex);
// --------------------------------- Start: ZOOM IN ------------------------------------//

var zoomInInteraction=new ol.interaction.DragBox();
zoomInInteraction.on ('boxend',function(){
    var zoomInExtent =zoomInInteraction.getGeometry().getExtent();
    map.getView().fit(zoomInExtent);
})

var ziButton = document.createElement('button');
ziButton.innerHTML='<img src="libs/frontend/images/zoom-in.png" alt="" style="filter:brightness(0) invert(1);"></img>'; 
ziButton.className='zoomin';
ziButton.id='ziButton';

var ziElement =document.createElement('div');
ziElement.className='ziButtonDiv';
ziElement.appendChild(ziButton);

var ziControl =new ol.control.Control({
    element:ziElement
})

var zoomInFlag =false;
ziButton.addEventListener("click",()=> {
    ziButton.classList.toggle('clicked');
    zoomInFlag =!zoomInFlag;
    if(zoomInFlag){
        document.getElementById("map").style.cursor="zoom-in";
        map.addInteraction(zoomInInteraction);
    }else{
        map.removeInteraction(zoomInInteraction);
        document.getElementById("map").style.cursor="default";
    }
})

map.addControl(ziControl);

// --------------------------------- end: ZOOM IN ------------------------------------//

var scale_line = new ol.control.ScaleLine({
    units: 'metric',
    bar: true,
    steps: 6,
    text: true,
    minWidth: 140,
    target: 'scale_bar'
});
map.addControl(scale_line);

layerSwitcher = new ol.control.LayerSwitcher({
    activationMode: 'click',
    startActive: true,
    tipLabel: 'Layers', // Optional label for button
    groupSelectStyle: 'children', // Can be 'children' [default], 'group' or 'none'
    collapseTipLabel: 'Collapse layers',
});
map.addControl(layerSwitcher);

layerSwitcher.renderPanel();

var geocoder = new Geocoder('nominatim', {
    provider: 'osm',
    lang: 'en',
    placeholder: 'Search for ...',
    limit: 5,
    debug: false,
    autoComplete: true,
    keepOpen: true
});
map.addControl(geocoder);

geocoder.on('addresschosen', function(evt) {
    if (popup) {
        popup.hide();
    }
    window.setTimeout(function() {
        popup.show(evt.coordinate, evt.address.formatted);
    }, 3000);
});

//dynamically generates a legend for the layers in the overlays layer group
function legend() {
//clears any existing content on legend
    $('#legend').empty();
    var no_layers = overlays.getLayers().get('length');
    var head = document.createElement("h8");
    var element = document.getElementById("legend");
    element.appendChild(head);
    overlays.getLayers().getArray().slice().forEach(layer => {
        var head = document.createElement("p");
        var txt = document.createTextNode(layer.get('title'));
        head.appendChild(txt);
        var element = document.getElementById("legend");
        element.appendChild(head);
        var img = new Image();
        img.src = "http://localhost:8082/geoserver/wms?REQUEST=GetLegendGraphic&VERSION=1.0.0&FORMAT=image/png&WIDTH=20&HEIGHT=20&LAYER=" + layer.get('title');
        var src = document.getElementById("legend");
        src.appendChild(img);

    });



}

legend();

// layer dropdown query
$(document).ready(function() {
    $.ajax({
        type: "GET",
        url: "http://localhost:8082/geoserver/wfs?request=getCapabilities",
        dataType: "xml",
        success: function(xml) {
            var select = $('#layer');
            $(xml).find('FeatureType').each(function() {
                //var title = $(this).find('ows:Operation').attr('name');
                //alert(title);
                var name = $(this).find('Name').text();
                //select.append("<option/><option class='ddheader' value='"+ name +"'>"+title+"</option>");
                $(this).find('Name').each(function() {
                    var value = $(this).text();
                    select.append("<option class='ddindent' value='" + value + "'>" + value + "</option>");
                });
            });
            //select.children(":first").text("please make a selection").attr("selected",true);
        }
    });
});

// attribute dropdown		
$(function() {
    $("#layer").change(function() {

        var attributes = document.getElementById("attributes");
        var length = attributes.options.length;
        for (i = length - 1; i >= 0; i--) {
            attributes.options[i] = null;
        }

        var value_layer = $(this).val();


        attributes.options[0] = new Option('Select attributes', "");
        //  alert(url);

        $(document).ready(function() {
            $.ajax({
                type: "GET",
                url: "http://localhost:8082/geoserver/wfs?service=WFS&request=DescribeFeatureType&version=1.1.0&typeName=" + value_layer,
                dataType: "xml",
                success: function(xml) {

                    var select = $('#attributes');
                    //var title = $(xml).find('xsd\\:complexType').attr('name');
                    //	alert(title);
                    $(xml).find('xsd\\:sequence').each(function() {

                        $(this).find('xsd\\:element').each(function() {
                            var value = $(this).attr('name');
                            //alert(value);
                            var type = $(this).attr('type');
                            //alert(type);
                            if (value != 'geom' && value != 'the_geom') {
                                select.append("<option class='ddindent' value='" + type + "'>" + value + "</option>");
                            }
                        });

                    });
                }
            });
        });
    });
});

// operator combo
$(function() {
    $("#attributes").change(function() {

        var operator = document.getElementById("operator");
        var length = operator.options.length;
        for (i = length - 1; i >= 0; i--) {
            operator.options[i] = null;
        }

        var value_type = $(this).val();
        // alert(value_type);
        var value_attribute = $('#attributes option:selected').text();
        operator.options[0] = new Option('Select operator', "");

        if (value_type == 'xsd:short' || value_type == 'xsd:int' || value_type == 'xsd:double' || value_type == 'xsd:long') {
            var operator1 = document.getElementById("operator");
            operator1.options[1] = new Option('Greater than', '>');
            operator1.options[2] = new Option('Less than', '<');
            operator1.options[3] = new Option('Equal to', '=');
            operator1.options[4] = new Option('Between', 'BETWEEN');
        } else if (value_type == 'xsd:string') {
            var operator1 = document.getElementById("operator");
            operator1.options[1] = new Option('Like', 'ILike');

        }

    });
});



// layer dropdown draw query
$(document).ready(function() {
    $.ajax({
        type: "GET",
        url: "http://localhost:8082/geoserver/wfs?request=getCapabilities",
        dataType: "xml",
        success: function(xml) {
            var select = $('#layer1');
            $(xml).find('FeatureType').each(function() {
                
                //var title = $(this).find('ows:Operation').attr('name');
                //alert(title);
                var name = $(this).find('Name').text();
                //select.append("<option/><option class='ddheader' value='"+ name +"'>"+title+"</option>");
                $(this).find('Name').each(function() {
                    var value = $(this).text();
                    select.append("<option class='ddindent' value='" + value + "'>" + value + "</option>");
                });
            });
            //select.children(":first").text("please make a selection").attr("selected",true);
        }
    });
});


var highlightStyle = new ol.style.Style({
    fill: new ol.style.Fill({
        color: 'rgba(255,0,0,0.3)',
    }),
    stroke: new ol.style.Stroke({
        color: '#3399CC',
        width: 3,
    }),
    image: new ol.style.Circle({
        radius: 10,
        fill: new ol.style.Fill({
            color: '#3399CC'
        })
    })
});

// function for finding row in the table when feature selected on map
function findRowNumber(cn1, v1) {

    var table = document.querySelector('#table');
    var rows = table.querySelectorAll("tr");
    var msg = "No such row exist"
    for (i = 1; i < rows.length; i++) {
        var tableData = rows[i].querySelectorAll("td");
        if (tableData[cn1 - 1].textContent == v1) {
            msg = i;
            break;
        }
    }
    return msg;
}



// function for loading query

function query() {
    if (vector1) {
        vector1.getSource().clear();
		// $('#table').empty();
    }

    $('#table').empty();
    if (geojson) {
        map.removeLayer(geojson);

    }
     document.getElementById('map').style.height = '100%';
    document.getElementById('table_data').style.height = '0%';
    map.updateSize();
    if (selectedFeature) {
        selectedFeature.setStyle();
        selectedFeature = undefined;
    }
	

    //alert('jsbchdb');	 
    var layer = document.getElementById("layer");
    var value_layer = layer.options[layer.selectedIndex].value;
    //alert(value_layer);

    var attribute = document.getElementById("attributes");
    var value_attribute = attribute.options[attribute.selectedIndex].text;
    //alert(value_attribute);

    var operator = document.getElementById("operator");
    var value_operator = operator.options[operator.selectedIndex].value;
    //alert(value_operator);

    var txt = document.getElementById("value");
    var value_txt = txt.value;

    if (value_operator == 'ILike') {
        value_txt = "'" + value_txt + "%25'";
        //alert(value_txt);
        //value_attribute = 'strToLowerCase('+value_attribute+')';
    } else {
        value_txt = value_txt;
        //value_attribute = value_attribute;
    }
    //alert(value_txt);
    var url = "http://localhost:8082/geoserver/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=" + value_layer + "&CQL_FILTER=" + value_attribute + "%20" + value_operator + "%20" + value_txt + "&outputFormat=application/json"
    //console.log(url);
    style = new ol.style.Style({
        fill: new ol.style.Fill({
            color: 'rgba(255, 255, 255, 0.2)'
        }),
        stroke: new ol.style.Stroke({
            color: '#ffcc33',
            width: 3
        }),

        image: new ol.style.Circle({
            radius: 7,
            fill: new ol.style.Fill({
                color: '#ffcc33'
            })
        })
    });
    geojson = new ol.layer.Vector({
        source: new ol.source.Vector({
            url: url,
            format: new ol.format.GeoJSON()
        }),
        style: style,

    });

    geojson.getSource().on('addfeature', function() {
        //alert(geojson.getSource().getExtent());
        map.getView().fit(
            geojson.getSource().getExtent(), {
                duration: 1590,
                size: map.getSize()
            }
        );
    });

    //overlays.getLayers().push(geojson);
    map.addLayer(geojson);

    $.getJSON(url, function(data) {


        var col = [];
        col.push('id');
        for (var i = 0; i < data.features.length; i++) {

            for (var key in data.features[i].properties) {

                if (col.indexOf(key) === -1) {
                    col.push(key);
                }
            }
        }

        var table = document.createElement("table");
        table.setAttribute("class", "table table-hover table-striped");
        table.setAttribute("id", "table");

        var caption = document.createElement("caption");
        caption.setAttribute("id", "caption");
        caption.style.captionSide = 'top';
        caption.innerHTML = value_layer + " (Number of Features : " + data.features.length + " )";
        table.appendChild(caption);

        // CREATE HTML TABLE HEADER ROW USING THE EXTRACTED HEADERS ABOVE.

        var tr = table.insertRow(-1); // TABLE ROW.

        for (var i = 0; i < col.length; i++) {
            var th = document.createElement("th"); // TABLE HEADER.
            th.innerHTML = col[i];
            tr.appendChild(th);
        }

        // ADD JSON DATA TO THE TABLE AS ROWS.
        for (var i = 0; i < data.features.length; i++) {

            tr = table.insertRow(-1);

            for (var j = 0; j < col.length; j++) {
                var tabCell = tr.insertCell(-1);
                if (j == 0) {
                    tabCell.innerHTML = data.features[i]['id'];
                } else {
                    //alert(data.features[i]['id']);
                    tabCell.innerHTML = data.features[i].properties[col[j]];
                    //alert(tabCell.innerHTML);
                }
            }
        }

        // FINALLY ADD THE NEWLY CREATED TABLE WITH JSON DATA TO A CONTAINER.
        var divContainer = document.getElementById("table_data");
        divContainer.innerHTML = "";
        divContainer.appendChild(table);
        document.getElementById('map').style.height = '71%';
        document.getElementById('table_data').style.height = '29%';
        map.updateSize();
        addRowHandlers();

    });
    map.on('singleclick', highlight);

}

// Add event listener to the export button
document.getElementById("exportButton").addEventListener("click", function() {
    // Convert table to Excel worksheet
    var sheet = XLSX.utils.table_to_sheet(table);
  
    // Create workbook and add the worksheet
    var wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, sheet, "Sheet 1");
  
    // Convert workbook to Excel binary format
    var wbout = XLSX.write(wb, { bookType: "xlsx", type: "binary" });
  
    // Save the workbook as a file
    saveAs(new Blob([s2ab(wbout)], { type: "application/octet-stream" }), "data.xlsx");
  });


  // Function to convert string to ArrayBuffer
  function s2ab(s) {
    var buf = new ArrayBuffer(s.length);
    var view = new Uint8Array(buf);
    for (var i = 0; i < s.length; i++) view[i] = s.charCodeAt(i) & 0xff;
    return buf;
  }

// highlight the feature on map and table on map click
function highlight(evt) {

    if (selectedFeature) {
        selectedFeature.setStyle();
        selectedFeature = undefined;
    }

    var feature = map.forEachFeatureAtPixel(evt.pixel,
        function(feature, layer) {
            return feature;
        });

    if (feature && feature.getId() != undefined) {


        var geometry = feature.getGeometry();
        var coord = geometry.getCoordinates();
        var coordinate = evt.coordinate;
        //alert(feature.get('gid'));
        // alert(coordinate);
        /*var content1 = '<h3>' + feature.get([name]) + '</h3>';
        content1 += '<h5>' + feature.get('crop')+' '+ value_param +' '+ value_seas+' '+value_level+'</h5>'
		content1 += '<h5>' + feature.get([value_param]) +' '+ unit +'</h5>';
       // alert(content1);
        content.innerHTML = content1;
        overlay.setPosition(coordinate);*/

        // console.info(feature.getProperties());

        $(function() {
            $("#table td").each(function() {
                $(this).parent("tr").css("background-color", "white");
            });
        });
        feature.setStyle(highlightStyle);
        selectedFeature = feature;
        var table = document.getElementById('table');
        var cells = table.getElementsByTagName('td');
        var rows = document.getElementById("table").rows;
        var heads = table.getElementsByTagName('th');
        var col_no;
        for (var i = 0; i < heads.length; i++) {
            // Take each cell
            var head = heads[i];
            //alert(head.innerHTML);
            if (head.innerHTML == 'id') {
                col_no = i + 1;
                //alert(col_no);
            }

        }
        var row_no = findRowNumber(col_no, feature.getId());
        //alert(row_no);

        var rows = document.querySelectorAll('#table tr');

        rows[row_no].scrollIntoView({
            behavior: 'smooth',
            block: 'center'
        });

        $(document).ready(function() {
            $("#table td:nth-child(" + col_no + ")").each(function() {

                if ($(this).text() == feature.getId()) {
                    $(this).parent("tr").css("background-color", "grey");

                }
            });
        });
    } else {
        $(function() {
            $("#table td").each(function() {
                $(this).parent("tr").css("background-color", "white");
            });
        });

    }

};

// highlight the feature on map and table on row select in table
function addRowHandlers() {
    var rows = document.getElementById("table").rows;
    var heads = table.getElementsByTagName('th');
    var col_no;
    for (var i = 0; i < heads.length; i++) {
        // Take each cell
        var head = heads[i];
        //alert(head.innerHTML);
        if (head.innerHTML == 'id') {
            col_no = i + 1;
            //alert(col_no);
        }

    }
    for (i = 0; i < rows.length; i++) {



        rows[i].onclick = function() {
            return function() {
                if (selectedFeature) {
                    selectedFeature.setStyle();
                    selectedFeature = undefined;
                }
                $(function() {
                    $("#table td").each(function() {
                        $(this).parent("tr").css("background-color", "white");
                    });
                });
                var cell = this.cells[col_no - 1];
                var id = cell.innerHTML;


                $(document).ready(function() {
                    $("#table td:nth-child(" + col_no + ")").each(function() {
                        if ($(this).text() == id) {
                            $(this).parent("tr").css("background-color", "grey");
                        }
                    });
                });

                var features = geojson.getSource().getFeatures();

                for (i = 0; i < features.length; i++) {



                    if (features[i].getId() == id) {
                        //alert(features[i].feature.id);
                        features[i].setStyle(highlightStyle);
                        selectedFeature = features[i];
                        var featureExtent = features[i].getGeometry().getExtent();
                        if (featureExtent) {
                            map.getView().fit(featureExtent, {
                                duration: 1590,
                                size: map.getSize()
                            });
                        }

                    }
                }

                //alert("id:" + id);
            };
        }(rows[i]);
    }
}

//list of wms_layers_ in window on click of button

function wms_layers() {

    $(function() {

        $("#wms_layers_window").modal({
            backdrop: false
        });
        $("#wms_layers_window").draggable();
        $("#wms_layers_window").modal('show');

    });

    $(document).ready(function() {
        $.ajax({
            type: "GET",
            url: "http://localhost:8082/geoserver/wms?request=getCapabilities",
            dataType: "xml",
            success: function(xml) {
                $('#table_wms_layers').empty();
                // console.log("here");
                $('<tr></tr>').html('<th>Name</th><th>Title</th><th>Abstract</th>').appendTo('#table_wms_layers');
                $(xml).find('Layer').find('Layer').each(function() {
                    var name = $(this).children('Name').text();
                    // alert(name);
                    //var name1 = name.find('Name').text();
                    //alert(name);
                    var title = $(this).children('Title').text();

                    var abst = $(this).children('Abstract').text();
                    //   alert(abst);


                    //   alert('test');
                    $('<tr></tr>').html('<td>' + name + '</td><td>' + title + '</td><td>' + abst + '</td>').appendTo('#table_wms_layers');
                    document.getElementById("table_wms_layers").setAttribute("class", "table-success");

                });
                addRowHandlers1();
            }
        });
    });


    function addRowHandlers1() {
        //alert('knd');
        var rows = document.getElementById("table_wms_layers").rows;
        var table = document.getElementById('table_wms_layers');
        var heads = table.getElementsByTagName('th');
        var col_no;
        for (var i = 0; i < heads.length; i++) {
            // Take each cell
            var head = heads[i];
            //alert(head.innerHTML);
            if (head.innerHTML == 'Name') {
                col_no = i + 1;
                //alert(col_no);
            }

        }
        for (i = 0; i < rows.length; i++) {

            rows[i].onclick = function() {
                return function() {

                    $(function() {
                        $("#table_wms_layers td").each(function() {
                            $(this).parent("tr").css("background-color", "white");
                        });
                    });
                    var cell = this.cells[col_no - 1];
                    layer_name = cell.innerHTML;
                    // alert(layer_name);

                    $(document).ready(function() {
                        $("#table_wms_layers td:nth-child(" + col_no + ")").each(function() {
                            if ($(this).text() == layer_name) {
                                $(this).parent("tr").css("background-color", "grey");



                            }
                        });
                    });

                    //alert("id:" + id);
                };
            }(rows[i]);
        }

    }

}
// add wms layer to map on click of button
function add_layer() {
    //	alert("jd"); 

    // alert(layer_name);
    //map.removeControl(layerSwitcher);

    var name = layer_name.split(":");
    //alert(layer_name);
    var layer_wms = new ol.layer.Image({
        title: layer_name,
        // extent: [-180, -90, -180, 90],
        source: new ol.source.ImageWMS({
            url: 'http://localhost:8082/geoserver/wms',
            params: {
                'LAYERS': layer_name
            },
            ratio: 1,
            serverType: 'geoserver',
            crossOrigin: 'anonymous',
        })
    });
    overlays.getLayers().push(layer_wms);

    var url = 'http://localhost:8082/geoserver/wms?request=getCapabilities';
    var parser = new ol.format.WMSCapabilities();


    $.ajax(url).then(function(response) {
        //window.alert("word");
        var result = parser.read(response);
        // console.log(result);
        // window.alert(result);
        var Layers = result.Capability.Layer.Layer;
        var extent;
        for (var i = 0, len = Layers.length; i < len; i++) {

            var layerobj = Layers[i];
            //  window.alert(layerobj.Name);

            if (layerobj.Name == layer_name) {
                extent = layerobj.BoundingBox[0].extent;
                //alert(extent);
                map.getView().fit(
                    extent, {
                        duration: 1590,
                        size: map.getSize()
                    }
                );

            }
        }
    });


    layerSwitcher.renderPanel();
    legend();

}

function close_wms_window() {
    layer_name = undefined;
}
// function on click of getinfo

    


// getinfo function
function getinfo(evt) {

    var coordinate = evt.coordinate;
    var viewResolution = /** @type {number} */ (view.getResolution());


    if (popup) {
        popup.hide();
    }
    if (content) {
        content = '';
    }
    overlays.getLayers().getArray().slice().forEach(layer => {
        var visibility = layer.getVisible();
        console.log(visibility);
        if (visibility == true) {

            var layer_title = layer.get('title');
            var wmsSource = new ol.source.ImageWMS({
                url: 'http://localhost:8082/geoserver/wms',
                params: {
                    'LAYERS': layer_title
                },
                serverType: 'geoserver',
                crossOrigin: 'anonymous'
            });

            var url = wmsSource.getFeatureInfoUrl(
                evt.coordinate, viewResolution, 'EPSG:4326', {
                    'INFO_FORMAT': 'text/html'
                });
            // alert(url[i]);
            //console.log(url);

            //assuming you use jquery
            $.get(url, function(data) {

                // $("#popup-content").append(data);
                //document.getElementById('popup-content').innerHTML = '<p>Feature Info</p><code>' + data + '</code>';
                content += data;
                // overlay.setPosition(coordinate);
                popup.show(evt.coordinate, content);


            });
        }

    });

}



// clear function
function clear_all() {
    if (vector1) {
        vector1.getSource().clear();
    }

    if (draw1) {
        map.removeInteraction(draw1);
    }
    document.getElementById('map').style.height = '100%';
    document.getElementById('table_data').style.height = '0%';
    map.updateSize();
    $('#table').empty();
    $('#legend').empty();
    if (geojson) {
        geojson.getSource().clear();
        map.removeLayer(geojson);
    }

    if (selectedFeature) {
        selectedFeature.setStyle();
        selectedFeature = undefined;
    }
    if (popup) {
        popup.hide();
    }
    map.getView().fit([59.52197265625, 6.1689453125, 104.47802734375, 39.8310546875], {
        duration: 1590,
        size: map.getSize()
    });
  /*  document.getElementById("clear_all").innerHTML = "Clear";
    document.getElementById("clear_all").setAttribute("class", "btn ");
    
    document.getElementById("info_btn").innerHTML = "Info";
    document.getElementById("info_btn").setAttribute("class", "btn ");

    document.getElementById("layers_info").innerHTML = "Layers";
    document.getElementById("layers_info").setAttribute("class", "btn ");

    document.getElementById("query_panel_btn").innerHTML = "Query";
    document.getElementById("query_panel_btn").setAttribute("class", "btn "); */

    document.getElementById("query_tab").style.width = "0%";
    document.getElementById("map").style.width = "100%";
    document.getElementById("map").style.left = "0%";
    document.getElementById("query_tab").style.visibility = "hidden";
    document.getElementById('table_data').style.left = '0%';

    document.getElementById("legend_btn").innerHTML = "☰ Show Legend";
    document.getElementById("legend").style.width = "0%";
    document.getElementById("legend").style.visibility = "hidden";
    document.getElementById('legend').style.height = '0%';

    map.un('singleclick', getinfo);
    map.un('singleclick', highlight);
    document.getElementById("info_btn").innerHTML = "Info";
    document.getElementById("info_btn").setAttribute("class", "btn ");
    map.updateSize();




    overlays.getLayers().getArray().slice().forEach(layer => {

        overlays.getLayers().remove(layer);

    });

    layerSwitcher.renderPanel();

    if (draw) {
        map.removeInteraction(draw)
    };
    if (vectorLayer) {
        vectorLayer.getSource().clear();
    }
    map.removeOverlay(helpTooltip);

    if (measureTooltipElement) {
        var elem = document.getElementsByClassName("tooltip tooltip-static");
        for (var i = elem.length - 1; i >= 0; i--) {
            elem[i].remove();
        }
    }



}
function show_hide_info() {
    var infoBtn = document.getElementById("info_btn");

    if (document.getElementById("info_btn").style.visibility == "hidden") {
        
        document.getElementById("info_panel_btn").innerHTML = "Info";
      
        document.getElementById("info_btn").style.visibility = "visible";
        document.getElementById("info_btn").style.top = "10%";
        document.getElementById("info_btn").style.width = "auto";
        document.getElementById("info_btn").style.height = "auto";
        document.getElementById("info_btn").style.left = "32%";
        infoBtn.classList.add("small-btn");
        document.getElementById("map").style.width = "100%";
        document.getElementById("map").style.left = "0%";
        document.getElementById('table_data').style.left = '25%';
        map.updateSize();
    } else {
        infoBtn.innerHTML = "Show Info";
        document.getElementById("info_btn").style.width = "0%";
        document.getElementById("info_btn").style.visibility = "hidden";
        document.getElementById("info_btn").style.left = "19%";
        document.getElementById("info_btn").style.top = "30%";
        document.getElementById("map").style.width = "200%";
        document.getElementById("map").style.left = "0%";
        document.getElementById('table_data').style.left = '25%';
        map.updateSize();
    }
}



function show_hide_querypanel() {
 

    var queryTab = document.getElementById("query_tab");
    $("#query_tab").draggable();

    if (document.getElementById("query_tab").style.visibility == "hidden") {

        document.getElementById("query_panel_btn").innerHTML = "Query";
        // document.getElementById("query_panel_btn").setAttribute("class", "btn ");
        document.getElementById("query_panel_btn").classList.add("small-btn");
        document.getElementById("query_tab").style.visibility = "visible";
        document.getElementById("query_tab").style.top = "10%";
        document.getElementById("query_tab").style.width = "auto";
        document.getElementById("query_tab").style.height = "auto";
        document.getElementById("query_tab").style.left = "32%";
        queryTab.style.backgroundColor = "white";
        document.getElementById("map").style.width = "100%";
        document.getElementById("map").style.left = "0%";

        document.getElementById('table_data').style.left = '25%';
        map.updateSize();
    } 
    else {
        document.getElementById("query_panel_btn").innerHTML = "Query";
        document.getElementById("query_tab").style.width = "0%";
        queryTab.style.backgroundColor = "";
        queryTab.style.border = "";
        document.getElementById("query_tab").style.left = "19%";
        document.getElementById("query_tab").style.top = "30%";
        document.getElementById("map").style.width = "100%";
        document.getElementById("map").style.left = "0%";
        document.getElementById("query_tab").style.visibility = "hidden";
        document.getElementById('table_data').style.left = '25%';

        map.updateSize();
    }
}

function show_hide_legend() {

    if (document.getElementById("legend").style.visibility == "hidden") {

        document.getElementById("legend_btn").innerHTML = "☰ Hide Legend";
		document.getElementById("legend_btn").setAttribute("class", "btn ");

        document.getElementById("legend").style.visibility = "visible";
        document.getElementById("legend").style.width = "15%";

        document.getElementById('legend').style.height = '38%';
        map.updateSize();
    } else {
	    document.getElementById("legend_btn").setAttribute("class", "btn ");
        document.getElementById("legend_btn").innerHTML = "☰ Show Legend";
        document.getElementById("legend").style.width = "0%";
        document.getElementById("legend").style.visibility = "hidden";
        document.getElementById('legend').style.height = '0%';

        map.updateSize();
    }
}



draw_type.onchange = function() {

    map.removeInteraction(draw1);

    if (draw) {
        map.removeInteraction(draw);
        map.removeOverlay(helpTooltip);
        map.removeOverlay(measureTooltip);
    }
    if (vectorLayer) {
        vectorLayer.getSource().clear();
    }
    if (vector1) {
        vector1.getSource().clear();
		// $('#table').empty();
    }
	

    if (measureTooltipElement) {
        var elem = document.getElementsByClassName("tooltip tooltip-static");
        //$('#measure_tool').empty(); 

        //alert(elem.length);
        for (var i = elem.length - 1; i >= 0; i--) {

            elem[i].remove();
            //alert(elem[i].innerHTML);
        }
    }

    add_draw_Interaction();
};

var source1 = new ol.source.Vector({
    wrapX: false
});

var vector1 = new ol.layer.Vector({
    source: source1
});
map.addLayer(vector1);

var draw1;



// measure Tool
function add_draw_Interaction() {
    var value = draw_type.value;
    //alert(value);
    if (value !== 'None') {
        var geometryFunction;
        if (value === 'Square') {
            value = 'Circle';
            geometryFunction = new ol.interaction.Draw.createRegularPolygon(4);

        } else if (value === 'Box') {
            value = 'Circle';

            geometryFunction = new ol.interaction.Draw.createBox();

        } else if (value === 'Star') {
            value = 'Circle';
            geometryFunction = function(coordinates, geometry) {
                //alert(value);
                var center = coordinates[0];
                var last = coordinates[1];
                var dx = center[0] - last[0];
                var dy = center[1] - last[1];
                var radius = Math.sqrt(dx * dx + dy * dy);
                var rotation = Math.atan2(dy, dx);
                var newCoordinates = [];
                var numPoints = 12;
                for (var i = 0; i < numPoints; ++i) {
                    var angle = rotation + i * 2 * Math.PI / numPoints;
                    var fraction = i % 2 === 0 ? 1 : 0.5;
                    var offsetX = radius * fraction * Math.cos(angle);
                    var offsetY = radius * fraction * Math.sin(angle);
                    newCoordinates.push([center[0] + offsetX, center[1] + offsetY]);
                }
                newCoordinates.push(newCoordinates[0].slice());
                if (!geometry) {
                    geometry = new ol.geom.Polygon([newCoordinates]);
                } else {
                    geometry.setCoordinates([newCoordinates]);
                }
                return geometry;
            };
        }
        
        // map.addInteraction(draw1);

        if (draw_type.value == 'select' || draw_type.value == 'clear') {

            if(draw1){map.removeInteraction(draw1);}
            vector1.getSource().clear();
            if (geojson) {
                geojson.getSource().clear();
                map.removeLayer(geojson);
            }

        } else if (draw_type.value == 'Square' || draw_type.value == 'Polygon' || draw_type.value == 'Circle' || draw_type.value == 'Star' || draw_type.value == 'Box')

        {
		draw1 = new ol.interaction.Draw({
            source: source1,
            type: value,
            geometryFunction: geometryFunction
        });

            map.addInteraction(draw1);

            draw1.on('drawstart', function(evt) {
                if (vector1) {
                    vector1.getSource().clear();
                }
                if (geojson) {
                    geojson.getSource().clear();
                    map.removeLayer(geojson);
                }

                //alert('bc');

            });

            draw1.on('drawend', function(evt) {
                var feature = evt.feature;

                var coords = feature.getGeometry();
                //console.log(coords);
                var format = new ol.format.WKT();
                var wkt = format.writeGeometry(coords);

                var layer_name = document.getElementById("layer1");
                var value_layer = layer_name.options[layer_name.selectedIndex].value;

                var url = "http://localhost:8082/geoserver/wfs?request=GetFeature&version=1.0.0&typeName=" + value_layer + "&outputFormat=json&cql_filter=INTERSECTS(the_geom," + wkt + ")";
                //alert(url);


                style = new ol.style.Style({
                    fill: new ol.style.Fill({
                        color: 'rgba(255, 255, 255, 0.2)'
                    }),
                    stroke: new ol.style.Stroke({
                        color: '#ffcc33',
                        width: 3
                    }),

                    image: new ol.style.Circle({
                        radius: 7,
                        fill: new ol.style.Fill({
                            color: '#ffcc33'
                        })
                    })
                });

                geojson = new ol.layer.Vector({
                    //title:'dfdfd',
                    //title: '<h5>' + value_crop+' '+ value_param +' '+ value_seas+' '+value_level+'</h5>',
                    source: new ol.source.Vector({
                        url: url,
                        format: new ol.format.GeoJSON()
                    }),
                    style: style,

                });

                geojson.getSource().on('addfeature', function() {
                    //alert(geojson.getSource().getExtent());
                    map.getView().fit(
                        geojson.getSource().getExtent(), {
                            duration: 1590,
                            size: map.getSize()
                        }
                    );
                });

                //overlays.getLayers().push(geojson);
                map.addLayer(geojson);
                map.removeInteraction(draw1);
                $.getJSON(url, function(data) {


                    var col = [];
                    col.push('id');
                    for (var i = 0; i < data.features.length; i++) {

                        for (var key in data.features[i].properties) {

                            if (col.indexOf(key) === -1) {
                                col.push(key);
                            }
                        }
                    }



                    var table = document.createElement("table");
                    table.setAttribute("class", "table table-hover table-striped");
                    table.setAttribute("id", "table");

                    var caption = document.createElement("caption");
                    caption.setAttribute("id", "caption");
                    caption.style.captionSide = 'top';
                    caption.innerHTML = value_layer + " (Number of Features : " + data.features.length + " )";
                    table.appendChild(caption);



                    // CREATE HTML TABLE HEADER ROW USING THE EXTRACTED HEADERS ABOVE.

                    var tr = table.insertRow(-1); // TABLE ROW.

                    for (var i = 0; i < col.length; i++) {
                        var th = document.createElement("th"); // TABLE HEADER.
                        th.innerHTML = col[i];
                        tr.appendChild(th);
                    }

                    // ADD JSON DATA TO THE TABLE AS ROWS.
                    for (var i = 0; i < data.features.length; i++) {

                        tr = table.insertRow(-1);

                        for (var j = 0; j < col.length; j++) {
                            var tabCell = tr.insertCell(-1);
                            if (j == 0) {
                                tabCell.innerHTML = data.features[i]['id'];
                            } else {
                                //alert(data.features[i]['id']);
                                tabCell.innerHTML = data.features[i].properties[col[j]];
                                //alert(tabCell.innerHTML);
                            }
                        }
                    }


                    // FINALLY ADD THE NEWLY CREATED TABLE WITH JSON DATA TO A CONTAINER.
                    var divContainer = document.getElementById("table_data");
                    divContainer.innerHTML = "";
                    divContainer.appendChild(table);



                    document.getElementById('map').style.height = '71%';
                    document.getElementById('table_data').style.height = '29%';
                    map.updateSize();
                    addRowHandlers();

                });
                map.on('singleclick', highlight);

            });


        }


    }
}


//measuretype change
/**
 * Let user change the geometry type.
 */
measuretype.onchange = function() {
    map.un('singleclick', getinfo);
    document.getElementById("info_btn").innerHTML = "Info";    
  
    map.removeInteraction(draw);
    addInteraction();
};



var source = new ol.source.Vector();
var vectorLayer = new ol.layer.Vector({
    //title: 'layer',
    source: source,
    style: new ol.style.Style({
        fill: new ol.style.Fill({
            color: 'rgba(255, 255, 255, 0.2)'
        }),
        stroke: new ol.style.Stroke({
            color: '#ffcc33',
            width: 2
        }),
        image: new ol.style.Circle({
            radius: 7,
            fill: new ol.style.Fill({
                color: '#ffcc33'
            })
        })
    })
});

map.addLayer(vectorLayer);
/**
 * Currently drawn feature.
 * @type {module:ol/Feature~Feature}
 */
var sketch;

/**
 * The help tooltip element.
 * @type {Element}
 */
var helpTooltipElement;

/**
 * Overlay to show the help messages.
 * @type {module:ol/Overlay}
 */
var helpTooltip;

/**
 * The measure tooltip element.
 * @type {Element}
 */
var measureTooltipElement;

/**
 * Overlay to show the measurement.
 * @type {module:ol/Overlay}
 */
var measureTooltip;

/**
 * Message to show when the user is drawing a polygon.
 * @type {string}
 */
var continuePolygonMsg = 'Click to continue drawing the polygon';

/**
 * Message to show when the user is drawing a line.
 * @type {string}
 */
var continueLineMsg = 'Click to continue drawing the line';

//var measuretype = document.getElementById('measuretype');

var draw; // global so we can remove it later

/**
 * Format length output.
 * @param {module:ol/geom/LineString~LineString} line The line.
 * @return {string} The formatted length.
 */
var formatLength = function(line) {
    var length = ol.sphere.getLength(line, {
        projection: 'EPSG:4326'
    });
    //var length = getLength(line);
    //var length = line.getLength({projection:'EPSG:4326'});

    var output;
    if (length > 100) {
        output = (Math.round(length / 1000 * 100) / 100) +
            ' ' + 'km';

    } else {
        output = (Math.round(length * 100) / 100) +
            ' ' + 'm';

    }
    return output;

};

/**
 * Format area output.
 * @param {module:ol/geom/Polygon~Polygon} polygon The polygon.
 * @return {string}// Formatted area.
 */
var formatArea = function(polygon) {
    // var area = getArea(polygon);
    var area = ol.sphere.getArea(polygon, {
        projection: 'EPSG:4326'
    });
    // var area = polygon.getArea();
    //alert(area);
    var output;
    if (area > 10000) {
        output = (Math.round(area / 1000000 * 100) / 100) +
            ' ' + 'km<sup>2</sup>';
    } else {
        output = (Math.round(area * 100) / 100) +
            ' ' + 'm<sup>2</sup>';
    }
    return output;
};

function addInteraction() {

    if (measuretype.value == 'select' || measuretype.value == 'clear') {

        if (draw) {
            map.removeInteraction(draw)
        };
        if (vectorLayer) {
            vectorLayer.getSource().clear();
        }
        if (helpTooltip) {
            map.removeOverlay(helpTooltip);
        }
        if (measureTooltipElement) {
            var elem = document.getElementsByClassName("tooltip tooltip-static");
            //$('#measure_tool').empty(); 

            //alert(elem.length);
            for (var i = elem.length - 1; i >= 0; i--) {

                elem[i].remove();
                //alert(elem[i].innerHTML);
            }
        }
        //var elem1 = elem[0].innerHTML;
        //alert(elem1);

    } else if (measuretype.value == 'area' || measuretype.value == 'length') {
        var type;
        if (measuretype.value == 'area') {
            type = 'Polygon';
        } else if (measuretype.value == 'length') {
            type = 'LineString';
        }
        //alert(type);
        //var type = (measuretype.value == 'area' ? 'Polygon' : 'LineString');
        draw = new ol.interaction.Draw({
            source: source,
            type: type,
            style: new ol.style.Style({
                fill: new ol.style.Fill({
                    color: 'rgba(255, 255, 255, 0.5)'
                }),
                stroke: new ol.style.Stroke({
                    color: 'rgba(0, 0, 0, 0.5)',
                    lineDash: [10, 10],
                    width: 2
                }),
                image: new ol.style.Circle({
                    radius: 5,
                    stroke: new ol.style.Stroke({
                        color: 'rgba(0, 0, 0, 0.7)'
                    }),
                    fill: new ol.style.Fill({
                        color: 'rgba(255, 255, 255, 0.5)'
                    })
                })
            })
        });
        map.addInteraction(draw);
        createMeasureTooltip();
        createHelpTooltip();
        /**
         * Handle pointer move.
         * @param {module:ol/MapBrowserEvent~MapBrowserEvent} evt The event.
         */
        var pointerMoveHandler = function(evt) {
            if (evt.dragging) {
                return;
            }
            /** @type {string} */
            var helpMsg = 'Click to start drawing';

            if (sketch) {
                var geom = (sketch.getGeometry());
                if (geom instanceof ol.geom.Polygon) {

                    helpMsg = continuePolygonMsg;
                } else if (geom instanceof ol.geom.LineString) {
                    helpMsg = continueLineMsg;
                }
            }

            helpTooltipElement.innerHTML = helpMsg;
            helpTooltip.setPosition(evt.coordinate);

            helpTooltipElement.classList.remove('hidden');
        };

        map.on('pointermove', pointerMoveHandler);

        map.getViewport().addEventListener('mouseout', function() {
            helpTooltipElement.classList.add('hidden');
        });


        var listener;
        draw.on('drawstart',
            function(evt) {
                sketch = evt.feature;

                /** @type {module:ol/coordinate~Coordinate|undefined} */
                var tooltipCoord = evt.coordinate;

                listener = sketch.getGeometry().on('change', function(evt) {
                    var geom = evt.target;

                    var output;
                    if (geom instanceof ol.geom.Polygon) {

                        output = formatArea(geom);
                        tooltipCoord = geom.getInteriorPoint().getCoordinates();

                    } else if (geom instanceof ol.geom.LineString) {

                        output = formatLength(geom);
                        tooltipCoord = geom.getLastCoordinate();
                    }
                    measureTooltipElement.innerHTML = output;
                    measureTooltip.setPosition(tooltipCoord);
                });
            }, this);

        draw.on('drawend',
            function() {
                measureTooltipElement.className = 'tooltip tooltip-static';
                measureTooltip.setOffset([0, -7]);
                // unset sketch
                sketch = null;
                // unset tooltip so that a new one can be created
                measureTooltipElement = null;
                createMeasureTooltip();
                ol.Observable.unByKey(listener);
            }, this);

    }
}
/**
 * Creates a new help tooltip
 */
function createHelpTooltip() {
    if (helpTooltipElement) {
        helpTooltipElement.parentNode.removeChild(helpTooltipElement);
    }
    helpTooltipElement = document.createElement('div');
    helpTooltipElement.className = 'tooltip hidden';
    helpTooltip = new ol.Overlay({
        element: helpTooltipElement,
        offset: [15, 0],
        positioning: 'center-left'
    });
    map.addOverlay(helpTooltip);
}
/**
 * Creates a new measure tooltip
 */
function createMeasureTooltip() {
    if (measureTooltipElement) {
        measureTooltipElement.parentNode.removeChild(measureTooltipElement);
    }
    measureTooltipElement = document.createElement('div');
    measureTooltipElement.className = 'tooltip tooltip-measure';

    measureTooltip = new ol.Overlay({
        element: measureTooltipElement,
        offset: [0, -15],
        positioning: 'bottom-center'
    });
    map.addOverlay(measureTooltip);
}
function GetPrint()
{
    window.print();
}
//cloned dropdown menu on right panel to left panel
var measureTypeDropdownLeft = document.getElementById('additional_measuretype');
var measureTypeDropdownRight = document.getElementById('measuretype');

// Function to handle changes in dropdown selection
function handleDropdownChange() {
    // Set the selected option in the other dropdown list to match the current one
    if (this === measureTypeDropdownLeft) {
        measureTypeDropdownRight.value = this.value;
    } else {
        measureTypeDropdownLeft.value = this.value;
    }
}
// Attach event listener to both dropdown lists
measureTypeDropdownLeft.addEventListener('change', handleDropdownChange);
measureTypeDropdownRight.addEventListener('change', handleDropdownChange);
// Function to handle changes in dropdown selection
function handleDropdownChange() {
    // Set the selected option in the other dropdown list to match the current one
    if (this === measureTypeDropdownLeft) {
        measureTypeDropdownRight.value = this.value;

        // Trigger the change event on the right dropdown list to activate its associated tool
        var event = new Event('change');
        measureTypeDropdownRight.dispatchEvent(event);
    } else {
        measureTypeDropdownLeft.value = this.value;
    }
}


//mobile query tab dragabble ui

var queryTab = document.getElementById("query_tab");

// Variables to store initial touch position
var initialX = null;
var initialY = null;

// Add event listeners for touch events
queryTab.addEventListener("touchstart", touchStart, false);
queryTab.addEventListener("touchmove", touchMove, false);

// Touch event functions
function touchStart(event) {
    initialX = event.touches[0].clientX - parseFloat(getComputedStyle(queryTab).left);
    initialY = event.touches[0].clientY - parseFloat(getComputedStyle(queryTab).top);
}

function touchMove(event) {
    if (initialX === null || initialY === null) {
        return;
    }

    event.preventDefault();

    var currentX = event.touches[0].clientX - initialX;
    var currentY = event.touches[0].clientY - initialY;

    queryTab.style.left = currentX + "px";
    queryTab.style.top = currentY + "px";
}


