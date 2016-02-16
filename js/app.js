function AppViewModel() {
    //-----Delivering object handler----//
    var self = this;
    var searchPos,
        infowindow,
        latInfo,
        lngInfo,
        map;
    var default_ExploreKeyWord = 'best nearby';
    //------Observable data--------------//
    self.search_location = ko.observable();
    self.exploreKeyword = ko.observable(default_ExploreKeyWord);

    //function getNearby
    //---------Inner function-------//
    function setMapCenterMarker(position) {
        map.panTo(position.geometry.location);//move the map to searched result place
        //Create single market for the searched location point
        var positionIcon = {
            path: 'M0-48c-9.8 0-17.7 7.8-17.7 17.4 0 15.5 17.7 30.6 17.7 30.6s17.7-15.4 17.7-30.6c0-9.6-7.9-17.4-17.7-17.4z',
            fillColor: 'black',
            fillOpacity: 1,
            scale: 0.5
        };
        var positionMarker = new google.maps.Marker({
            map: map,
            position: position.geometry.location,
            title: position.name,
            icon: positionIcon
        });
        //Add event listener to the position Marker
        positionContent = "<h2>"+positionMarker.getTitle()+"<h2>";
            infowindow = new google.maps.InfoWindow({
            content: positionContent
        });
        positionMarker.addListener('click', function() {
            //map.setZoom(8);
            map.setCenter(positionMarker.getPosition());//move the center to the position marker if not in there
            infowindow.open(map, positionMarker);
        });
    }
    //------------Request foursquare info---------------//
    function getFourSquareInfo() {
        var exploreURL = 'https://api.foursquare.com/v2/venues/explore?';
        var date_info = '&v='+getCurrentDate();
        var client_info = 'client_id=S1RJQM0E1RW01XHHNRHUD4ZCVO0JX2ELJHIJAPYNVGDU0TCO&client_secret=RS3IT5QWQJ34P20FSPDMMSFJ1NLUCY14LRZB31WAS2AKAUJZ'+date_info;
        var query = '&query=' + self.exploreKeyword();
        var positionInfo = '&ll='+latInfo+','+lngInfo;
        var ajaxURL = exploreURL+client_info + positionInfo + query;
        //------Ajax request------//
        $.ajax({
            url : ajaxURL,
            success : function(data){
                console.log('request successful');
                console.log(data);
            },
            complete: function() {
                //if(self.topPicks().length === 0)
                    //$('#foursquare-API-error').html('<h2>No result available.</h2><h2>Please change your keywords.</h2>');
                console.log("result completed");
            },
            error: function( data ) {
                //$('#foursquare-API-error').html('<h2>There are errors when retrieving venue data. Please try refresh page later.</h2>');
                console.log('data request error');
            }
        });
    }
    function getGeographyInfoCallBack(placeList, status) {
        //The response do not contain a valid result
        if(status != google.maps.places.PlacesServiceStatus.OK) {
            $('#Map_Loading_Error').html('<h2>Errors in searching</h2><h2>Try other position name</h2>');
            return;
        }

        var searchPlace = placeList[0];
        console.log(searchPlace.geometry.location.toString());
        setMapCenterMarker(searchPlace);
        latInfo = searchPlace.geometry.location.lat();
        lngInfo = searchPlace.geometry.location.lng();
        //-------Request map info and draw marker----------//
        getFourSquareInfo();
    }
    function getGeographyInfo(locationName) {
        var request = {
            query: locationName
        };
        searchService = new google.maps.places.PlacesService(map);
        searchService.textSearch(request, getGeographyInfoCallBack);
    }

    function getCurrentDate() {
        var date = new Date();
        var year = date.getFullYear()+'';
        var month = date.getMonth()+1;
        month = month > 9?month+'':'0'+month;
        var day = date.getDate();
        day = day > 9?day+'':'0'+day;
        return year+month+day;
    }
    //Function for initializing map
    function initializeMap() {
        mapOptions = {
            center: {lat: 37.777158, lng: -122.4185117},//just for test, initial position
            zoom: 15,
            diableDefaultUI: true
        };
        if(typeof google == 'undefined') {
            $('#Map_Loading_Error').html('<h2>Errors in retriving map</h2><h2>Check network and try refresh page later.</h2>');
            return;
        }
        map = new google.maps.Map(document.getElementById('Map_Canvas'), mapOptions);
        $('#Map_Canvas').height($(window).height());//Set the height of map to the height of whole window
    };
    initializeMap();//Initialize
    window.addEventListener('resize', function(e) {
        //map.panTo(new google.maps.LatLng(34.037253, -118.246974));
        $('#map-canvas').height($(window).height());
    });
    //-------Search function triggered by search button------//
    self.searchPos=function() {
        searchPos = self.search_location();
        console.log("Input position is "+searchPos);
        self.search_location("");
        //----------------------//
        getGeographyInfo(searchPos);
    }
}

//Initialize the AppViewModel
$(function() {
    ko.applyBindings(new AppViewModel());
});