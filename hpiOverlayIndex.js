//HPI Variable: Create an Array of Overlays
var overlays = [];
var g_map;

function overlayClicked(event,overlayGrid){
	var lat = event.latLng.H;
	var lng = event.latLng.L;
	for (var i=0; i < images.length; i++) {
		if (lat >= images[i].swLatitude && lat <= images[i].neLatitude && lng >= images[i].swLongitude && lng <= images[i].neLongitude) {
			overlayGrid.getSelectionModel().select(i);
		}
	}
}

function select(record,map) {
    for (var i=0; i< overlays.length; i++) {
        if (record && record.get('title') == images[i].title) {
            overlays[i].setMap(map);      
        } else {
            overlays[i].setMap(null);                                
        }
    }	    
}

//Initialize Function
function initialize() {
    var isImageOn = true;
	var myLatLng = new google.maps.LatLng(
				(images[0].swLatitude + images[0].neLatitude)/2
				,(images[0].swLongitude + images[0].neLongitude) /2
	);
	var zoom = 20;
	var latDelta = Math.abs(images[0].swLatitude -  images[0].neLatitude);
	if (latDelta > 0.006) {
		zoom = 16;
	} else if (latDelta > 0.003) {
		zoom = 17;
	} else if (latDelta > 0.002) {
		zoom = 18;
	} else if (latDelta > 0.001) {
		zoom = 19;
	}
	var mapOptions = {
		zoom: zoom,
		tilt: 0,
		center: myLatLng,
		mapTypeId: google.maps.MapTypeId.SATELLITE
	};

	var map;
	
	Ext.create('Ext.data.Store', {
		storeId:'overlayStore',
		fields:['title', 'swLatitude', 'swLongitude','neLatitude','neLongitude','headerFile'],
		data:{'items':images},
		proxy: {
			type: 'memory',
			reader: {
				type: 'json',
				root: 'items'
			}
		}
	});
	
	var overlayGrid = Ext.create('Ext.grid.Panel', {
		flex : 2,
		store: Ext.data.StoreManager.lookup('overlayStore'),
		columns: [
			{ text: 'Image',  dataIndex: 'title', flex: 1 }
		],
		viewConfig : {
			stripeRows : true
		},
		dockedItems: [{
			xtype: 'slider',
			dock: 'bottom',
			minValue: 0,
			maxValue: 100,
			value : 100,
			listeners : {
				change : {
					fn: function(slider, newValue, thumb,eOpts) {
						for (var i=0; i<overlays.length; i++) {
							overlays[i].setOpacity(newValue/100.0);
						}
					}
				}
			}
		},{
			xtype: 'toolbar',
			dock: 'bottom',
			items: [
				{text:'Open',
				handler: function() {
					var records = overlayGrid.getSelectionModel().getSelection();
					if (records && records.length > 0) {
						document.location = records[0].get('headerFile');
					}
				}}
				,'->'
                                ,{text:'Toggle',handler:function() {
                                var records = overlayGrid.getSelectionModel().getSelection();
                                if (isImageOn) {
                                    select(null,map);
                                } else if (records && records.length > 0) {
                                    select(records[0],map);
					}
                                    isImageOn = !isImageOn;
				}}
			]
		}]
	});
								
	Ext.create('Ext.Viewport', {
		layout : 'border',
		title : 'HPI',
		items : [ {
			xtype : 'panel',
			title : "Hyperspectral Overlays",
			region : 'west',
			width : 200,
			//collapsible: true,
			layoutX : 'border',
			layout: {
				type: 'vbox',
				align: 'stretch',
				padding: 5
			},
			items : [{
				type: 'panel',
				border : false,
				region : 'north',
				html : '<img border="0" alt="headwallphotonics.com" src="http://apps.headwallphotonics.com/headwall-photonics-logo.gif" width="150" height="78">',
				margins : '0 0 8 5'
			},overlayGrid]
		}, {
			xtype : 'box',
			region : 'center',
			html: '<div id="map-canvas"></div>'
		}],
		renderTo : Ext.getBody()
	});
	
	map = new google.maps.Map(document.getElementById('map-canvas'),mapOptions);
	g_map = map;		  
	for (var i=0; i < images.length; i++) {
		var latOffset = images[i].latitudeOffset;
		var longOffset = images[i].longitudeOffset;
		var swBound = new google.maps.LatLng(images[i].swLatitude - latOffset, images[i].swLongitude - longOffset);
		var neBound = new google.maps.LatLng(images[i].neLatitude - latOffset, images[i].neLongitude - longOffset);
		var bounds = new google.maps.LatLngBounds(swBound, neBound);
		
		var hpiOverlay = new google.maps.GroundOverlay(images[i].imageSource, bounds);
		//hpiOverlay.setMap(map);
		overlays.push(hpiOverlay);
		google.maps.event.addListener(hpiOverlay,'click',function(event) {
			overlayClicked(event,overlayGrid);
		});		
	}  
	
	overlayGrid.on('itemclick',function( grid, record)
	{	
		var coordinates = new google.maps.LatLng(
			(record.get('swLatitude') + record.get('neLatitude'))/2
			, (record.get('swLongitude') + record.get('neLongitude')) /2
			);
		map.setCenter(coordinates);
		select(record,map);
	},overlayGrid);
	
        overlayGrid.getView().select(0);
        overlays[0].setMap(map);    
}
